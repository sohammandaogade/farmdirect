"""
Test Suite: Agent Crop-Verification Workflow
Verifies:
1. Farmer creates listing -> status starts as PENDING_AGENT_REVIEW.
2. PENDING_AGENT_REVIEW is hidden from the Buyer Marketplace.
3. Non-agent roles are blocked (403) from Agent review endpoints.
4. Agent review REJECT requires a rejection reason and sets status to REJECTED.
5. REJECTED listing is hidden from Buyer Marketplace and farmer cannot toggle status.
6. Agent review APPROVE sets status to APPROVED.
7. APPROVED listing is immediately visible in Buyer Marketplace.
"""
import unittest
import json
from app import create_app, db
from models import User, ProduceListing, Notification

class TestAgentWorkflow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        self.assertEqual(res.status_code, 200, f"Login failed for {email}: {res.data}")
        data = res.get_json()['data']
        return data['token'], data['user']

    def test_agent_login(self):
        token, user = self._login('agent@farmdirect.demo', 'agent123')
        self.assertEqual(user['role'], 'agent')

    def test_complete_workflow(self):
        # 1. Login Farmer, Agent, and Buyer
        farmer_token, farmer_user = self._login('farmer@farmdirect.demo', 'password123')
        agent_token, agent_user = self._login('agent@farmdirect.demo', 'agent123')
        buyer_token, buyer_user = self._login('buyer@farmdirect.demo', 'password123')

        farmer_headers = {'Authorization': f'Bearer {farmer_token}'}
        agent_headers = {'Authorization': f'Bearer {agent_token}'}
        buyer_headers = {'Authorization': f'Bearer {buyer_token}'}

        # 2. Farmer creates a new listing
        new_listing_data = {
            'crop': 'Wheat',
            'variety': 'Sharbati Gold',
            'quantity': 5000,
            'unit': 'kg',
            'expected_price': 42.0,
            'location': 'Pune',
            'availability_date': '2026-10-15',
            'quality_grade': 'Grade A',
            'image_url': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b',
            'description': 'Premium organic wheat harvest'
        }
        res = self.client.post('/api/farmers/listings', json=new_listing_data, headers=farmer_headers)
        self.assertEqual(res.status_code, 201, f"Failed to create listing: {res.data}")
        listing_data = res.get_json()['data']
        listing_id = listing_data['id']
        self.assertEqual(listing_data['status'], 'PENDING_AGENT_REVIEW')
        self.assertIn('verification_key', listing_data, "Farmer must receive unique verification key")
        key_1 = listing_data['verification_key']
        self.assertTrue(key_1.startswith('VRF-'), "Verification key should follow VRF-XXXXXX format")

        # 3. Verify PENDING_AGENT_REVIEW does NOT appear in Buyer Marketplace
        res = self.client.get('/api/marketplace')
        self.assertEqual(res.status_code, 200)
        marketplace_listings = res.get_json()['data']
        found_in_marketplace = any(l['id'] == listing_id for l in marketplace_listings)
        self.assertFalse(found_in_marketplace, "Pending listing must NOT appear in marketplace")

        # 4. Non-agent (buyer or farmer) cannot access agent portal
        res = self.client.get('/api/agent/listings', headers=buyer_headers)
        self.assertEqual(res.status_code, 403)
        res = self.client.get('/api/agent/listings', headers=farmer_headers)
        self.assertEqual(res.status_code, 403)

        # 5. Agent accesses listings and sees the pending listing
        res = self.client.get('/api/agent/listings', headers=agent_headers)
        self.assertEqual(res.status_code, 200)
        res_json = res.get_json()
        self.assertIn('metrics', res_json)
        self.assertGreaterEqual(res_json['metrics']['pending'], 1)
        found_in_agent_queue = any(l['id'] == listing_id for l in res_json['data'])
        self.assertTrue(found_in_agent_queue, "Pending listing must appear in agent review queue")
        
        # Verify the agent does NOT see the secret verification key in the browse queue
        agent_item = next(l for l in res_json['data'] if l['id'] == listing_id)
        self.assertNotIn('verification_key', agent_item, "Agent browse queue must NOT leak farmer verification key")

        # 6. Agent rejects listing WITHOUT verification key -> should fail with 400
        res = self.client.post(
            f'/api/agent/listings/{listing_id}/review',
            json={'decision': 'REJECT', 'rejection_reason': 'Invalid quality docs.'},
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 400, "Review without verification key must fail with 400")

        # 7. Agent rejects listing WITH WRONG verification key -> should fail with 403
        res = self.client.post(
            f'/api/agent/listings/{listing_id}/review',
            json={'decision': 'REJECT', 'verification_key': 'VRF-WRONG99', 'rejection_reason': 'Invalid quality docs.'},
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 403, "Review with incorrect verification key must fail with 403")

        # 8. Agent rejects listing WITH valid key but WITHOUT reason -> should fail with 400
        res = self.client.post(
            f'/api/agent/listings/{listing_id}/review',
            json={'decision': 'REJECT', 'verification_key': key_1},
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 400, "Rejection without reason must fail with 400")

        # 9. Agent rejects listing WITH valid key AND reason
        rejection_reason = "Quality certificate missing moisture content test results."
        res = self.client.post(
            f'/api/agent/listings/{listing_id}/review',
            json={'decision': 'REJECT', 'verification_key': key_1, 'rejection_reason': rejection_reason},
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 200)
        rejected_data = res.get_json()['data']
        self.assertEqual(rejected_data['status'], 'REJECTED')
        self.assertEqual(rejected_data['rejection_reason'], rejection_reason)
        self.assertEqual(rejected_data['reviewed_by_id'], agent_user['id'])

        # 10. Verify REJECTED listing is NOT in marketplace
        res = self.client.get('/api/marketplace')
        self.assertEqual(res.status_code, 200)
        marketplace_listings = res.get_json()['data']
        self.assertFalse(any(l['id'] == listing_id for l in marketplace_listings))

        # 11. Verify Farmer cannot toggle status of REJECTED listing
        res = self.client.put(
            f'/api/farmers/listings/{listing_id}/status',
            json={'status': 'ACTIVE'},
            headers=farmer_headers
        )
        self.assertEqual(res.status_code, 400, "Farmer must not be able to activate rejected listing")

        # 12. Farmer creates a second listing to test APPROVE
        new_listing_data2 = {
            'crop': 'Tomato',
            'variety': 'Roma Grade A',
            'quantity': 5000,
            'unit': 'kg',
            'expected_price': 35.0,
            'location': 'Nashik',
            'availability_date': '2026-10-18',
            'quality_grade': 'Grade A+',
            'image_url': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
            'description': 'Fresh high-yield Roma tomatoes'
        }
        res = self.client.post('/api/farmers/listings', json=new_listing_data2, headers=farmer_headers)
        self.assertEqual(res.status_code, 201)
        listing_data_2 = res.get_json()['data']
        listing_id_2 = listing_data_2['id']
        key_2 = listing_data_2['verification_key']
        self.assertTrue(key_2.startswith('VRF-'))

        # 13. Agent APPROVE fails without verification key -> 400
        res = self.client.post(
            f'/api/agent/listings/{listing_id_2}/review',
            json={'decision': 'APPROVE', 'agent_review': 'Verified Grade A+ tomatoes at field inspection.'},
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 400, "Approval without verification key must fail with 400")

        # 14. Agent APPROVE fails with invalid verification key -> 403
        res = self.client.post(
            f'/api/agent/listings/{listing_id_2}/review',
            json={'decision': 'APPROVE', 'verification_key': 'VRF-INVALID', 'agent_review': 'Verified Grade A+ tomatoes at field inspection.'},
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 403, "Approval with wrong verification key must fail with 403")

        # 15. Agent APPROVE fails with valid key but missing/short review notes -> 400
        res = self.client.post(
            f'/api/agent/listings/{listing_id_2}/review',
            json={'decision': 'APPROVE', 'verification_key': key_2, 'agent_review': 'Good'},
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 400, "Approval with review note < 10 chars must fail with 400")

        # 16. Agent successfully APPROVES listing with valid key and thorough inspection review
        inspection_review_text = "Inspected on-site at Nashik farm. Moisture content 92%, brix 4.8%, Grade A+ certified under MahaAgri standards."
        res = self.client.post(
            f'/api/agent/listings/{listing_id_2}/review',
            json={
                'decision': 'APPROVE',
                'verification_key': key_2,
                'agent_review': inspection_review_text
            },
            headers=agent_headers
        )
        self.assertEqual(res.status_code, 200)
        approved_data = res.get_json()['data']
        self.assertEqual(approved_data['status'], 'PUBLISHED')
        self.assertEqual(approved_data['agent_review'], inspection_review_text)
        self.assertIsNotNone(approved_data['reviewed_at'])
        self.assertEqual(approved_data['reviewed_by_id'], agent_user['id'])

        # 17. Verify APPROVED listing IS now visible in the Buyer Marketplace!
        res = self.client.get('/api/marketplace')
        self.assertEqual(res.status_code, 200)
        marketplace_listings = res.get_json()['data']
        found_in_marketplace = any(l['id'] == listing_id_2 for l in marketplace_listings)
        self.assertTrue(found_in_marketplace, "Approved listing MUST be visible in Buyer Marketplace")

        # Verify public marketplace listing includes agent_review but NOT verification_key
        mp_item = next(l for l in marketplace_listings if l['id'] == listing_id_2)
        self.assertEqual(mp_item['agent_review'], inspection_review_text, "Public marketplace must show agent inspection review")
        self.assertNotIn('verification_key', mp_item, "Public marketplace listing must NEVER contain verification key")

        # 18. Verify direct detail access to published listing has traceability and agent_review
        res = self.client.get(f'/api/marketplace/{listing_id_2}')
        self.assertEqual(res.status_code, 200)
        detail_data = res.get_json()['data']
        self.assertEqual(detail_data['agent_review'], inspection_review_text)
        self.assertNotIn('verification_key', detail_data, "Listing detail must NEVER contain verification key")
        self.assertIn('agent_agency', detail_data)
        self.assertIn('agent_name', detail_data)
        self.assertIn('farm_name', detail_data)
        self.assertIn('farmer_name', detail_data)

        # 19. Verify direct detail access to REJECTED listing returns 404
        res = self.client.get(f'/api/marketplace/{listing_id}')
        self.assertEqual(res.status_code, 404, "Unpublished/rejected listing detail must return 404 to public buyer")

    def test_agent_profile_endpoints(self):
        token, user = self._login('agent@farmdirect.demo', 'agent123')
        agent_headers = {'Authorization': f'Bearer {token}'}

        # GET Profile
        res = self.client.get('/api/agent/profile', headers=agent_headers)
        self.assertEqual(res.status_code, 200)
        profile_data = res.get_json()['data']
        self.assertIn('agency_name', profile_data)
        self.assertIn('operating_district', profile_data)
        self.assertIn('stats', profile_data)
        self.assertIn('pending_requests', profile_data['stats'])
        self.assertIn('accepted_requests', profile_data['stats'])

        # PUT Profile update
        update_payload = {
            'agency_name': 'Maharashtra Agro Verification Council',
            'operating_district': 'Pune, Satara & Solapur',
            'phone': '+91 98765 43210'
        }
        res = self.client.put('/api/agent/profile', json=update_payload, headers=agent_headers)
        self.assertEqual(res.status_code, 200)

        # Re-fetch and verify changes persisted
        res = self.client.get('/api/agent/profile', headers=agent_headers)
        self.assertEqual(res.status_code, 200)
        updated_data = res.get_json()['data']
        self.assertEqual(updated_data['agency_name'], 'Maharashtra Agro Verification Council')
        self.assertEqual(updated_data['operating_district'], 'Pune, Satara & Solapur')
        self.assertEqual(updated_data['phone'], '+91 98765 43210')

    def test_agent_registration(self):
        import time
        unique_email = f"agent_new_{int(time.time())}@farmdirect.demo"
        reg_payload = {
            'role': 'agent',
            'name': 'Inspector Vikram Deshmukh',
            'email': unique_email,
            'phone': '9890123456',
            'password': 'SecurePassword123',
            'agency_name': 'Nashik Agro Quality Control Bureau',
            'operating_district': 'Nashik & Northern Maharashtra',
            'license_number': 'AGY-NSK-2026-902'
        }
        res = self.client.post('/api/auth/register', json=reg_payload)
        self.assertEqual(res.status_code, 201, f"Agent registration failed: {res.data}")
        data = res.get_json()['data']
        self.assertEqual(data['user']['role'], 'agent')
        self.assertEqual(data['user']['name'], 'Inspector Vikram Deshmukh')

        # Verify new agent can immediately access the Agent Dashboard API
        agent_token = data['token']
        agent_headers = {'Authorization': f'Bearer {agent_token}'}
        res = self.client.get('/api/agent/profile', headers=agent_headers)
        self.assertEqual(res.status_code, 200)
        profile_data = res.get_json()['data']
        self.assertEqual(profile_data['agency_name'], 'Nashik Agro Quality Control Bureau')
        self.assertEqual(profile_data['operating_district'], 'Nashik & Northern Maharashtra')
        self.assertEqual(profile_data['license_number'], 'AGY-NSK-2026-902')

if __name__ == '__main__':
    unittest.main()
