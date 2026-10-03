import os
import io
import unittest
import sys
from datetime import date, datetime

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app
from database import db
from models import (
    User, FarmerProfile, BuyerProfile, ProduceListing,
    Order, PurchaseRequest, Negotiation, OrderStatusHistory,
    OrderComplaint, AnomalyEvent
)
from utils.auth import generate_token
from utils.validation import validate_indian_phone
from services.matching_engine import MatchingEngine
from services.ai.soil_report_service import SoilReportService

class TestPhaseHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.app = app
        cls.client = app.test_client()

        with app.app_context():
            # Get or create test farmer
            cls.farmer = User.query.filter_by(email="hardened_farmer@test.com").first()
            if not cls.farmer:
                cls.farmer = User(name="Hardened Farmer", email="hardened_farmer@test.com", phone="9876543210", role="farmer")
                cls.farmer.set_password("pass123")
                db.session.add(cls.farmer)
                db.session.flush()
                f_prof = FarmerProfile(user_id=cls.farmer.id, farm_name="Hardened Farm", location="Nashik")
                db.session.add(f_prof)
                db.session.commit()

            # Get or create test buyer
            cls.buyer = User.query.filter_by(email="hardened_buyer@test.com").first()
            if not cls.buyer:
                cls.buyer = User(name="Hardened Buyer", email="hardened_buyer@test.com", phone="9876543211", role="buyer")
                cls.buyer.set_password("pass123")
                db.session.add(cls.buyer)
                db.session.flush()
                b_prof = BuyerProfile(user_id=cls.buyer.id, business_name="Hardened Foods", buyer_type="Wholesaler", location="Pune")
                db.session.add(b_prof)
                db.session.commit()

            # Get or create admin
            cls.admin = User.query.filter_by(role="admin").first()
            if not cls.admin:
                cls.admin = User(name="System Admin", email="hardened_admin@test.com", phone="9876543212", role="admin")
                cls.admin.set_password("admin123")
                db.session.add(cls.admin)
                db.session.commit()

            # Create a reusable active listing for order tests
            cls.test_listing = ProduceListing.query.filter_by(farmer_id=cls.farmer.id, crop="Test Crop").first()
            if not cls.test_listing:
                cls.test_listing = ProduceListing(
                    farmer_id=cls.farmer.id,
                    crop="Test Crop",
                    quantity=10000.0,
                    available_quantity=10000.0,
                    unit="kg",
                    expected_price=25.0,
                    location="Nashik",
                    quality_grade="Grade A",
                    availability_date=date.today(),
                    status="ACTIVE"
                )
                db.session.add(cls.test_listing)
                db.session.commit()

            cls.farmer_id = cls.farmer.id
            cls.buyer_id = cls.buyer.id
            cls.test_listing_id = cls.test_listing.id

            cls.farmer_token = generate_token(cls.farmer)
            cls.buyer_token = generate_token(cls.buyer)
            cls.admin_token = generate_token(cls.admin)

            cls.farmer_headers = {'Authorization': f'Bearer {cls.farmer_token}'}
            cls.buyer_headers = {'Authorization': f'Bearer {cls.buyer_token}'}
            cls.admin_headers = {'Authorization': f'Bearer {cls.admin_token}'}

    # 1. Listing Quantity Limits (5,000 - 50,000 kg)
    def test_01_listing_quantity_limits(self):
        # Quantity < 5,000 kg should be rejected
        payload_under = {
            'crop': 'Potato',
            'quantity': 4999,
            'expected_price': 20,
            'location': 'Nashik',
            'quality_grade': 'Grade A',
            'availability_date': '2026-11-01',
            'image_url': '/uploads/test_produce.jpg'
        }
        res = self.client.post('/api/farmers/listings', json=payload_under, headers=self.farmer_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Minimum listing quantity is 5,000 kg.", res.get_json()['message'])

        # Quantity > 50,000 kg should be rejected
        payload_over = {
            'crop': 'Potato',
            'quantity': 50001,
            'expected_price': 20,
            'location': 'Nashik',
            'quality_grade': 'Grade A',
            'availability_date': '2026-11-01',
            'image_url': '/uploads/test_produce.jpg'
        }
        res = self.client.post('/api/farmers/listings', json=payload_over, headers=self.farmer_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Maximum listing quantity is 50,000 kg.", res.get_json()['message'])

        # Quantity = 5,000 kg should be accepted
        payload_valid = {
            'crop': 'Potato',
            'quantity': 5000,
            'expected_price': 20,
            'location': 'Nashik',
            'quality_grade': 'Grade A',
            'availability_date': '2026-11-01',
            'image_url': '/uploads/test_produce.jpg'
        }
        res = self.client.post('/api/farmers/listings', json=payload_valid, headers=self.farmer_headers)
        self.assertIn(res.status_code, [200, 201])
        print("  [PASS] Test 1: 5,000 to 50,000 kg listing bounds strictly enforced.")

    # 2. Stock Management, Atomic Decrement, & Sold Status
    def test_02_stock_decrement_and_sold_status(self):
        with self.app.app_context():
            listing = ProduceListing(
                farmer_id=self.farmer.id,
                crop="Carrot",
                quantity=5000.0,
                available_quantity=5000.0,
                unit="kg",
                expected_price=25.0,
                location="Nashik",
                quality_grade="Grade A",
                availability_date=date.today(),
                status="ACTIVE"
            )
            db.session.add(listing)
            db.session.commit()
            listing_id = listing.id

        # Buyer attempts to request more than available stock
        res = self.client.post('/api/requests', json={
            'listing_id': listing_id,
            'requested_quantity': 5500,
            'offered_price': 25.0
        }, headers=self.buyer_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("exceeds available stock", res.get_json()['message'])

        # Buyer requests exact stock (5000 kg)
        res = self.client.post('/api/requests', json={
            'listing_id': listing_id,
            'requested_quantity': 5000,
            'offered_price': 25.0
        }, headers=self.buyer_headers)
        self.assertEqual(res.status_code, 201)
        req_id = res.get_json()['data']['id']

        # Farmer accepts the request
        res = self.client.post(f'/api/negotiations/{req_id}/accept', headers=self.farmer_headers)
        self.assertIn(res.status_code, [200, 201])

        # Verify listing stock is now 0 and status is SOLD
        with self.app.app_context():
            updated_listing = db.session.get(ProduceListing, listing_id)
            self.assertEqual(updated_listing.available_quantity, 0.0)
            self.assertEqual(updated_listing.status, 'SOLD')

        # New request on sold listing must be rejected
        res = self.client.post('/api/requests', json={
            'listing_id': listing_id,
            'requested_quantity': 1000,
            'offered_price': 25.0
        }, headers=self.buyer_headers)
        self.assertIn(res.status_code, [400, 404])
        print("  [PASS] Test 2: Atomic stock decrement and SOLD status transition verified.")

    # 3. Post-Delivery Ratings Workflow
    def test_03_post_delivery_ratings(self):
        import uuid
        with self.app.app_context():
            order = Order(
                order_number=f"FD-TEST-RATE-{uuid.uuid4().hex[:8]}",
                farmer_id=self.farmer_id,
                buyer_id=self.buyer_id,
                listing_id=self.test_listing_id,
                crop="Tomato",
                quantity=5000.0,
                agreed_price=30.0,
                total_amount=150000.0,
                status="IN_TRANSIT"
            )
            db.session.add(order)
            db.session.commit()
            order_id = order.id

        # Non-delivered order cannot be rated
        res = self.client.post(f'/api/orders/{order_id}/rate', json={'rating': 5, 'review_text': 'Great!'}, headers=self.buyer_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Only delivered or completed orders can be rated", res.get_json()['message'])

        # Update order status to DELIVERED
        with self.app.app_context():
            o = db.session.get(Order, order_id)
            o.status = "DELIVERED"
            db.session.commit()

        # Farmer cannot submit buyer rating
        res = self.client.post(f'/api/orders/{order_id}/rate', json={'rating': 5}, headers=self.farmer_headers)
        self.assertEqual(res.status_code, 403)

        # Buyer submits valid rating
        res = self.client.post(f'/api/orders/{order_id}/rate', json={'rating': 5, 'review_text': 'Super fresh tomatoes!'}, headers=self.buyer_headers)
        self.assertEqual(res.status_code, 200)

        with self.app.app_context():
            o = db.session.get(Order, order_id)
            self.assertEqual(o.status, "COMPLETED")
            self.assertEqual(o.rating, 5)
            self.assertEqual(o.review_text, 'Super fresh tomatoes!')

        # Duplicate rating submission is blocked
        res = self.client.post(f'/api/orders/{order_id}/rate', json={'rating': 4}, headers=self.buyer_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("already been rated", res.get_json()['message'])
        print("  [PASS] Test 3: Post-delivery rating flow, role authorization, and duplicate prevention verified.")

    # 4. Dispute & Complaint Filing Workflow
    def test_04_dispute_complaints_workflow(self):
        import uuid
        with self.app.app_context():
            order = Order(
                order_number=f"FD-TEST-CMP-{uuid.uuid4().hex[:8]}",
                farmer_id=self.farmer_id,
                buyer_id=self.buyer_id,
                listing_id=self.test_listing_id,
                crop="Onion",
                quantity=5000.0,
                agreed_price=22.0,
                total_amount=110000.0,
                status="DELIVERED"
            )
            db.session.add(order)
            db.session.commit()
            order_id = order.id

        # Buyer submits complaint
        res = self.client.post(f'/api/orders/{order_id}/complaints', json={
            'category': 'Poor quality',
            'description': 'Produce arrived bruised and discolored in transport.'
        }, headers=self.buyer_headers)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()['data']
        self.assertTrue(data['ticket_number'].startswith('CMP-'))
        self.assertEqual(data['status'], 'SUBMITTED')
        complaint_id = data['id']

        # Farmer submits complaint
        res = self.client.post(f'/api/orders/{order_id}/complaints', json={
            'category': 'Buyer payment issue',
            'description': 'Payment delayed after delivery sign-off.'
        }, headers=self.farmer_headers)
        self.assertEqual(res.status_code, 201)

        # Admin resolves complaint
        res = self.client.put(f'/api/orders/complaints/{complaint_id}/status', json={
            'status': 'RESOLVED',
            'resolution_note': 'Partial credit issued to buyer; transit insurer contacted.'
        }, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)

        with self.app.app_context():
            cmp = db.session.get(OrderComplaint, complaint_id)
            self.assertEqual(cmp.status, 'RESOLVED')
            self.assertIn('Partial credit', cmp.resolution_note)
        print("  [PASS] Test 4: End-to-end dispute complaint filing and administrative adjudication verified.")

    # 5. Mobile Phone Validation
    def test_05_mobile_phone_validation(self):
        self.assertTrue(validate_indian_phone("9876543210"))
        self.assertTrue(validate_indian_phone("+919876543210"))
        self.assertTrue(validate_indian_phone("+91 98765 43210"))
        self.assertTrue(validate_indian_phone("+91-9876543210"))
        self.assertFalse(validate_indian_phone("5876543210"))
        self.assertFalse(validate_indian_phone("1234567890"))
        self.assertFalse(validate_indian_phone("98765"))
        self.assertFalse(validate_indian_phone(""))
        print("  [PASS] Test 5: Indian mobile phone regex normalization and validation verified.")

    # 6. Smart Match Substring & Custom Crop Matching
    def test_06_smart_match_substring_custom_crops(self):
        engine = MatchingEngine()
        # Exact match
        score, note = engine.calculate_crop_score("Tomato", "Tomato")
        self.assertEqual(score, 100.0)

        # Substring / custom crop match: 'Dragon Fruit' in 'Red Dragon Fruit'
        score, note = engine.calculate_crop_score("Red Dragon Fruit", "Dragon Fruit")
        self.assertEqual(score, 95.0)
        self.assertIn("Close crop match", note)

        # Token overlap: 'Shimla Green Capsicum' vs 'Capsicum'
        score, note = engine.calculate_crop_score("Shimla Green Capsicum", "Capsicum")
        self.assertIn(score, [85.0, 95.0])

        # Synonym match: 'Capsicum' vs 'Bell Pepper'
        score, note = engine.calculate_crop_score("Bell Pepper", "Capsicum")
        self.assertIn(score, [80.0, 95.0])
        print("  [PASS] Test 6: Custom crop substring, token overlap, and synonym matching verified.")

    # 7. Soil Lab Report Analysis Service
    def test_07_soil_lab_report_service(self):
        mock_raw = {
            'is_soil_lab_report': True,
            'lab_name': 'Maharashtra Agricultural Laboratory',
            'sample_date': '2026-09-15',
            'soil_type': 'Medium Black',
            'extracted_parameters': {
                'ph_level': 6.8,
                'nitrogen_kg_ha': 240.0,
                'phosphorus_kg_ha': 22.5,
                'potassium_kg_ha': 180.0,
                'organic_carbon_pct': 0.65,
                'electrical_conductivity_ds_m': 0.42
            },
            'unreadable_parameters': ['zinc_ppm'],
            'ai_agronomic_interpretation': {
                'fertility_status': 'Good Fertility',
                'ph_status': 'Optimal Neutral',
                'nutrient_deficiencies': ['Zinc'],
                'nutrient_excesses': [],
                'recommended_crops': ['Tomato', 'Onion', 'Wheat'],
                'corrective_actions': ['Apply 50 kg/ha urea at tillering.', 'Incorporate green manure to raise organic carbon.']
            }
        }
        res = SoilReportService._format_verified_soil_report(mock_raw, "/uploads/lab_report.jpg")
        self.assertTrue(res['success'])
        self.assertEqual(res['report_metadata']['lab_name'], 'Maharashtra Agricultural Laboratory')
        self.assertEqual(res['report_metadata']['source_attribution'], 'Based on uploaded laboratory report.')

        # Check verified metrics
        metrics_by_key = {m['key']: m for m in res['physical_measurements']}
        self.assertEqual(metrics_by_key['ph_level']['value'], 6.8)
        self.assertEqual(metrics_by_key['ph_level']['status'], 'OPTIMAL')
        self.assertEqual(metrics_by_key['ph_level']['source'], 'Laboratory Report')
        self.assertEqual(metrics_by_key['zinc_ppm']['status'], 'UNREADABLE')
        self.assertEqual(metrics_by_key['zinc_ppm']['display_value'], 'Not reliably readable')
        self.assertEqual(metrics_by_key['boron_ppm']['status'], 'NOT_PROVIDED')
        self.assertEqual(metrics_by_key['boron_ppm']['display_value'], 'Not provided')
        print("  [PASS] Test 7: Soil Lab Report structured extraction and attribution verified.")

if __name__ == '__main__':
    unittest.main()
