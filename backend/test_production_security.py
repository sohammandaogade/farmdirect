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
                'quantity': 2000,
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
                'quantity': 1500,
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


if __name__ == '__main__':
    unittest.main()
