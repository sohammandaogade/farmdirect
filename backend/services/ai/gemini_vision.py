"""
Primary Gemini Multimodal Vision Intelligence Service for FarmDirect.
Handles:
1. Universal Crop Identification across all agricultural commodities.
2. Produce Quality & Listing Suitability Assessment (rot/spoilage detection).
3. Independent validation against user-declared crop (Crop Mismatch detection).
4. Three-state listing decisions (APPROVE, REJECT, REVIEW) with server-side safety enforcement.
5. Graceful fallback preserving existing pixel-level Computer Vision.
"""

import os
import uuid
import hashlib
import logging
from PIL import Image
import numpy as np

from services.ai.gemini_client import gemini_client
from services.ai.schemas import GEMINI_PRIMARY_VISION_SCHEMA
from services.ai.prompts import SYSTEM_PRIMARY_VISION
from services.ai.validators import ProduceVisionValidator, are_crops_compatible
from services.ai.vision_service import VisionQualityService

logger = logging.getLogger('farmdirect.ai.vision')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 8 * 1024 * 1024  # 8 MB


class GeminiVisionService:

    @staticmethod
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def analyze_produce_image(file_obj, user_crop=None, declared_grade='Grade A', filename=None, upload_folder=None):
        """
        Primary multimodal vision entry point.
        Analyzes produce photo, validates quality, identifies crop, and makes listing decision.
        Returns a rich, validated structured result.
        """
        if not file_obj:
            return {
                'success': False,
                'message': 'No image provided for visual verification.',
                'listing_decision': {'status': 'REVIEW', 'reason': 'No image file uploaded.'},
                'can_publish': False
            }

        # Determine filename and extension
        fname = filename or getattr(file_obj, 'filename', '') or f"produce_{uuid.uuid4().hex[:8]}.jpg"
        if not GeminiVisionService.allowed_file(fname):
            return {
                'success': False,
                'message': 'Invalid image format. Supported formats: JPEG, PNG, WebP.',
                'listing_decision': {'status': 'REVIEW', 'reason': 'Unsupported image format.'},
                'can_publish': False
            }

        ext = fname.rsplit('.', 1)[1].lower()
        unique_name = f"produce_{uuid.uuid4().hex[:12]}.{ext}"
        file_url = f"/uploads/{unique_name}"

        # Read image bytes
        image_bytes = None
        try:
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            if hasattr(file_obj, 'read'):
                image_bytes = file_obj.read()
                if hasattr(file_obj, 'seek'):
                    file_obj.seek(0)
            elif isinstance(file_obj, bytes):
                image_bytes = file_obj
            elif isinstance(file_obj, str) and os.path.exists(file_obj):
                with open(file_obj, 'rb') as f:
                    image_bytes = f.read()

            if not image_bytes or len(image_bytes) == 0:
                return {
                    'success': False,
                    'message': 'Empty image payload received.',
                    'listing_decision': {'status': 'REVIEW', 'reason': 'Empty image file.'},
                    'can_publish': False
                }

            if len(image_bytes) > MAX_FILE_SIZE:
                return {
                    'success': False,
                    'message': f'Image size exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB.',
                    'listing_decision': {'status': 'REVIEW', 'reason': 'File size exceeds limit.'},
                    'can_publish': False
                }

        except Exception as e:
            logger.error(f"Error reading image bytes: {e}")
            return {
                'success': False,
                'message': f'Error reading image: {str(e)}',
                'listing_decision': {'status': 'REVIEW', 'reason': 'Failed to read image stream.'},
                'can_publish': False
            }

        image_hash = hashlib.sha256(image_bytes).hexdigest()

        # Save to disk if upload folder specified
        saved_path = None
        if upload_folder:
            try:
                os.makedirs(upload_folder, exist_ok=True)
                saved_path = os.path.join(upload_folder, unique_name)
                with open(saved_path, 'wb') as f:
                    f.write(image_bytes)
            except Exception as e:
                logger.warning(f"Could not persist image to upload folder: {e}")

        # Decode image using PIL for optical pre-validation & existing CV telemetry
        try:
            import io
            pil_img = Image.open(io.BytesIO(image_bytes))
            pil_img.verify()
            # Reopen for array conversion because verify() closes the stream
            pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except Exception as e:
            return {
                'success': False,
                'message': 'Corrupted or unreadable image file. Please upload a valid photo.',
                'listing_decision': {'status': 'REVIEW', 'reason': 'Image decoding failed or corrupted.'},
                'can_publish': False
            }

        # Optical pre-check (dimensions & basic clarity)
        w, h = pil_img.size
        if w < 50 or h < 50:
            return GeminiVisionService._build_unusable_image_response(
                file_url, "Image resolution too low for produce verification. Minimum 50x50 pixels required."
            )

        # Run existing pixel-level CV in parallel for telemetry and fallback
        legacy_cv_telemetry = None
        try:
            legacy_cv_telemetry = VisionQualityService.analyze_image_array(
                pil_img,
                file_url=file_url,
                declared_grade=declared_grade,
                expected_crop=user_crop or 'Tomato'
            )
        except Exception as e:
            logger.warning(f"Legacy CV telemetry calculation warning: {e}")

        # Check if optical CV flagged extreme blur or darkness
        if legacy_cv_telemetry and legacy_cv_telemetry.get('image_quality_status') == 'BLURRY':
            # Note: We flag this, but if Gemini is available, Gemini will also visually inspect
            logger.info("Optical Laplacian variance indicates high blur.")

        # ---------------------------------------------------------------------
        # PRIMARY VISION LAYER: Gemini Multimodal Vision API
        # ---------------------------------------------------------------------
        mime_type = f"image/{'jpeg' if ext in ['jpg', 'jpeg'] else ext}"
        prompt = (
            f"Thoroughly analyze this uploaded produce photo for the FarmDirect agricultural marketplace.\n"
            f"1. Identify the universal agricultural crop/commodity visible in the photo without restricting to a small list.\n"
            f"2. Inspect the visible physical condition of the produce: identify if it has mold, rot, severe decay, or is fresh/acceptable.\n"
            f"3. Note: The seller has labeled this produce as: '{user_crop or 'Unspecified'}'. "
            f"Independently verify what is actually visible. Do not blindly agree with the seller's label if it is different produce."
        )

        gemini_result = None
        if gemini_client.is_available():
            try:
                gemini_res = gemini_client.analyze_image(
                    image_bytes=image_bytes,
                    mime_type=mime_type,
                    prompt=prompt,
                    schema=GEMINI_PRIMARY_VISION_SCHEMA,
                    system_instruction=SYSTEM_PRIMARY_VISION
                )
                if gemini_res.get('success') and gemini_res.get('data'):
                    gemini_result = gemini_res['data']
                else:
                    logger.warning(f"Gemini primary vision call returned fallback/unsuccessful: {gemini_res.get('error')}")
            except Exception as e:
                logger.error(f"Gemini primary vision execution error: {e}")

        # ---------------------------------------------------------------------
        # DECISION PROCESSING & VALIDATION
        # ---------------------------------------------------------------------
        if gemini_result:
            # Validate model output with backend validator (Requirement 7: Do not trust Gemini blindly)
            is_valid, validated_data, val_err = ProduceVisionValidator.validate_raw_vision_response(gemini_result)
            if not is_valid:
                logger.warning(f"Gemini output validation error: {val_err}. Enforcing safe REVIEW status.")

            # Check Crop Mismatch against user-selected crop (Requirement 2)
            detected_crop = validated_data['crop_identification']['name']
            is_compat, mismatch_reason = are_crops_compatible(user_crop, detected_crop)

            if not is_compat and validated_data['is_agricultural_produce']:
                # Flag crop mismatch!
                validated_data['listing_decision']['status'] = 'REVIEW'
                validated_data['listing_decision']['reason'] = (
                    f"Crop mismatch detected: Seller selected '{user_crop}', but AI visual inspection "
                    f"identified '{detected_crop}'. Listing cannot be published until corrected."
                )
                verification_status = 'CROP_MISMATCH'
                can_publish = False
            elif validated_data['listing_decision']['status'] == 'REJECT':
                verification_status = 'REJECTED'
                can_publish = False
            elif validated_data['listing_decision']['status'] == 'APPROVE':
                verification_status = 'VERIFIED_ALIGNED'
                can_publish = True
            else:
                verification_status = 'REVIEW_REQUIRED'
                can_publish = False

            # Compile unified response
            active_m = gemini_client.get_active_model() or 'gemini-flash-latest'
            return GeminiVisionService._format_final_response(
                validated_data=validated_data,
                verification_status=verification_status,
                can_publish=can_publish,
                file_url=file_url,
                user_crop=user_crop,
                declared_grade=declared_grade,
                legacy_cv=legacy_cv_telemetry,
                model_used=f"{active_m} (Primary Vision) + {VisionQualityService.__name__} (Audit)",
                image_hash=image_hash
            )

        # ---------------------------------------------------------------------
        # FALLBACK LAYER: Gemini Unavailable (Requirement 15 & 11)
        # ---------------------------------------------------------------------
        logger.info("Gemini Vision unavailable or offline; invoking safe deterministic CV fallback.")
        return GeminiVisionService._fallback_vision_assessment(
            legacy_cv=legacy_cv_telemetry,
            user_crop=user_crop,
            declared_grade=declared_grade,
            file_url=file_url,
            image_hash=image_hash
        )

    @staticmethod
    def _format_final_response(validated_data, verification_status, can_publish, file_url, user_crop, declared_grade, legacy_cv=None, model_used="Gemini-Vision", image_hash=None):
        """Formats the unified response payload for the backend and frontend."""
        crop_name = validated_data['crop_identification']['name'].title()
        crop_conf = validated_data['crop_identification']['confidence']
        quality_status = validated_data['quality_assessment']['status']
        quality_conf = validated_data['quality_assessment']['confidence']
        issues = validated_data['quality_assessment']['issues']
        decision_status = validated_data['listing_decision']['status']
        decision_reason = validated_data['listing_decision']['reason']

        # Determine user-facing UX strings (Requirement 20)
        if decision_status == 'APPROVE':
            user_title = "✓ Produce verified"
            user_crop_msg = f"Crop: {crop_name}"
            user_cond_msg = "Condition: Suitable for listing"
            assessed_grade = declared_grade if declared_grade in ['Grade A', 'Grade B'] else 'Grade A'
            defect_level = 'LOW'
        elif decision_status == 'REJECT':
            user_title = "✕ Listing rejected"
            user_crop_msg = f"Crop: {crop_name}"
            issue_str = ", ".join(issues) if issues else "Visible signs of spoilage/rot detected."
            user_cond_msg = f"Reason: {issue_str}"
            assessed_grade = 'Sub-standard / Rotten'
            defect_level = 'CRITICAL_SPOILAGE'
        else: # REVIEW or CROP_MISMATCH
            if verification_status == 'CROP_MISMATCH':
                user_title = "⚠️ Crop Mismatch"
                user_crop_msg = f"Detected: {crop_name} (Selected: {user_crop})"
                user_cond_msg = "Please correct the crop name or upload matching produce photo."
            else:
                user_title = "⚠️ Image needs review"
                user_crop_msg = f"Crop: {crop_name}"
                user_cond_msg = decision_reason or "Please upload a clearer image showing the produce."
            assessed_grade = 'Under Review'
            defect_level = 'UNCERTAIN'

        # Defect percentage, Ripeness, and Uniformity telemetry
        defect_pct = 0.0
        ripeness_val = 85.0
        uniformity_val = 80.0

        if legacy_cv and isinstance(legacy_cv, dict):
            if 'defect_detected_pct' in legacy_cv and legacy_cv['defect_detected_pct'] is not None:
                defect_pct = float(legacy_cv['defect_detected_pct'])
            if 'ripeness_pct' in legacy_cv and legacy_cv['ripeness_pct'] is not None:
                ripeness_val = float(legacy_cv['ripeness_pct'])
            if 'uniformity_score' in legacy_cv and legacy_cv['uniformity_score'] is not None:
                uniformity_val = float(legacy_cv['uniformity_score'])
        elif quality_status == 'ROTTEN':
            defect_pct = 45.0
            ripeness_val = 30.0
            uniformity_val = 25.0
        elif quality_status == 'ACCEPTABLE':
            defect_pct = 2.5
            ripeness_val = 88.0
            uniformity_val = 82.0

        return {
            'success': True,
            'image_url': file_url,
            'image_hash': image_hash,
            'can_publish': can_publish,
            'verification_status': verification_status,
            'declared_grade': declared_grade,
            'ai_assessed_grade': assessed_grade,
            'expected_crop': user_crop,
            'detected_crop': crop_name,
            'crop_confidence': round(crop_conf * 100.0, 1),
            'confidence_score': round(quality_conf * 100.0, 1),
            'defect_detected_pct': round(defect_pct, 1),
            'ripeness_pct': round(ripeness_val, 1),
            'uniformity_score': round(uniformity_val, 1),
            'visible_defect_level': defect_level,
            'image_quality_status': validated_data['image_suitability']['issue_detected'],
            'model_name': model_used,
            'assessment_notes': decision_reason,
            'crop_identification': validated_data['crop_identification'],
            'quality_assessment': validated_data['quality_assessment'],
            'listing_decision': validated_data['listing_decision'],
            'user_facing_message': {
                'title': user_title,
                'crop': user_crop_msg,
                'condition': user_cond_msg
            },
            'legacy_cv_telemetry': legacy_cv,
            'disclaimer': 'AI-assisted visual quality assessment. Final transaction quality is subject to physical delivery inspection.'
        }

    @staticmethod
    def _fallback_vision_assessment(legacy_cv, user_crop, declared_grade, file_url, image_hash=None):
        """
        Safe fallback using the preserved deterministic optical CV pipeline
        when Gemini Multimodal API is unavailable.
        """
        if not legacy_cv:
            # Total system unavailability: Flag for REVIEW (Requirement 15: Safety first)
            validated = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": False, "issue_detected": "SERVICE_UNAVAILABLE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": (user_crop or "unknown").lower(), "confidence": 0.5},
                "quality_assessment": {"status": "UNCERTAIN", "confidence": 0.5, "issues": ["Vision API temporarily unavailable"]},
                "listing_decision": {"status": "REVIEW", "reason": "Image verification service is temporarily unavailable."}
            }
            return GeminiVisionService._format_final_response(
                validated, 'REVIEW_REQUIRED', False, file_url, user_crop, declared_grade, None, "FarmDirect-Fallback-SafeEngine", image_hash=image_hash
            )

        # Check existing CV result
        detected = (legacy_cv.get('detected_crop') or 'Unknown').lower()
        cv_status = legacy_cv.get('image_quality_status', 'VALID')
        defect_pct = legacy_cv.get('defect_detected_pct', 0.0)

        # 1. Optical issue (blurry, dark, low res)
        if cv_status in ['BLURRY', 'POOR_LIGHTING', 'LOW_RESOLUTION', 'LOW_PRODUCE_VISIBILITY']:
            validated = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": False, "issue_detected": cv_status},
                "multiple_crops_detected": False,
                "crop_identification": {"name": detected, "confidence": 0.5},
                "quality_assessment": {"status": "UNCERTAIN", "confidence": 0.5, "issues": [legacy_cv.get('assessment_notes', 'Optical flaw')]},
                "listing_decision": {"status": "REVIEW", "reason": legacy_cv.get('assessment_notes', 'Image quality unsuitable.')}
            }
            return GeminiVisionService._format_final_response(
                validated, 'IMAGE_UNSUITABLE', False, file_url, user_crop, declared_grade, legacy_cv, "FarmDirect-AgriVision-ColorTextureEngine", image_hash=image_hash
            )

        # 2. Crop Mismatch (User declared one crop, but optical CV detected another)
        is_compat, mismatch_reason = are_crops_compatible(user_crop, detected)
        if (legacy_cv.get('verification_status') == 'CROP_MISMATCH') or (user_crop and detected != 'unknown' and not is_compat):
            validated = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": detected, "confidence": 0.88},
                "quality_assessment": {"status": "ACCEPTABLE", "confidence": 0.80, "issues": []},
                "listing_decision": {"status": "REVIEW", "reason": mismatch_reason or legacy_cv.get('assessment_notes')}
            }
            return GeminiVisionService._format_final_response(
                validated, 'CROP_MISMATCH', False, file_url, user_crop, declared_grade, legacy_cv, "FarmDirect-AgriVision-ColorTextureEngine", image_hash=image_hash
            )

        # 3. Critical Spoilage / High defect ratio / Mold
        if (defect_pct >= 15.0 or 
            legacy_cv.get('verification_status') == 'REJECTED' or
            legacy_cv.get('visible_defect_level') in ['CRITICAL_SPOILAGE', 'ROTTEN'] or
            legacy_cv.get('ai_assessed_grade') in ['Grade C / Sub-standard', 'Sub-standard / Rotten']):
            validated = {
                "is_agricultural_produce": True,
                "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
                "multiple_crops_detected": False,
                "crop_identification": {"name": detected, "confidence": 0.85},
                "quality_assessment": {"status": "ROTTEN", "confidence": 0.90, "issues": [legacy_cv.get('assessment_notes') or f"Severe mold/defect surface area ({defect_pct}%)"]},
                "listing_decision": {"status": "REJECT", "reason": legacy_cv.get('assessment_notes') or f"Severe produce defects detected ({defect_pct}% surface blemishes)."}
            }
            return GeminiVisionService._format_final_response(
                validated, 'REJECTED', False, file_url, user_crop, declared_grade, legacy_cv, "FarmDirect-AgriVision-ColorTextureEngine", image_hash=image_hash
            )

        # 4. Standard Optical Scan Passed (Multimodal Gemini Unavailable)
        # SECTION 14 MANDATE: NEVER auto-approve when Gemini fails/unavailable!
        # Always hold for REVIEW so produce is not auto-approved without multimodal verification.
        validated = {
            "is_agricultural_produce": True,
            "image_suitability": {"is_usable": True, "issue_detected": "NONE"},
            "multiple_crops_detected": False,
            "crop_identification": {"name": detected, "confidence": 0.70},
            "quality_assessment": {"status": "UNCERTAIN", "confidence": 0.65, "issues": ["Multimodal vision offline; optical telemetry recorded."]},
            "listing_decision": {"status": "REVIEW", "reason": "Produce held for secondary review: multimodal vision verification was offline."}
        }
        return GeminiVisionService._format_final_response(
            validated, 'REVIEW_REQUIRED', False, file_url, user_crop, declared_grade, legacy_cv, "FarmDirect-AgriVision-ColorTextureEngine (Fallback-Review)", image_hash=image_hash
        )

    @staticmethod
    def _build_unusable_image_response(file_url, reason):
        return {
            'success': True,
            'image_url': file_url or '',
            'can_publish': False,
            'verification_status': 'IMAGE_UNSUITABLE',
            'crop_identification': {'name': 'unknown', 'confidence': 0.0},
            'quality_assessment': {'status': 'UNCERTAIN', 'confidence': 0.0, 'issues': [reason]},
            'listing_decision': {'status': 'REVIEW', 'reason': reason},
            'user_facing_message': {
                'title': '⚠️ Image needs review',
                'crop': 'Crop: Unknown',
                'condition': reason
            },
            'disclaimer': 'AI-assisted visual quality assessment.'
        }
