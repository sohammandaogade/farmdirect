import unittest
import io
import numpy as np
from PIL import Image, ImageFilter
from app import create_app
from database import db
from models import QualityInspection, User, ProduceListing
from services.ai.vision_service import VisionQualityService

def create_synthetic_image(produce_color, bg_color=(240, 240, 240), rot_ratio=0.0, blur_sigma=0.0, size=(200, 200)):
    w, h = size
    arr = np.ones((h, w, 3), dtype=np.uint8) * np.array(bg_color, dtype=np.uint8)
    y, x = np.ogrid[:h, :w]
    cx, cy, r_radius = w // 2, h // 2, min(w, h) // 3
    produce_mask = (x - cx)**2 + (y - cy)**2 <= r_radius**2
    arr[produce_mask] = produce_color

    if rot_ratio > 0.0:
        rot_radius = int(r_radius * np.sqrt(rot_ratio))
        rot_mask = produce_mask & ((x - (cx - r_radius // 3))**2 + (y - (cy - r_radius // 3))**2 <= rot_radius**2)
        arr[rot_mask] = [22, 18, 14]  # dark necrotic rot

    img = Image.fromarray(arr)
    if blur_sigma > 0.0:
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_sigma))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    buf.filename = "test_produce.jpg"
    return buf, img

class TestVisionPipeline(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_01_healthy_tomato_matches_declared_grade_a(self):
        _, img = create_synthetic_image(produce_color=[220, 35, 30])  # Vibrant red tomato
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'VERIFIED_ALIGNED')
        self.assertEqual(result['ai_assessed_grade'], 'Grade A')
        self.assertEqual(result['expected_crop'], 'Tomato')
        self.assertEqual(result['detected_crop'], 'Tomato')
        self.assertEqual(result['visible_defect_level'], 'NONE')
        self.assertLess(result['defect_detected_pct'], 4.0)

    def test_02_crop_mismatch_onion_uploaded_for_tomato(self):
        _, img = create_synthetic_image(produce_color=[185, 145, 80])  # Yellowish-brown onion
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'CROP_MISMATCH')
        self.assertEqual(result['ai_assessed_grade'], 'Unverified')
        self.assertEqual(result['expected_crop'], 'Tomato')
        self.assertEqual(result['detected_crop'], 'Onion')
        self.assertIn("mismatch", result['assessment_notes'].lower())

    def test_03_crop_mismatch_tomato_uploaded_for_onion(self):
        _, img = create_synthetic_image(produce_color=[220, 35, 30])  # Tomato
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Onion")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'CROP_MISMATCH')
        self.assertEqual(result['ai_assessed_grade'], 'Unverified')
        self.assertEqual(result['expected_crop'], 'Onion')
        self.assertEqual(result['detected_crop'], 'Tomato')

    def test_04_defective_rotten_tomato_detected_as_grade_c(self):
        # 12% defect level for Grade C testing
        _, img = create_synthetic_image(produce_color=[220, 35, 30], rot_ratio=0.12)
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'VISIBLE_DEFECTS')
        self.assertEqual(result['visible_defect_level'], 'HIGH')
        self.assertEqual(result['ai_assessed_grade'], 'Grade C')
        self.assertGreaterEqual(result['defect_detected_pct'], 10.0)

    def test_05_blurry_image_rejected(self):
        _, img = create_synthetic_image(produce_color=[220, 35, 30], blur_sigma=6.0)
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'IMAGE_UNSUITABLE')
        self.assertEqual(result['image_quality_status'], 'BLURRY')
        self.assertEqual(result['ai_assessed_grade'], 'Unverified')

    def test_06_dark_underexposed_image_rejected(self):
        # Very dark image
        arr = np.full((200, 200, 3), 12, dtype=np.uint8)
        img = Image.fromarray(arr)
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'IMAGE_UNSUITABLE')
        self.assertEqual(result['image_quality_status'], 'POOR_LIGHTING')
        self.assertEqual(result['ai_assessed_grade'], 'Unverified')

    def test_07_overexposed_image_rejected(self):
        # Nearly pure white image
        arr = np.full((200, 200, 3), 250, dtype=np.uint8)
        img = Image.fromarray(arr)
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'IMAGE_UNSUITABLE')
        self.assertEqual(result['image_quality_status'], 'POOR_LIGHTING')

    def test_08_low_resolution_image_rejected(self):
        # Tiny 50x50 image
        arr = np.full((50, 50, 3), 128, dtype=np.uint8)
        img = Image.fromarray(arr)
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'IMAGE_UNSUITABLE')
        self.assertEqual(result['image_quality_status'], 'LOW_RESOLUTION')

    def test_09_moderate_defect_triggers_review_required(self):
        # ~6% rot
        _, img = create_synthetic_image(produce_color=[220, 35, 30], rot_ratio=0.06)
        result = VisionQualityService.analyze_image_array(img, declared_grade="Grade A", expected_crop="Tomato")
        self.assertTrue(result['success'])
        self.assertEqual(result['verification_status'], 'REVIEW_REQUIRED')
        self.assertEqual(result['visible_defect_level'], 'MODERATE')
        self.assertEqual(result['ai_assessed_grade'], 'Grade B')

    def test_10_api_upload_endpoint_and_db_audit(self):
        from utils.auth import generate_token
        farmer = User.query.filter_by(role='farmer').first() or db.session.get(User, 1)
        farmer_token = generate_token(farmer)
        auth_headers = {'Authorization': f'Bearer {farmer_token}'}
        buf, _ = create_synthetic_image(produce_color=[220, 35, 30], rot_ratio=0.12)
        
        # Test multipart upload
        res = self.client.post('/api/quality/upload-inspect', data={
            'image': (buf, 'test_rotten_tomato.jpg'),
            'crop': 'Tomato',
            'declared_grade': 'Grade A',
            'listing_id': '1',
            'farmer_id': '1'
        }, headers=auth_headers, content_type='multipart/form-data')

        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn(data['verification_status'], ['VISIBLE_DEFECTS', 'REJECTED', 'REVIEW_REQUIRED'])
        self.assertIn('inspection_id', data)

        # Verify inspection persisted in DB
        insp = db.session.get(QualityInspection, data['inspection_id'])
        self.assertIsNotNone(insp)
        self.assertEqual(insp.expected_crop, 'Tomato')
        self.assertEqual(insp.detected_crop, 'Tomato')

        # Test GET listing endpoint
        get_res = self.client.get(f'/api/quality/listing/{insp.listing_id or 1}')
        self.assertIn(get_res.status_code, [200, 404])

if __name__ == '__main__':
    unittest.main()
