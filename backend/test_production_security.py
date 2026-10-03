"""
Production Hardening, Security, AI Anti-Bypass, and Live Market Grounding Test Suite.
Verifies:
1. Quality inspection auth enforcement (only authenticated farmers, no client-supplied farmer_id tampering).
2. Inspection ownership protection (farmers cannot bind other farmers' inspections).
3. Stale inspection reuse rejection (cannot attach already-used inspections).
4. Listing update anti-tamper (changing image/crop forces re-inspection or pauses listing).
5. Listing update with rotten produce blocked (HTTP 422).
6. MarketDataService official normalization schema, caching TTL, and trend calculation.
7. Farmer Copilot grounding with verified Agmarknet APMC quotes.
"""

import unittest
import io
import json
from datetime import datetime, date
from PIL import Image
import numpy as np

from app import app
from database import db
from models import User, ProduceListing, QualityInspection, PurchaseRequest
from utils.auth import generate_token
from services.market_data_service import MarketDataService
from services.ai.copilot_service import CopilotService


def make_sample_image_bytes():
    arr = np.full((120, 120, 3), [220, 45, 35], dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()


class TestProductionSecurityAndGrounding(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.app = app
        cls.client = app.test_client()

        with app.app_context():
            from seed import ensure_schema_columns
            db.create_all()
            ensure_schema_columns()

            # Create Farmer 1
            f1 = User.query.filter_by(email="farmer1_security@farmdirect.io").first()
            if not f1:
                f1 = User(name="Farmer Ramesh", email="farmer1_security@farmdirect.io", role="farmer", phone="9822001122")
                f1.set_password("SecurePass123!")
                db.session.add(f1)
                db.session.commit()
            cls.farmer1_id = f1.id
            cls.token1 = generate_token(f1)
            cls.auth1 = {'Authorization': f'Bearer {cls.token1}'}

            # Create Farmer 2 (Adversary/Distinct User)
            f2 = User.query.filter_by(email="farmer2_security@farmdirect.io").first()
            if not f2:
                f2 = User(name="Farmer Suresh", email="farmer2_security@farmdirect.io", role="farmer", phone="9822003344")
                f2.set_password("SecurePass123!")
                db.session.add(f2)
                db.session.commit()
            cls.farmer2_id = f2.id
            cls.token2 = generate_token(f2)
            cls.auth2 = {'Authorization': f'Bearer {cls.token2}'}

            # Create Buyer
            b = User.query.filter_by(email="buyer_security@farmdirect.io").first()
            if not b:
                b = User(name="Wholesale Buyer", email="buyer_security@farmdirect.io", role="buyer", phone="9822005566")
                b.set_password("SecurePass123!")
                db.session.add(b)
                db.session.commit()
            cls.buyer_id = b.id
            cls.buyer_token = generate_token(b)
            cls.buyer_auth = {'Authorization': f'Bearer {cls.buyer_token}'}

            # Create Admin
            adm = User.query.filter_by(email="admin_security@farmdirect.io").first()
            if not adm:
                adm = User(name="Security Admin", email="admin_security@farmdirect.io", role="admin", phone="9822007788")
                adm.set_password("SecurePass123!")
                db.session.add(adm)
                db.session.commit()
            cls.admin_id = adm.id
            cls.admin_token = generate_token(adm)
            cls.admin_auth = {'Authorization': f'Bearer {cls.admin_token}'}

    # -------------------------------------------------------------------------
    # TEST 1: Quality Inspection Endpoint Authentication & Role Enforcement
    # -------------------------------------------------------------------------
    def test_01_quality_inspection_auth_and_role_security(self):
        with self.app.app_context():
            img_bytes = make_sample_image_bytes()

            # 1. Unauthenticated request -> HTTP 401
            data1 = {'image': (io.BytesIO(img_bytes), 'produce.jpg'), 'crop': 'Tomato'}
            resp = self.client.post('/api/quality/upload-inspect', data=data1, content_type='multipart/form-data')
            self.assertEqual(resp.status_code, 401)

            # 2. Buyer request -> HTTP 403 (Farmers only)
            data2 = {'image': (io.BytesIO(img_bytes), 'produce.jpg'), 'crop': 'Tomato'}
            resp = self.client.post('/api/quality/upload-inspect', data=data2, headers=self.buyer_auth, content_type='multipart/form-data')
            self.assertEqual(resp.status_code, 403)

            # 3. Farmer 1 request with attempted farmer_id tampering (tamper to farmer2)
            data_tamper = {
                'image': (io.BytesIO(img_bytes), 'produce.jpg'),
                'crop': 'Tomato',
                'farmer_id': self.farmer2_id  # Client attempt to forge inspection under another farmer
            }
            resp = self.client.post('/api/quality/upload-inspect', data=data_tamper, headers=self.auth1, content_type='multipart/form-data')
            self.assertEqual(resp.status_code, 200)
            body = resp.get_json()
            # Server MUST ignore the forged farmer_id and bind to authenticated user (farmer1)
            self.assertEqual(body['farmer_id'], self.farmer1_id)
            self.assertNotEqual(body['farmer_id'], self.farmer2_id)
            print("  [PASS] Security Test 1: /api/quality/upload-inspect strictly enforces farmer role and rejects farmer_id tampering.")

    # -------------------------------------------------------------------------
    # TEST 2: Inspection Ownership Enforcement on Listing Creation
    # -------------------------------------------------------------------------
    def test_02_listing_creation_inspection_ownership(self):
        with self.app.app_context():
            # Farmer 1 creates a valid inspection
            insp1 = QualityInspection(
                farmer_id=self.farmer1_id,
                image_url="/uploads/f1_photo.jpg",
                image_hash="abc123hash",
                declared_grade="Grade A",
                ai_assessed_grade="Grade A",
                expected_crop="Tomato",
                detected_crop="Tomato",
                verification_status="VERIFIED_ALIGNED",
                visible_defect_level="LOW"
            )
            db.session.add(insp1)
            db.session.commit()

            # Farmer 2 attempts to use Farmer 1's inspection
            f2_listing_payload = {
                'crop': 'Tomato',
                'quantity': 500,
                'expected_price': 30,
                'location': 'Pune',
                'quality_grade': 'Grade A',
                'availability_date': '2026-10-10',
                'image_url': '/uploads/f1_photo.jpg',
                'inspection_id': insp1.id
            }
            resp = self.client.post('/api/farmers/listings', json=f2_listing_payload, headers=self.auth2)
            # Must be BLOCKED with HTTP 403 Forbidden
            self.assertEqual(resp.status_code, 403)
            self.assertIn("different farmer", resp.get_json()['message'])
            print("  [PASS] Security Test 2: Cross-farmer inspection binding blocked with HTTP 403.")

    # -------------------------------------------------------------------------
    # TEST 3: Stale Inspection Reuse Prevention
    # -------------------------------------------------------------------------
    def test_03_stale_inspection_reuse_prevention(self):
        with self.app.app_context():
            # Farmer 1 creates an inspection and attaches it to Listing A
            insp = QualityInspection(
                farmer_id=self.farmer1_id,
                image_url="/uploads/fresh_harvest.jpg",
                image_hash="freshharvest123",
                declared_grade="Grade A",
                ai_assessed_grade="Grade A",
                expected_crop="Potato",
                detected_crop="Potato",
                verification_status="VERIFIED_ALIGNED",
                visible_defect_level="LOW"
            )
            db.session.add(insp)
            db.session.commit()

            # Create first listing
            payload1 = {
                'crop': 'Potato',
                'quantity': 5000,
                'expected_price': 18,
                'location': 'Satara',
                'quality_grade': 'Grade A',
                'availability_date': '2026-10-15',
                'image_url': '/uploads/fresh_harvest.jpg',
                'inspection_id': insp.id
            }
            resp1 = self.client.post('/api/farmers/listings', json=payload1, headers=self.auth1)
            self.assertEqual(resp1.status_code, 201)

            # Attempt to create second listing reusing the SAME inspection
            payload2 = {
                'crop': 'Potato',
                'quantity': 5000,
                'expected_price': 20,
                'location': 'Satara',
                'quality_grade': 'Grade A',
                'availability_date': '2026-10-20',
                'image_url': '/uploads/fresh_harvest.jpg',
                'inspection_id': insp.id
            }
            resp2 = self.client.post('/api/farmers/listings', json=payload2, headers=self.auth1)
            # Must be BLOCKED with HTTP 409 Conflict
            self.assertEqual(resp2.status_code, 409)
            self.assertIn("already linked to another listing", resp2.get_json()['message'])
            print("  [PASS] Security Test 3: Stale inspection reuse strictly blocked with HTTP 409.")

    # -------------------------------------------------------------------------
    # TEST 4: Anti-Bypass Protection on Listing Updates
    # -------------------------------------------------------------------------
    def test_04_listing_update_anti_bypass(self):
        with self.app.app_context():
            # Farmer 1 has an active listing
            insp = QualityInspection(
                farmer_id=self.farmer1_id,
                image_url="/uploads/original_onion.jpg",
                image_hash="originalonionhash",
                declared_grade="Grade A",
                ai_assessed_grade="Grade A",
                expected_crop="Onion",
                detected_crop="Onion",
                verification_status="VERIFIED_ALIGNED",
                visible_defect_level="LOW"
            )
            db.session.add(insp)
            db.session.commit()

            listing = ProduceListing(
                farmer_id=self.farmer1_id,
                crop="Onion",
                quantity=1000,
                available_quantity=1000,
                unit="kg",
                expected_price=25,
                location="Nashik",
                quality_grade="Grade A",
                availability_date=date(2026, 10, 10),
                image_url="/uploads/original_onion.jpg",
                status="ACTIVE"
            )
            db.session.add(listing)
            db.session.commit()
            listing_id = listing.id

            # Case A: Farmer updates image without providing a new inspection
            # Server MUST set status to PAUSED pending re-inspection
            resp = self.client.put(f'/api/farmers/listings/{listing_id}', json={'image_url': '/uploads/uninspected_photo.jpg'}, headers=self.auth1)
            self.assertEqual(resp.status_code, 200)
            updated = db.session.get(ProduceListing, listing_id)
            self.assertEqual(updated.status, 'PAUSED')

            # Case B: Farmer attempts to update listing with a ROTTEN inspection
            rotten_insp = QualityInspection(
                farmer_id=self.farmer1_id,
                image_url="/uploads/rotten_produce.jpg",
                image_hash="rottenhロッパ",
                declared_grade="Grade A",
                ai_assessed_grade="Sub-standard / Rotten",
                expected_crop="Onion",
                detected_crop="Onion",
                verification_status="REJECTED",
                visible_defect_level="CRITICAL_SPOILAGE",
                assessment_notes="Severe fungal rot and decay."
            )
            db.session.add(rotten_insp)
            db.session.commit()

            resp_rotten = self.client.put(
                f'/api/farmers/listings/{listing_id}',
                json={'image_url': '/uploads/rotten_produce.jpg', 'inspection_id': rotten_insp.id},
                headers=self.auth1
            )
            # Must be BLOCKED with HTTP 422 Unprocessable Entity
            self.assertEqual(resp_rotten.status_code, 422)
            self.assertIn("rotten", resp_rotten.get_json()['message'].lower())
            print("  [PASS] Security Test 4: Listing update anti-bypass: uninspected changes paused; rotten produce blocked with HTTP 422.")

    # -------------------------------------------------------------------------
    # TEST 5: MarketDataService Schema Normalization, TTL Caching & Trends
    # -------------------------------------------------------------------------
    def test_05_market_data_service(self):
        summary = MarketDataService.get_market_summary("Onion", "Nashik")
        self.assertTrue(summary['has_data'])
        self.assertEqual(summary['crop'], 'Onion')
        self.assertGreaterEqual(summary['market_count'], 1)
        self.assertIn('best_paying_market', summary)

        # Check required normalized fields
        best = summary['best_paying_market']
        self.assertIn('modal_price_quintal', best)
        self.assertIn('modal_price_kg', best)
        self.assertIn('arrivals', best)

        # Check trend metrics
        trend = MarketDataService.get_price_trend("Onion")
        self.assertTrue(trend['has_trend'])
        self.assertIn(trend['direction'], ['UP', 'DOWN', 'STABLE'])
        self.assertIn('change_pct', trend)
        self.assertIn('verified_source', trend)
        print("  [PASS] Market Data Test 5: MarketDataService returns normalized schema with verified quotes and trends.")

    # -------------------------------------------------------------------------
    # TEST 6: Farmer Copilot Grounded APMC Pricing Facts
    # -------------------------------------------------------------------------
    def test_06_farmer_copilot_grounding(self):
        with self.app.app_context():
            res = CopilotService.get_farmer_copilot_response(
                self.farmer1_id,
                "What is the current onion mandi bhav in Nashik APMC?",
                explicit_lang="en"
            )
            self.assertTrue(res['category'] in ['AI_ASSISTANT', 'PRICE_INTELLIGENCE'])
            reply = res['reply']
            # Verified APMC rates or bulletin must be referenced
            self.assertTrue(
                "APMC" in reply or "Mandi" in reply or "₹" in reply or "Lasalgaon" in reply,
                f"Response was: {reply}"
            )
            print("  [PASS] Market Data Test 6: Farmer Copilot produces verified grounded market responses.")

    # -------------------------------------------------------------------------
    # TEST 7: Listing Status Toggle Anti-Bypass Protection
    # -------------------------------------------------------------------------
    def test_07_listing_status_toggle_anti_bypass(self):
        with self.app.app_context():
            # 1. Uninspected listing cannot be toggled to ACTIVE
            uninspected_listing = ProduceListing(
                farmer_id=self.farmer1_id,
                crop="Onion",
                quantity=800,
                available_quantity=800,
                unit="kg",
                expected_price=24,
                location="Nashik",
                quality_grade="Grade A",
                availability_date=date(2026, 10, 12),
                image_url="/uploads/no_inspection_pic.jpg",
                status="PAUSED"
            )
            db.session.add(uninspected_listing)
            db.session.commit()

            resp = self.client.put(
                f'/api/farmers/listings/{uninspected_listing.id}/status',
                json={'status': 'ACTIVE'},
                headers=self.auth1
            )
            self.assertEqual(resp.status_code, 422)
            self.assertEqual(resp.get_json()['status'], 'INSPECTION_REQUIRED')

            # 2. Rotten produce listing cannot be toggled to ACTIVE
            rotten_insp = QualityInspection(
                farmer_id=self.farmer1_id,
                image_url="/uploads/rotten_toggle.jpg",
                image_hash="rottentogglehash",
                declared_grade="Grade A",
                ai_assessed_grade="Sub-standard / Rotten",
                expected_crop="Tomato",
                detected_crop="Tomato",
                verification_status="REJECTED",
                visible_defect_level="CRITICAL_SPOILAGE",
                assessment_notes="Extensive rot detected."
            )
            db.session.add(rotten_insp)
            db.session.commit()

            rotten_listing = ProduceListing(
                farmer_id=self.farmer1_id,
                crop="Tomato",
                quantity=500,
                available_quantity=500,
                unit="kg",
                expected_price=20,
                location="Pune",
                quality_grade="Grade A",
                availability_date=date(2026, 10, 12),
                image_url="/uploads/rotten_toggle.jpg",
                status="PAUSED"
            )
            db.session.add(rotten_listing)
            db.session.flush()
            rotten_insp.listing_id = rotten_listing.id
            db.session.commit()

            resp_rotten = self.client.put(
                f'/api/farmers/listings/{rotten_listing.id}/status',
                json={'status': 'ACTIVE'},
                headers=self.auth1
            )
            self.assertEqual(resp_rotten.status_code, 422)
            self.assertEqual(resp_rotten.get_json()['status'], 'REJECTED')

            # 3. Mismatched crop listing cannot be toggled to ACTIVE
            mismatch_insp = QualityInspection(
                farmer_id=self.farmer1_id,
                image_url="/uploads/onion_not_tomato.jpg",
                image_hash="mismatchhash1",
                declared_grade="Grade A",
                ai_assessed_grade="Grade A",
                expected_crop="Tomato",
                detected_crop="Onion",
                verification_status="CROP_MISMATCH",
                visible_defect_level="LOW"
            )
            db.session.add(mismatch_insp)
            db.session.commit()

            mismatch_listing = ProduceListing(
                farmer_id=self.farmer1_id,
                crop="Tomato",
                quantity=600,
                available_quantity=600,
                unit="kg",
                expected_price=22,
                location="Pune",
                quality_grade="Grade A",
                availability_date=date(2026, 10, 12),
                image_url="/uploads/onion_not_tomato.jpg",
                status="PAUSED"
            )
            db.session.add(mismatch_listing)
            db.session.flush()
            mismatch_insp.listing_id = mismatch_listing.id
            db.session.commit()

            resp_mismatch = self.client.put(
                f'/api/farmers/listings/{mismatch_listing.id}/status',
                json={'status': 'ACTIVE'},
                headers=self.auth1
            )
            self.assertEqual(resp_mismatch.status_code, 422)
            self.assertEqual(resp_mismatch.get_json()['status'], 'CROP_MISMATCH')

            # 4. Valid inspected listing CAN be toggled to ACTIVE
            valid_insp = QualityInspection(
                farmer_id=self.farmer1_id,
                image_url="/uploads/sound_potato.jpg",
                image_hash="validtogg123",
                declared_grade="Grade A",
                ai_assessed_grade="Grade A",
                expected_crop="Potato",
                detected_crop="Potato",
                verification_status="VERIFIED_ALIGNED",
                visible_defect_level="LOW"
            )
            db.session.add(valid_insp)
            db.session.commit()

            valid_listing = ProduceListing(
                farmer_id=self.farmer1_id,
                crop="Potato",
                quantity=1200,
                available_quantity=1200,
                unit="kg",
                expected_price=22,
                location="Satara",
                quality_grade="Grade A",
                availability_date=date(2026, 10, 12),
                image_url="/uploads/sound_potato.jpg",
                status="PAUSED"
            )
            db.session.add(valid_listing)
            db.session.flush()
            valid_insp.listing_id = valid_listing.id
            db.session.commit()

            resp_valid = self.client.put(
                f'/api/farmers/listings/{valid_listing.id}/status',
                json={'status': 'ACTIVE'},
                headers=self.auth1
            )
            self.assertEqual(resp_valid.status_code, 200)
            self.assertEqual(resp_valid.get_json()['data']['status'], 'ACTIVE')
            print("  [PASS] Security Test 7: Listing status toggle anti-bypass strictly enforces inspection status.")

    # -------------------------------------------------------------------------
    # TEST 8: Digital Twin Telemetry Access Control
    # -------------------------------------------------------------------------
    def test_08_digital_twin_access_control(self):
        with self.app.app_context():
            # 1. Unauthenticated request -> HTTP 401
            resp1 = self.client.get(f'/api/digital-twin/farmer/{self.farmer1_id}')
            self.assertEqual(resp1.status_code, 401)

            # 2. Distinct farmer request -> HTTP 403 (Cannot inspect rival farmer finances)
            resp2 = self.client.get(f'/api/digital-twin/farmer/{self.farmer1_id}', headers=self.auth2)
            self.assertEqual(resp2.status_code, 403)

            # 3. Owner farmer request -> HTTP 200
            resp3 = self.client.get(f'/api/digital-twin/farmer/{self.farmer1_id}', headers=self.auth1)
            self.assertEqual(resp3.status_code, 200)
            self.assertEqual(resp3.get_json()['farmer_id'], self.farmer1_id)

            # 4. Platform Admin request -> HTTP 200
            resp4 = self.client.get(f'/api/digital-twin/farmer/{self.farmer1_id}', headers=self.admin_auth)
            self.assertEqual(resp4.status_code, 200)
            print("  [PASS] Security Test 8: Digital Twin telemetry access strictly restricted to owner or admin.")

    # -------------------------------------------------------------------------
    # TEST 9: Command Center and AI Diagnostics Protection
    # -------------------------------------------------------------------------
    def test_09_command_center_and_diagnose_admin_protection(self):
        with self.app.app_context():
            # 1. Simulator without admin token -> HTTP 401 or 403
            resp_sim_noauth = self.client.post('/api/command-center/simulate', json={'demand_change': 10})
            self.assertEqual(resp_sim_noauth.status_code, 401)

            resp_sim_farmer = self.client.post('/api/command-center/simulate', json={'demand_change': 10}, headers=self.auth1)
            self.assertEqual(resp_sim_farmer.status_code, 403)

            resp_sim_admin = self.client.post('/api/command-center/simulate', json={'demand_change': 10}, headers=self.admin_auth)
            self.assertEqual(resp_sim_admin.status_code, 200)

            # 2. Anomalies route without admin token -> HTTP 401 or 403
            resp_ano_farmer = self.client.get('/api/command-center/anomalies', headers=self.auth1)
            self.assertEqual(resp_ano_farmer.status_code, 403)

            resp_ano_admin = self.client.get('/api/command-center/anomalies', headers=self.admin_auth)
            self.assertEqual(resp_ano_admin.status_code, 200)

            # 3. /api/ai/diagnose must require admin and NEVER leak api_key_prefix
            resp_diag_unauth = self.client.get('/api/ai/diagnose')
            self.assertEqual(resp_diag_unauth.status_code, 401)

            resp_diag_farmer = self.client.get('/api/ai/diagnose', headers=self.auth1)
            self.assertEqual(resp_diag_farmer.status_code, 403)

            resp_diag_admin = self.client.get('/api/ai/diagnose', headers=self.admin_auth)
            self.assertEqual(resp_diag_admin.status_code, 200)
            diag_body = resp_diag_admin.get_json()['diagnostics']
            self.assertNotIn('api_key_prefix', diag_body)
            self.assertNotIn('GEMINI_API_KEY', str(diag_body))
            print("  [PASS] Security Test 9: Command Center and AI Diagnostics protected with zero credential leakage.")

    # -------------------------------------------------------------------------
    # TEST 10: Health Route Database Ping
    # -------------------------------------------------------------------------
    def test_10_health_route_database_connectivity(self):
        resp = self.client.get('/health')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['database'], 'connected')

        resp_api = self.client.get('/api/health')
        self.assertEqual(resp_api.status_code, 200)
        self.assertEqual(resp_api.get_json()['status'], 'ok')
        print("  [PASS] Operational Test 10: /health and /api/health verify active database connectivity.")


if __name__ == '__main__':
    unittest.main()
