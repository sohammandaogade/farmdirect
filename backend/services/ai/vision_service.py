"""
Computer-Vision Produce Quality Verification Service.
Analyzes actual pixel data using PIL, NumPy, and SciPy to:
1. Validate image optical quality (resolution, blur via Laplacian variance, lighting/luminance, produce foreground visibility).
2. Classify and verify expected crop using color space feature distributions (HSV/RGB ratios).
3. Detect surface defects, rot, necrosis, fungal lesions, and calculate exact defect percentage.
4. Assess visual produce grade (Grade A, Grade B, Grade C / Sub-standard) objectively
   without overwriting the farmer's declared grade.
"""

import os
import uuid
import numpy as np
from PIL import Image
from scipy.ndimage import laplace
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MODEL_NAME = "FarmDirect-AgriVision-ColorTextureEngine"
MODEL_VERSION = "2.0.0"

class VisionQualityService:

    @staticmethod
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def process_and_inspect_image(file_obj, declared_grade='Grade A', crop='Tomato', upload_folder=None):
        """
        Processes an uploaded produce image and executes a real computer vision pipeline:
        - Image quality verification
        - Produce segmentation
        - Crop feature matching
        - Defect detection
        - Objective grade assessment
        """
        if not file_obj or file_obj.filename == '':
            return {'success': False, 'message': 'No image file uploaded.'}

        if not VisionQualityService.allowed_file(file_obj.filename):
            return {
                'success': False,
                'message': 'Invalid file format. Only JPEG, PNG, and WebP images are supported.'
            }

        # Validate file size
        file_obj.seek(0, os.SEEK_END)
        size_bytes = file_obj.tell()
        file_obj.seek(0)
        if size_bytes > MAX_FILE_SIZE:
            return {
                'success': False,
                'message': f'Image size ({size_bytes / 1024 / 1024:.1f} MB) exceeds maximum limit of 5 MB.'
            }

        # Generate secure unique filename and save if folder provided
        ext = file_obj.filename.rsplit('.', 1)[1].lower()
        unique_name = f"quality_{uuid.uuid4().hex[:12]}.{ext}"
        file_url = f"/uploads/{unique_name}"

        try:
            if upload_folder:
                os.makedirs(upload_folder, exist_ok=True)
                save_path = os.path.join(upload_folder, unique_name)
                file_obj.save(save_path)
                # Reopen saved file for PIL reading
                pil_img = Image.open(save_path)
            else:
                pil_img = Image.open(file_obj)
            pil_img.verify() # Verify that it is, in fact, an image
            # Re-open because verify() closes or alters image state
            if upload_folder:
                pil_img = Image.open(save_path)
            else:
                file_obj.seek(0)
                pil_img = Image.open(file_obj)
        except Exception as e:
            return {
                'success': False,
                'message': 'Failed to decode image file. Please ensure it is a valid JPEG, PNG, or WebP image.'
            }

        try:
            return VisionQualityService.analyze_image_array(
                pil_img,
                file_url=file_url,
                declared_grade=declared_grade,
                expected_crop=crop
            )
        except Exception as e:
            return {
                'success': False,
                'message': f'Error analyzing image: {str(e)}'
            }

    @staticmethod
    def analyze_image_array(pil_img, file_url=None, declared_grade='Grade A', expected_crop='Tomato'):
        """
        Pixel-level deterministic computer vision evaluation.
        """
        # Convert image to RGB numpy array
        img_rgb = pil_img.convert('RGB')
        img_np = np.array(img_rgb)
        h, w, _ = img_np.shape

        expected_crop_clean = (expected_crop or 'Tomato').strip()
        exp_lower = expected_crop_clean.lower()
        dec_grade_clean = (declared_grade or 'Grade A').strip()

        # -------------------------------------------------------------
        # STAGE 1: Image Quality & Suitability Validation
        # -------------------------------------------------------------
        if w < 100 or h < 100:
            return {
                'success': True,
                'image_url': file_url or '',
                'declared_grade': dec_grade_clean,
                'ai_assessed_grade': 'Unverified',
                'expected_crop': expected_crop_clean,
                'detected_crop': 'Unknown',
                'crop_confidence': 0.0,
                'image_quality_status': 'LOW_RESOLUTION',
                'visible_defect_level': 'UNKNOWN',
                'defect_confidence': 0.0,
                'ripeness_pct': 0.0,
                'uniformity_score': 0.0,
                'defect_detected_pct': 0.0,
                'confidence_score': 30.0,
                'verification_status': 'IMAGE_UNSUITABLE',
                'verification_badge': 'Image Unsuitable',
                'model_name': MODEL_NAME,
                'model_version': MODEL_VERSION,
                'assessment_notes': f'Image resolution ({w}x{h} px) is too low for optical quality inspection. Minimum 100x100 px required.',
                'status_description': 'Rejected: Low resolution prevents reliable AI visual grading.',
                'disclaimer': 'AI-assisted visual quality assessment. Not certified laboratory inspection.'
            }

        # Grayscale conversion for luminance and blur analysis
        gray = np.dot(img_np[..., :3], [0.299, 0.587, 0.114])
        mean_lum = float(gray.mean())

        # Check lighting / exposure
        if mean_lum < 25.0:
            return {
                'success': True,
                'image_url': file_url or '',
                'declared_grade': dec_grade_clean,
                'ai_assessed_grade': 'Unverified',
                'expected_crop': expected_crop_clean,
                'detected_crop': 'Unknown',
                'crop_confidence': 0.0,
                'image_quality_status': 'POOR_LIGHTING',
                'visible_defect_level': 'UNKNOWN',
                'defect_confidence': 0.0,
                'ripeness_pct': 0.0,
                'uniformity_score': 0.0,
                'defect_detected_pct': 0.0,
                'confidence_score': 35.0,
                'verification_status': 'IMAGE_UNSUITABLE',
                'verification_badge': 'Image Unsuitable',
                'model_name': MODEL_NAME,
                'model_version': MODEL_VERSION,
                'assessment_notes': f'Image is heavily underexposed (luminance {mean_lum:.1f}/255). Please photograph produce under adequate natural or indoor lighting.',
                'status_description': 'Rejected: Inadequate lighting obscures produce texture and surface characteristics.',
                'disclaimer': 'AI-assisted visual quality assessment. Not certified laboratory inspection.'
            }

        if mean_lum > 242.0:
            return {
                'success': True,
                'image_url': file_url or '',
                'declared_grade': dec_grade_clean,
                'ai_assessed_grade': 'Unverified',
                'expected_crop': expected_crop_clean,
                'detected_crop': 'Unknown',
                'crop_confidence': 0.0,
                'image_quality_status': 'POOR_LIGHTING',
                'visible_defect_level': 'UNKNOWN',
                'defect_confidence': 0.0,
                'ripeness_pct': 0.0,
                'uniformity_score': 0.0,
                'defect_detected_pct': 0.0,
                'confidence_score': 35.0,
                'verification_status': 'IMAGE_UNSUITABLE',
                'verification_badge': 'Image Unsuitable',
                'model_name': MODEL_NAME,
                'model_version': MODEL_VERSION,
                'assessment_notes': f'Image is severely overexposed or washed out (luminance {mean_lum:.1f}/255). Please avoid harsh direct flash or glare.',
                'status_description': 'Rejected: Overexposure washes out color and blemish contours.',
                'disclaimer': 'AI-assisted visual quality assessment. Not certified laboratory inspection.'
            }

        # Check blur using Laplacian variance
        lap_var = float(laplace(gray.astype(np.float64)).var())
        if lap_var < 25.0:
            return {
                'success': True,
                'image_url': file_url or '',
                'declared_grade': dec_grade_clean,
                'ai_assessed_grade': 'Unverified',
                'expected_crop': expected_crop_clean,
                'detected_crop': 'Unknown',
                'crop_confidence': 0.0,
                'image_quality_status': 'BLURRY',
                'visible_defect_level': 'UNKNOWN',
                'defect_confidence': 0.0,
                'ripeness_pct': 0.0,
                'uniformity_score': 0.0,
                'defect_detected_pct': 0.0,
                'confidence_score': 35.0,
                'verification_status': 'IMAGE_UNSUITABLE',
                'verification_badge': 'Image Unsuitable',
                'model_name': MODEL_NAME,
                'model_version': MODEL_VERSION,
                'assessment_notes': f'Image is out of focus or blurry (sharpness index: {lap_var:.1f}, threshold: 25.0). Please hold camera steady to capture sharp produce details.',
                'status_description': 'Rejected: Image blur prevents accurate defect detection and caliber verification.',
                'disclaimer': 'AI-assisted visual quality assessment. Not certified laboratory inspection.'
            }

        # -------------------------------------------------------------
        # STAGE 2: Produce Foreground Segmentation
        # -------------------------------------------------------------
        r = img_np[:, :, 0].astype(np.float32) / 255.0
        g = img_np[:, :, 1].astype(np.float32) / 255.0
        b = img_np[:, :, 2].astype(np.float32) / 255.0

        cmax = np.maximum(np.maximum(r, g), b)
        cmin = np.minimum(np.minimum(r, g), b)
        delta = cmax - cmin
        v = cmax
        s = np.zeros_like(v)
        s[cmax > 0] = delta[cmax > 0] / cmax[cmax > 0]

        # Light neutral background (white paper/surface) & pure black outer borders
        is_light_bg = (gray > 225) & (s < 0.15)
        is_black_border = gray < 15
        produce_mask = ~(is_light_bg | is_black_border)

        total_pixels = w * h
        produce_pixel_count = int(produce_mask.sum())

        # If produce occupies under 4% of image, flag low visibility
        if produce_pixel_count < 0.04 * total_pixels:
            return {
                'success': True,
                'image_url': file_url or '',
                'declared_grade': dec_grade_clean,
                'ai_assessed_grade': 'Unverified',
                'expected_crop': expected_crop_clean,
                'detected_crop': 'Unknown',
                'crop_confidence': 0.0,
                'image_quality_status': 'LOW_PRODUCE_VISIBILITY',
                'visible_defect_level': 'UNKNOWN',
                'defect_confidence': 0.0,
                'ripeness_pct': 0.0,
                'uniformity_score': 0.0,
                'defect_detected_pct': 0.0,
                'confidence_score': 40.0,
                'verification_status': 'IMAGE_UNSUITABLE',
                'verification_badge': 'Image Unsuitable',
                'model_name': MODEL_NAME,
                'model_version': MODEL_VERSION,
                'assessment_notes': 'Produce could not be clearly distinguished from background or occupies too small an area in the frame.',
                'status_description': 'Rejected: Place produce centrally and fill at least 30% of the frame.',
                'disclaimer': 'AI-assisted visual quality assessment. Not certified laboratory inspection.'
            }

        p_r = r[produce_mask]
        p_g = g[produce_mask]
        p_b = b[produce_mask]
        p_v = v[produce_mask]
        p_s = s[produce_mask]

        # -------------------------------------------------------------
        # STAGE 3: Defect & Rot Analysis
        # -------------------------------------------------------------
        # Defect pixels: dark necrotic tissue, rot, deep bruising (p_v < 0.22)
        # or dark fungal discoloration
        defect_mask = (p_v < 0.22) | ((p_r < 0.18) & (p_g < 0.18) & (p_b < 0.18))
        defect_count = int(defect_mask.sum())
        defect_detected_pct = round((defect_count / float(produce_pixel_count)) * 100.0, 1)

        # Healthy produce pixels used for crop chromatic profiling
        healthy_mask = ~defect_mask & (p_s > 0.08)
        if healthy_mask.sum() > 30:
            h_r = p_r[healthy_mask]
            h_g = p_g[healthy_mask]
            h_b = p_b[healthy_mask]
            redness = float((h_r / (h_g + h_b + 1e-5)).mean())
            yellowness = float(((h_r + h_g) / (2.0 * h_b + 1e-5)).mean())
            greenness = float((h_g / (h_r + h_b + 1e-5)).mean())
        else:
            redness = float((p_r / (p_g + p_b + 1e-5)).mean())
            yellowness = float(((p_r + p_g) / (2.0 * p_b + 1e-5)).mean())
            greenness = float((p_g / (p_r + p_b + 1e-5)).mean())

        # -------------------------------------------------------------
        # STAGE 4: Crop Verification & Feature Matching
        # -------------------------------------------------------------
        if redness > 1.25 and greenness < 0.70:
            detected_crop = 'Tomato'
            crop_confidence = min(98.5, round(75.0 + (redness - 1.25) * 20.0, 1))
        elif greenness > 0.80 and redness < 0.85:
            if yellowness > 1.20:
                detected_crop = 'Capsicum'
            else:
                detected_crop = 'Cabbage'
            crop_confidence = 92.5
        elif yellowness > 1.18 and redness < 1.20:
            if redness > 0.82 and p_s.mean() > 0.25:
                detected_crop = 'Onion'
                crop_confidence = 91.0
            else:
                detected_crop = 'Potato'
                crop_confidence = 88.5
        elif redness > 1.15 and yellowness > 1.22:
            detected_crop = 'Carrot'
            crop_confidence = 90.0
        elif mean_lum > 155.0 and p_s.mean() < 0.24:
            detected_crop = 'Cauliflower'
            crop_confidence = 86.0
        elif yellowness > 1.10 and redness > 0.90:
            detected_crop = 'Wheat / Grain'
            crop_confidence = 85.0
        else:
            detected_crop = 'General Field Produce'
            crop_confidence = 78.0

        # Verify against expected crop
        crop_mismatch = False
        mismatch_note = ""

        if 'tomato' in exp_lower and detected_crop != 'Tomato':
            crop_mismatch = True
            mismatch_note = f"Expected 'Tomato', but optical color profiling detected '{detected_crop}' characteristics (Redness: {redness:.2f}, Yellowness: {yellowness:.2f})."
        elif 'onion' in exp_lower and detected_crop != 'Onion':
            crop_mismatch = True
            mismatch_note = f"Expected 'Onion', but optical color profiling detected '{detected_crop}' characteristics."
        elif 'potato' in exp_lower and detected_crop != 'Potato':
            crop_mismatch = True
            mismatch_note = f"Expected 'Potato', but optical color profiling detected '{detected_crop}' characteristics."
        elif 'carrot' in exp_lower and detected_crop != 'Carrot':
            crop_mismatch = True
            mismatch_note = f"Expected 'Carrot', but optical color profiling detected '{detected_crop}' characteristics."
        elif 'cabbage' in exp_lower and detected_crop not in ['Cabbage', 'Capsicum']:
            crop_mismatch = True
            mismatch_note = f"Expected 'Cabbage', but optical color profiling detected '{detected_crop}' characteristics."
        elif 'capsicum' in exp_lower and detected_crop not in ['Capsicum', 'Cabbage']:
            crop_mismatch = True
            mismatch_note = f"Expected 'Capsicum', but optical color profiling detected '{detected_crop}' characteristics."

        if crop_mismatch:
            return {
                'success': True,
                'image_url': file_url or '',
                'declared_grade': dec_grade_clean,
                'ai_assessed_grade': 'Unverified',
                'expected_crop': expected_crop_clean,
                'detected_crop': detected_crop,
                'crop_confidence': crop_confidence,
                'image_quality_status': 'VALID',
                'visible_defect_level': 'UNKNOWN',
                'defect_confidence': 0.0,
                'ripeness_pct': round(float(p_s.mean() * 60.0 + 35.0), 1),
                'uniformity_score': 70.0,
                'defect_detected_pct': defect_detected_pct,
                'confidence_score': crop_confidence,
                'verification_status': 'CROP_MISMATCH',
                'verification_badge': 'Crop Mismatch',
                'model_name': MODEL_NAME,
                'model_version': MODEL_VERSION,
                'assessment_notes': f"Crop mismatch detected: {mismatch_note} Visual grade verification cannot be approved for mismatched produce.",
                'status_description': f"Produce photo does not match listing crop ({expected_crop_clean}). Please upload a photo of the actual harvested produce.",
                'disclaimer': 'AI-assisted visual quality assessment. Not certified laboratory inspection.'
            }

        # -------------------------------------------------------------
        # STAGE 5: Defect Severity & Produce Grade Assessment
        # -------------------------------------------------------------
        ripeness_pct = min(99.0, max(50.0, round(float(p_s.mean() * 70.0 + 35.0), 1)))
        color_std = float(p_r.std() + p_g.std() + p_b.std())
        uniformity_score = min(98.0, max(60.0, round(100.0 - color_std * 48.0, 1)))

        # Determine visible defect level and grade
        if defect_detected_pct >= 10.0:
            visible_defect_level = 'HIGH'
            defect_confidence = 94.5
            ai_assessed_grade = 'Grade C'
            verification_status = 'VISIBLE_DEFECTS'
            verification_badge = 'Visible Defects Detected'
            confidence_score = 93.0
            assessment_notes = (
                f"Significant surface necrosis, rot, or fungal lesions detected across "
                f"{defect_detected_pct:.1f}% of produce surface area. "
                f"Produce does not meet commercial Grade A or Grade B standards."
            )
            status_desc = "Severe visible blemishes/rot detected. Recommended for waste valorization or industrial composting."

        elif defect_detected_pct >= 4.0:
            visible_defect_level = 'MODERATE'
            defect_confidence = 91.0
            ai_assessed_grade = 'Grade B'
            confidence_score = 91.5

            if 'a' in dec_grade_clean.lower():
                verification_status = 'REVIEW_REQUIRED'
                verification_badge = 'Review Required'
                assessment_notes = (
                    f"Moderate surface blemishes or color variation detected ({defect_detected_pct:.1f}%). "
                    f"Farmer declared {dec_grade_clean}, but AI assessed as Grade B. "
                    f"Suitable for culinary processing, puree, or local retail."
                )
                status_desc = f"Moderate defects ({defect_detected_pct:.1f}%). AI suggests Grade B rating."
            else:
                verification_status = 'VERIFIED_ALIGNED'
                verification_badge = 'Verified Aligned'
                assessment_notes = (
                    f"Produce exhibits moderate commercial blemishes ({defect_detected_pct:.1f}%), "
                    f"accurately aligning with farmer-declared {dec_grade_clean}."
                )
                status_desc = f"AI vision confirms produce visual characteristics match declared {dec_grade_clean}."

        else:
            visible_defect_level = 'LOW' if defect_detected_pct > 1.0 else 'NONE'
            defect_confidence = 96.0
            ai_assessed_grade = 'Grade A'
            confidence_score = 95.8

            if 'a' in dec_grade_clean.lower():
                verification_status = 'VERIFIED_ALIGNED'
                verification_badge = 'Verified Aligned'
                assessment_notes = (
                    f"Uniform vibrant coloration ({uniformity_score}%), optimal harvest maturity ({ripeness_pct}%), "
                    f"and low defect level ({defect_detected_pct:.1f}%). Confirms premium {dec_grade_clean} standards."
                )
                status_desc = f"AI vision confirms produce visual characteristics match declared {dec_grade_clean}."
            else:
                verification_status = 'VERIFIED_SUPERIOR'
                verification_badge = 'Exceeds Declaration'
                assessment_notes = (
                    f"Produce visual quality exceeds declared {dec_grade_clean}. "
                    f"Vibrant color, high uniformity ({uniformity_score}%), and minimal defects ({defect_detected_pct:.1f}%)."
                )
                status_desc = f"AI inspection shows produce exceeds declared {dec_grade_clean} and meets Grade A criteria."

        return {
            'success': True,
            'image_url': file_url or '',
            'declared_grade': dec_grade_clean,
            'ai_assessed_grade': ai_assessed_grade,
            'expected_crop': expected_crop_clean,
            'detected_crop': detected_crop,
            'crop_confidence': crop_confidence,
            'image_quality_status': 'VALID',
            'visible_defect_level': visible_defect_level,
            'defect_confidence': defect_confidence,
            'ripeness_pct': ripeness_pct,
            'uniformity_score': uniformity_score,
            'defect_detected_pct': defect_detected_pct,
            'confidence_score': confidence_score,
            'verification_status': verification_status,
            'verification_badge': verification_badge,
            'model_name': MODEL_NAME,
            'model_version': MODEL_VERSION,
            'assessment_notes': assessment_notes,
            'status_description': status_desc,
            'disclaimer': 'AI-assisted visual quality assessment. Not certified laboratory inspection.'
        }
