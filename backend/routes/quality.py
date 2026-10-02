"""
Computer-Vision Produce Quality Assessment Upload Blueprint.
Handles safe multipart image uploads, visual inspection inference, and audit record creation.
"""

import os
from flask import Blueprint, request, jsonify, current_app
from utils.auth import token_required, role_required
from models import QualityInspection, ProduceListing, db
from services.ai.vision_service import VisionQualityService
from services.ai.gemini_vision import GeminiVisionService

quality_bp = Blueprint('quality', __name__, url_prefix='/api/quality')

@quality_bp.route('/upload-inspect', methods=['POST'])
@token_required
@role_required('farmer')
def upload_and_inspect(current_user):
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image file found in multipart upload.'}), 400

    file = request.files['image']
    declared_grade = request.form.get('declared_grade', 'Grade A')
    crop = request.form.get('crop', 'Tomato')
    listing_id = request.form.get('listing_id')

    # Security: Authenticated farmer ownership enforcement (Section 11)
    # Reject client-supplied farmer_id tampering; always bind to current_user.id
    authenticated_farmer_id = current_user.id

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    
    result = GeminiVisionService.analyze_produce_image(
        file,
        user_crop=crop,
        declared_grade=declared_grade,
        upload_folder=upload_dir
    )

    if not result.get('success'):
        return jsonify(result), 400

    # Validate listing_id ownership if provided
    listing_id_val = None
    if listing_id and str(listing_id).isdigit():
        chk_listing = db.session.get(ProduceListing, int(listing_id))
        if chk_listing and chk_listing.farmer_id == authenticated_farmer_id:
            listing_id_val = chk_listing.id

    # Persist inspection in database
    try:
        insp = QualityInspection(
            listing_id=listing_id_val,
            farmer_id=authenticated_farmer_id,
            image_url=result.get('image_url', ''),
            image_hash=result.get('image_hash'),
            declared_grade=declared_grade,
            ai_assessed_grade=result.get('ai_assessed_grade', 'Unverified'),
            expected_crop=result.get('expected_crop', crop),
            detected_crop=result.get('detected_crop'),
            crop_confidence=result.get('crop_confidence', 0.0),
            image_quality_status=result.get('image_quality_status', 'VALID'),
            visible_defect_level=result.get('visible_defect_level', 'LOW'),
            defect_confidence=result.get('defect_confidence', 0.0),
            model_name=result.get('model_name', 'FarmDirect-AgriVision-ColorTextureEngine'),
            ripeness_pct=result.get('ripeness_pct') or (result.get('legacy_cv_telemetry') or {}).get('ripeness_pct', 85.0),
            uniformity_score=result.get('uniformity_score') or (result.get('legacy_cv_telemetry') or {}).get('uniformity_score', 80.0),
            defect_detected_pct=result.get('defect_detected_pct', 0.0),
            confidence_score=result.get('confidence_score', 0.0),
            verification_status=result.get('verification_status', 'UNVERIFIED'),
            assessment_notes=result.get('assessment_notes', ''),
            disclaimer=result.get('disclaimer', '')
        )
        db.session.add(insp)
        db.session.commit()
        result['inspection_id'] = insp.id
        result['id'] = insp.id
        result['farmer_id'] = authenticated_farmer_id
    except Exception as e:
        db.session.rollback()
        current_app.logger.warning(f"Could not persist QualityInspection to database: {e}")

    return jsonify(result), 200

@quality_bp.route('/listing/<int:listing_id>', methods=['GET'])
def get_listing_inspection(listing_id):
    """Retrieve the latest quality inspection report for a given produce listing."""
    insp = QualityInspection.query.filter_by(listing_id=listing_id).order_by(QualityInspection.created_at.desc()).first()
    if not insp:
        return jsonify({'success': False, 'message': 'No quality inspection found for this listing.'}), 404
    return jsonify({
        'success': True,
        'data': insp.to_dict()
    }), 200
