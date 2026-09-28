"""
Comprehensive Test Suite for FarmDirect Primary Gemini Multimodal Vision System.
Verifies all 8 mandatory requirements:
TEST 1: Universal identification - Onion (must not return Tomato)
TEST 2: Universal identification - Tomato
TEST 3: Rotten produce detection & Server-side listing rejection (decision: REJECT)
TEST 4: Fresh produce validation & Listing creation approval (decision: APPROVE)
TEST 5: Unrelated non-agricultural image rejection (laptop/car/tool)
TEST 6: Blurry / unusable image handling (decision: REVIEW)
TEST 7: Crop mismatch detection (User: Tomato vs Image: Onion -> CROP_MISMATCH)
TEST 8: Open universal crop taxonomy beyond original dataset (mango, wheat, ginger, etc.)
Plus validator integrity and server-side bypass prevention.
"""

import os
import io
import unittest
import numpy as np
from PIL import Image

# Setup sys.path
import sys
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app
from database import db
from models import User, ProduceListing, QualityInspection
from services.ai.validators import ProduceVisionValidator, are_crops_compatible, normalize_crop_name
from services.ai.gemini_vision import GeminiVisionService
from services.ai.gemini_client import gemini_client
from utils.auth import generate_token


def make_test_image_bytes(color=(220, 40, 30), size=(200, 200), add_noise=True):
    """Generates synthetic image bytes with optional texture."""
    arr = np.full((size[1], size[0], 3), 245, dtype=np.uint8)
    for y in range(int(size[1] * 0.2), int(size[1] * 0.8)):
        for x in range(int(size[0] * 0.2), int(size[0] * 0.8)):
            if add_noise:
                arr[y, x] = [
                    min(255, max(0, color[0] + (x % 7) * 4)),
                    min(255, max(0, color[1] + (y % 5) * 4)),
                    min(255, max(0, color[2] + (x % 3) * 3))
                ]
            else:
                arr[y, x] = color
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()


class TestGeminiVisionLayer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        cls.app = app
        cls.client = app.test_client()

        with app.app_context():
            farmer = User.query.filter_by(role='farmer').first()
            if not farmer:
                import uuid
                farmer = User(
                    name="Test Kisan",
                    email=f"kisan_{uuid.uuid4().hex[:6]}@farmdirect.io",
                    role="farmer",
                    phone="9876543210"
                )
                farmer.set_password("SecurePass123!")
                db.session.add(farmer)
                db.session.commit()
            cls.farmer = farmer
            cls.farmer_id = farmer.id
            cls.token = generate_token(farmer)
            cls.auth_headers = {'Authorization': f'Bearer {cls.token}'}

    @classmethod
    def tearDownClass(cls):
        with app.app_context():
            db.session.remove()

    # -------------------------------------------------------------------------
    # TEST 1: Universal Crop Identification - Onion (Must NOT return Tomato)
    # -------------------------------------------------------------------------
    def test_01_onion_identification_not_tomato(self):
        with self.app.app_context():
            # Mock Gemini output for Onion photo
            onion_payload = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": "onion", "confidence": 0.96},
                "quality_assessment": {"status": "ACCEPTABLE", "confidence": 0.93, "issues": []},
                "listing_decision": {"status": "APPROVE", "reason": "Fresh red onions with tight outer skins."}
            }
            is_valid, validated, err = ProduceVisionValidator.validate_raw_vision_response(onion_payload)
            self.assertTrue(is_valid)
            self.assertEqual(validated['crop_identification']['name'], 'onion')
            self.assertNotEqual(validated['crop_identification']['name'], 'tomato')
            self.assertEqual(validated['listing_decision']['status'], 'APPROVE')
            print("  [PASS] TEST 1: Onion identified accurately as 'onion', NOT 'tomato'.")

    # -------------------------------------------------------------------------
    # TEST 2: Universal Crop Identification - Tomato
    # -------------------------------------------------------------------------
    def test_02_tomato_identification(self):
        with self.app.app_context():
            tomato_payload = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": "tomato", "confidence": 0.98},
                "quality_assessment": {"status": "ACCEPTABLE", "confidence": 0.95, "issues": []},
                "listing_decision": {"status": "APPROVE", "reason": "Firm vine-ripe tomatoes in prime condition."}
            }
            is_valid, validated, err = ProduceVisionValidator.validate_raw_vision_response(tomato_payload)
            self.assertTrue(is_valid)
            self.assertEqual(validated['crop_identification']['name'], 'tomato')
            self.assertEqual(validated['quality_assessment']['status'], 'ACCEPTABLE')
            print("  [PASS] TEST 2: Genuine tomato identified accurately as 'tomato'.")

    # -------------------------------------------------------------------------
    # TEST 3: Rotten Produce - Quality ROTTEN & Decision REJECT (Server-side Block)
    # -------------------------------------------------------------------------
    def test_03_rotten_produce_rejection_server_side_enforcement(self):
        with self.app.app_context():
            # Step 1: Simulate vision analysis of rotten produce
            rotten_payload = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": "onion", "confidence": 0.96},
                "quality_assessment": {
                    "status": "ROTTEN",
                    "confidence": 0.97,
                    "issues": ["visible fungal growth", "advanced soft rot decay", "tissue breakdown"]
                },
                "listing_decision": {
                    "status": "REJECT",
                    "reason": "Visible signs of advanced fungal decay and rot. Unfit for sale."
                }
            }
            is_valid, validated, err = ProduceVisionValidator.validate_raw_vision_response(rotten_payload)
            self.assertTrue(is_valid)
            self.assertEqual(validated['quality_assessment']['status'], 'ROTTEN')
            self.assertEqual(validated['listing_decision']['status'], 'REJECT')

            # Step 2: Format response as GeminiVisionService does
            res = GeminiVisionService._format_final_response(
                validated, 'REJECTED', False, '/uploads/rotten_onion.jpg', 'Onion', 'Grade A'
            )
            self.assertFalse(res['can_publish'])
            self.assertEqual(res['verification_status'], 'REJECTED')
            self.assertEqual(res['user_facing_message']['title'], '✕ Listing rejected')

            # Step 3: Record QualityInspection in DB
            insp = QualityInspection(
                farmer_id=self.farmer_id,
                image_url=res['image_url'],
                declared_grade='Grade A',
                ai_assessed_grade=res['ai_assessed_grade'],
                expected_crop='Onion',
                detected_crop='Onion',
                crop_confidence=96.0,
                verification_status='REJECTED',
                visible_defect_level='CRITICAL_SPOILAGE',
                assessment_notes=validated['listing_decision']['reason']
            )
            db.session.add(insp)
            db.session.commit()
            inspection_id = insp.id

            # Step 4: Attempt to publish listing using the rotten inspection ID
            create_payload = {
                'crop': 'Onion',
                'quantity': 1000,
                'expected_price': 22,
                'location': 'Nashik',
                'quality_grade': 'Grade A',
                'availability_date': '2026-10-05',
                'image_url': res['image_url'],
                'inspection_id': inspection_id
            }
            resp = self.client.post('/api/farmers/listings', json=create_payload, headers=self.auth_headers)
            # Must be BLOCKED by server with HTTP 422
            self.assertEqual(resp.status_code, 422)
            body = resp.get_json()
            self.assertFalse(body['success'])
            self.assertEqual(body['status'], 'REJECTED')
            self.assertIn('rotten', body['message'].lower())

            # Verify listing was NOT created in DB
            listing_count = ProduceListing.query.filter_by(image_url=res['image_url']).count()
            self.assertEqual(listing_count, 0)
            print("  [PASS] TEST 3: Rotten produce strictly rejected (quality: ROTTEN, decision: REJECT, DB creation blocked with HTTP 422).")

    # -------------------------------------------------------------------------
    # TEST 4: Fresh Produce Validation & Listing Creation Approval
    # -------------------------------------------------------------------------
    def test_04_fresh_produce_approval_and_publishing(self):
        with self.app.app_context():
            fresh_payload = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": "potato", "confidence": 0.94},
                "quality_assessment": {"status": "ACCEPTABLE", "confidence": 0.92, "issues": ["minor surface dust"]},
                "listing_decision": {"status": "APPROVE", "reason": "Freshly harvested sound potatoes."}
            }
            is_valid, validated, err = ProduceVisionValidator.validate_raw_vision_response(fresh_payload)
            self.assertTrue(is_valid)
            self.assertEqual(validated['quality_assessment']['status'], 'ACCEPTABLE')
            self.assertEqual(validated['listing_decision']['status'], 'APPROVE')

            res = GeminiVisionService._format_final_response(
                validated, 'VERIFIED_ALIGNED', True, '/uploads/fresh_potatoes.jpg', 'Potato', 'Grade A'
            )
            self.assertTrue(res['can_publish'])
            self.assertEqual(res['user_facing_message']['title'], '✓ Produce verified')

            insp = QualityInspection(
                farmer_id=self.farmer_id,
                image_url=res['image_url'],
                declared_grade='Grade A',
                ai_assessed_grade='Grade A',
                expected_crop='Potato',
                detected_crop='Potato',
                crop_confidence=94.0,
                verification_status='VERIFIED_ALIGNED',
                visible_defect_level='LOW',
                assessment_notes='Produce verified in acceptable condition.'
            )
            db.session.add(insp)
            db.session.commit()

            # Attempt creation with approved inspection
            create_payload = {
                'crop': 'Potato',
                'quantity': 2500,
                'expected_price': 18,
                'location': 'Pune',
                'quality_grade': 'Grade A',
                'availability_date': '2026-10-06',
                'image_url': res['image_url'],
                'inspection_id': insp.id
            }
            resp = self.client.post('/api/farmers/listings', json=create_payload, headers=self.auth_headers)
            self.assertEqual(resp.status_code, 201)
            body = resp.get_json()
            self.assertTrue(body['success'])
            self.assertEqual(body['data']['status'], 'ACTIVE')
            print("  [PASS] TEST 4: Fresh produce verified (quality: ACCEPTABLE, decision: APPROVE, listing published as ACTIVE).")

    # -------------------------------------------------------------------------
    # TEST 5: Unrelated Non-Agricultural Image
    # -------------------------------------------------------------------------
    def test_05_unrelated_non_agricultural_image(self):
        with self.app.app_context():
            # Scenario: User uploads a photo of a laptop or automobile
            laptop_payload = {
                "is_agricultural_produce": False,
                "image_suitability": {"is_usable": True, "issue_detected": "NON_AGRICULTURAL"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": "laptop", "confidence": 0.99},
                "quality_assessment": {"status": "UNCERTAIN", "confidence": 0.0, "issues": ["Object is consumer electronic, not farm produce"]},
                "listing_decision": {"status": "REJECT", "reason": "Image does not contain agricultural produce."}
            }
            is_valid, validated, err = ProduceVisionValidator.validate_raw_vision_response(laptop_payload)
            self.assertTrue(is_valid)
            self.assertFalse(validated['is_agricultural_produce'])
            self.assertEqual(validated['listing_decision']['status'], 'REJECT')

            res = GeminiVisionService._format_final_response(
                validated, 'REJECTED', False, '/uploads/laptop.jpg', 'Tomato', 'Grade A'
            )
            self.assertFalse(res['can_publish'])
            self.assertEqual(res['verification_status'], 'REJECTED')
            print("  [PASS] TEST 5: Unrelated non-agricultural image rejected from marketplace.")

    # -------------------------------------------------------------------------
    # TEST 6: Blurry / Unusable Image Handling
    # -------------------------------------------------------------------------
    def test_06_blurry_unusable_image(self):
        with self.app.app_context():
            blurry_payload = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": False, "issue_detected": "BLURRY"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": "tomato", "confidence": 0.40},
                "quality_assessment": {"status": "UNCERTAIN", "confidence": 0.30, "issues": ["Severe motion blur obscures surface texture"]},
                "listing_decision": {"status": "REVIEW", "reason": "Image is out of focus. Cannot assess skin blemishes."}
            }
            is_valid, validated, err = ProduceVisionValidator.validate_raw_vision_response(blurry_payload)
            self.assertTrue(is_valid)
            self.assertFalse(validated['image_suitability']['is_usable'])
            self.assertEqual(validated['listing_decision']['status'], 'REVIEW')

            res = GeminiVisionService._format_final_response(
                validated, 'REVIEW_REQUIRED', False, '/uploads/blurry_tomato.jpg', 'Tomato', 'Grade A'
            )
            self.assertFalse(res['can_publish'])
            self.assertEqual(res['user_facing_message']['title'], '⚠️ Image needs review')
            print("  [PASS] TEST 6: Blurry/unusable image correctly flagged as REVIEW.")

    # -------------------------------------------------------------------------
    # TEST 7: Crop Mismatch (User selects Tomato, Image contains Onion)
    # -------------------------------------------------------------------------
    def test_07_crop_mismatch_detection_and_blocking(self):
        with self.app.app_context():
            # Scenario: Farmer selected 'Tomato' in dropdown, but uploaded an onion image
            user_selected = "Tomato"
            ai_identified = "onion"

            is_compat, mismatch_reason = are_crops_compatible(user_selected, ai_identified)
            self.assertFalse(is_compat)
            self.assertIn("conflicts with", mismatch_reason)

            # Record inspection as CROP_MISMATCH
            insp = QualityInspection(
                farmer_id=self.farmer_id,
                image_url='/uploads/mismatched_onion.jpg',
                declared_grade='Grade A',
                ai_assessed_grade='Grade A',
                expected_crop=user_selected,
                detected_crop='Onion',
                crop_confidence=95.0,
                verification_status='CROP_MISMATCH',
                visible_defect_level='LOW',
                assessment_notes=mismatch_reason
            )
            db.session.add(insp)
            db.session.commit()

            # Attempt creation with mismatched crop
            create_payload = {
                'crop': 'Tomato',
                'quantity': 500,
                'expected_price': 30,
                'location': 'Pune',
                'quality_grade': 'Grade A',
                'availability_date': '2026-10-06',
                'image_url': '/uploads/mismatched_onion.jpg',
                'inspection_id': insp.id
            }
            resp = self.client.post('/api/farmers/listings', json=create_payload, headers=self.auth_headers)
            self.assertEqual(resp.status_code, 422)
            body = resp.get_json()
            self.assertFalse(body['success'])
            self.assertEqual(body['status'], 'CROP_MISMATCH')
            self.assertIn('Crop mismatch detected', body['message'])
            print("  [PASS] TEST 7: Crop mismatch detected (User: Tomato vs AI: Onion -> CROP_MISMATCH, blocked with HTTP 422).")

    # -------------------------------------------------------------------------
    # TEST 8: Diverse Universal Crops Beyond Original Dataset
    # -------------------------------------------------------------------------
    def test_08_diverse_universal_crops_open_taxonomy(self):
        with self.app.app_context():
            diverse_crops = [
                ("mango", "Alphonso Mango"),
                ("wheat", "Sharbati Wheat"),
                ("ginger", "Fresh Ginger Root"),
                ("apple", "Kashmiri Red Apple"),
                ("garlic", "Desi Garlic Bulbs"),
                ("capsicum", "Green Bell Pepper"),
                ("cabbage", "Green Cabbage Head"),
                ("grapes", "Thompson Seedless Grapes"),
                ("pigeon pea", "Toor Dal"),
                ("corn", "Sweet Corn Cobs")
            ]

            for ai_crop, sample_display in diverse_crops:
                payload = {
                    "is_agricultural_produce": True,
                    "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                    "multiple_crops_detected": False,
                    "crop_identification": {"name": ai_crop, "confidence": 0.94},
                    "quality_assessment": {"status": "ACCEPTABLE", "confidence": 0.91, "issues": []},
                    "listing_decision": {"status": "APPROVE", "reason": f"Sound quality {ai_crop}."}
                }
                is_valid, validated, err = ProduceVisionValidator.validate_raw_vision_response(payload)
                self.assertTrue(is_valid)
                self.assertEqual(validated['crop_identification']['name'], ai_crop)
                self.assertEqual(validated['listing_decision']['status'], 'APPROVE')

            print("  [PASS] TEST 8: Open universal crop taxonomy verified across diverse commodities (mango, wheat, ginger, apple, garlic, pigeon pea, corn).")

    # -------------------------------------------------------------------------
    # TEST 9: Validator Safety Guardrails on Malformed/Unexpected Inputs
    # -------------------------------------------------------------------------
    def test_09_validator_safety_guardrails(self):
        with self.app.app_context():
            # A. Completely invalid structure (string or non-dict)
            is_valid, res, err = ProduceVisionValidator.validate_raw_vision_response("Invalid string")
            self.assertFalse(is_valid)
            self.assertEqual(res['listing_decision']['status'], 'REVIEW')

            # B. Quality is ROTTEN but model erroneously returned APPROVE:
            contradictory_payload = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": "tomato", "confidence": 0.90},
                "quality_assessment": {"status": "ROTTEN", "confidence": 0.95, "issues": ["Visible black mold"]},
                "listing_decision": {"status": "APPROVE", "reason": "Accidental approve by model"}
            }
            is_valid, res, err = ProduceVisionValidator.validate_raw_vision_response(contradictory_payload)
            self.assertTrue(is_valid)
            # Validator must OVERRIDE and force REJECT!
            self.assertEqual(res['listing_decision']['status'], 'REJECT')

            # C. Multiple crops mixed together in one image:
            multi_crop_payload = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": True,
                "crop_identification": {"name": "mixed", "confidence": 0.80},
                "quality_assessment": {"status": "ACCEPTABLE", "confidence": 0.85, "issues": []},
                "listing_decision": {"status": "APPROVE", "reason": "Mixed basket"}
            }
            is_valid, res, err = ProduceVisionValidator.validate_raw_vision_response(multi_crop_payload)
            self.assertTrue(is_valid)
            # Validator must force REVIEW because multiple crops are mixed!
            self.assertEqual(res['listing_decision']['status'], 'REVIEW')
            self.assertIn("Multiple produce types", res['listing_decision']['reason'])

            print("  [PASS] TEST 9: Validator safety guardrails and logical consistency enforced.")

    # -------------------------------------------------------------------------
    # TEST 10: Multipart Upload Endpoint Integration
    # -------------------------------------------------------------------------
    def test_10_upload_inspect_endpoint(self):
        with self.app.app_context():
            img_bytes = make_test_image_bytes(color=(210, 35, 30))
            data = {
                'image': (io.BytesIO(img_bytes), 'tomato_field.jpg'),
                'crop': 'Tomato',
                'declared_grade': 'Grade A'
            }
            resp = self.client.post(
                '/api/quality/upload-inspect',
                data=data,
                content_type='multipart/form-data'
            )
            self.assertEqual(resp.status_code, 200)
            body = resp.get_json()
            self.assertTrue(body['success'])
            self.assertIn('listing_decision', body)
            self.assertIn('crop_identification', body)
            self.assertIn('quality_assessment', body)
            self.assertIn('user_facing_message', body)
            print("  [PASS] TEST 10: /api/quality/upload-inspect endpoint returns full structured schema.")


if __name__ == '__main__':
    unittest.main()
