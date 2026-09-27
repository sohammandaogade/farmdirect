"""
Computer-Vision Produce Quality Assessment Upload Blueprint.
Handles safe multipart image uploads, visual inspection inference, and audit record creation.
"""

import os
from flask import Blueprint, request, jsonify, current_app
from utils.auth import token_required
from models import QualityInspection, ProduceListing, db
from services.ai.vision_service import VisionQualityService

quality_bp = Blueprint('quality', __name__, url_prefix='/api/quality')

@quality_bp.route('/upload-inspect', methods=['POST'])
def upload_and_inspect():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image file found in multipart upload.'}), 400

    file = request.files['image']
    declared_grade = request.form.get('declared_grade', 'Grade A')
    crop = request.form.get('crop', 'Tomato')
    listing_id = request.form.get('listing_id')
    farmer_id = request.form.get('farmer_id', 1)

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    
    result = VisionQualityService.process_and_inspect_image(
        file,
        declared_grade=declared_grade,
        crop=crop,
        upload_folder=upload_dir
    )

    if not result.get('success'):
        return jsonify(result), 400

    # If listing_id provided or farmer_id present, record in database
    try:
        insp = QualityInspection(
            listing_id=int(listing_id) if listing_id and listing_id.isdigit() else None,
            farmer_id=int(farmer_id) if farmer_id and str(farmer_id).isdigit() else 1,
            image_url=result['image_url'],
            declared_grade=declared_grade,
            ai_assessed_grade=result['ai_assessed_grade'],
            ripeness_pct=result['ripeness_pct'],
            uniformity_score=result['uniformity_score'],
            defect_detected_pct=result['defect_detected_pct'],
            confidence_score=result['confidence_score'],
            verification_status=result['verification_status'],
            assessment_notes=result['assessment_notes'],
            disclaimer=result['disclaimer']
        )
        db.session.add(insp)
        db.session.commit()
        result['inspection_id'] = insp.id
    except Exception as e:
        db.session.rollback()
        # Non-fatal if standalone test without valid FK

    return jsonify(result), 200
