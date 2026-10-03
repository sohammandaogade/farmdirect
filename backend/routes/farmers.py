from flask import Blueprint, request, jsonify
from database import db
from models import User, FarmerProfile, ProduceListing, Order, QualityInspection
from utils.auth import token_required, role_required
from utils.validation import validate_positive_number, validate_date
from services.ai.validators import are_crops_compatible

farmers_bp = Blueprint('farmers', __name__, url_prefix='/api/farmers')

@farmers_bp.route('/profile', methods=['GET'])
@token_required
@role_required('farmer')
def get_profile(current_user):
    profile = current_user.farmer_profile
    if not profile:
        return jsonify({'success': False, 'message': 'Farmer profile not found.'}), 404
    return jsonify({'success': True, 'data': profile.to_dict()}), 200

@farmers_bp.route('/profile', methods=['PUT'])
@token_required
@role_required('farmer')
def update_profile(current_user):
    data = request.get_json() or {}
    profile = current_user.farmer_profile
    if not profile:
        profile = FarmerProfile(user_id=current_user.id, farm_name='', location='')
        db.session.add(profile)

    if 'farm_name' in data and data['farm_name']:
        profile.farm_name = data['farm_name'].strip()
    if 'location' in data and data['location']:
        profile.location = data['location'].strip()
    if 'farm_size' in data:
        profile.farm_size = data['farm_size'].strip()
    if 'primary_crops' in data:
        profile.primary_crops = data['primary_crops'].strip()
    if 'phone' in data:
        current_user.phone = data['phone'].strip()
    if 'name' in data and data['name']:
        current_user.name = data['name'].strip()

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully.',
        'data': profile.to_dict()
    }), 200

@farmers_bp.route('/listings', methods=['GET'])
@token_required
@role_required('farmer')
def get_listings(current_user):
    status_filter = request.args.get('status')
    query = ProduceListing.query.filter_by(farmer_id=current_user.id)
    if status_filter:
        query = query.filter_by(status=status_filter.upper())
    listings = query.order_by(ProduceListing.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [l.to_dict(include_farmer=False) for l in listings]
    }), 200

@farmers_bp.route('/listings', methods=['POST'])
@token_required
@role_required('farmer')
def create_listing(current_user):
    data = request.get_json() or {}
    crop = data.get('crop', '').strip()
    quantity = data.get('quantity')
    expected_price = data.get('expected_price')
    unit = data.get('unit', 'kg').strip() or 'kg'
    location = data.get('location', '').strip() or (current_user.farmer_profile.location if current_user.farmer_profile else '')
    quality_grade = data.get('quality_grade', 'Grade A').strip()
    availability_date_str = data.get('availability_date')
    description = data.get('description', '').strip()
    image_url = data.get('image_url', '').strip()
    inspection_id = data.get('inspection_id')

    if not crop:
        return jsonify({'success': False, 'message': 'Crop name is required.'}), 400

    if not validate_positive_number(quantity):
        return jsonify({'success': False, 'message': 'Quantity must be greater than 0.'}), 400

    if not validate_positive_number(expected_price):
        return jsonify({'success': False, 'message': 'Expected price must be greater than 0.'}), 400

    if not location:
        return jsonify({'success': False, 'message': 'Produce location is required.'}), 400

    avail_date = validate_date(availability_date_str)
    if not avail_date:
        return jsonify({'success': False, 'message': 'Valid availability date (YYYY-MM-DD) is required.'}), 400

    if not image_url:
        return jsonify({
            'success': False,
            'message': 'Produce photo upload is compulsory. Please upload a clear photo of your harvested produce for AI quality verification before submitting a listing.'
        }), 400

    # -------------------------------------------------------------
    # SERVER-SIDE AI QUALITY & CROP VERIFICATION ENFORCEMENT
    # -------------------------------------------------------------
    # -------------------------------------------------------------
    # SERVER-SIDE AI QUALITY & CROP VERIFICATION ENFORCEMENT
    # -------------------------------------------------------------
    inspection = None
    if inspection_id:
        try:
            inspection = db.session.get(QualityInspection, int(inspection_id))
        except (ValueError, TypeError):
            inspection = None

        # Ownership check: Farmers can only bind their OWN inspections (Section 11)
        if inspection and inspection.farmer_id != current_user.id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized inspection: This quality inspection record belongs to a different farmer.'
            }), 403

        # Anti-stale reuse check: An inspection cannot be attached to multiple listings
        if inspection and inspection.listing_id is not None:
            return jsonify({
                'success': False,
                'message': 'Inspection already attached: This quality inspection record is already linked to another listing. Stale inspection reuse is prohibited. Please perform a fresh produce scan.'
            }), 409

    if not inspection and image_url:
        norm_url = image_url.lstrip('/')
        inspection = QualityInspection.query.filter(
            QualityInspection.farmer_id == current_user.id,
            QualityInspection.listing_id.is_(None),
            (
                (QualityInspection.image_url == image_url) | 
                (QualityInspection.image_url == f"/{norm_url}") |
                (QualityInspection.image_url == norm_url)
            )
        ).order_by(QualityInspection.created_at.desc()).first()

    initial_status = 'ACTIVE'

    if inspection:
        # 1. ROTTEN PRODUCE MUST BE BLOCKED SERVER-SIDE (Requirement 6)
        if (inspection.verification_status in ['REJECTED', 'ROTTEN', 'REJECT'] or
            inspection.visible_defect_level in ['CRITICAL_SPOILAGE', 'ROTTEN'] or
            getattr(inspection, 'ai_assessed_grade', '') in ['Sub-standard / Rotten', 'ROTTEN', 'REJECTED']):
            return jsonify({
                'success': False,
                'status': 'REJECTED',
                'message': 'Cannot create listing: The uploaded produce was verified as rotten, spoiled, or unfit for sale. Rotten produce is strictly blocked from the marketplace.',
                'listing_decision': {'status': 'REJECT', 'reason': inspection.assessment_notes or 'Produce verified as rotten.'},
                'quality_assessment': {'status': 'ROTTEN'}
            }), 422

        # 2. CROP MISMATCH MUST BE BLOCKED SERVER-SIDE (Requirement 2)
        is_compat, mismatch_reason = are_crops_compatible(crop, inspection.detected_crop)
        if not is_compat or inspection.verification_status == 'CROP_MISMATCH':
            return jsonify({
                'success': False,
                'status': 'CROP_MISMATCH',
                'message': f'Cannot create listing: Crop mismatch detected. You selected "{crop}", but the uploaded produce was identified as "{inspection.detected_crop or "different produce"}". Please correct the crop name or upload matching photos.',
                'listing_decision': {'status': 'REVIEW', 'reason': 'Crop mismatch detected.'},
                'detected_crop': inspection.detected_crop,
                'selected_crop': crop
            }), 422

        # 3. IF REVIEW: DO NOT PUBLISH AUTOMATICALLY AS ACTIVE (Requirement 6)
        if inspection.verification_status in ['REVIEW_REQUIRED', 'REVIEW', 'IMAGE_UNSUITABLE', 'UNVERIFIED']:
            initial_status = 'PAUSED'
    else:
        # Produce without an AI quality inspection must NOT be auto-published as ACTIVE
        initial_status = 'PAUSED'

    qty_val = float(quantity)
    if qty_val < 5000:
        return jsonify({'success': False, 'message': 'Minimum listing quantity is 5,000 kg.'}), 400

    if qty_val > 50000:
        return jsonify({'success': False, 'message': 'Maximum listing quantity is 50,000 kg.'}), 400

    listing = ProduceListing(
        farmer_id=current_user.id,
        crop=crop,
        quantity=qty_val,
        available_quantity=qty_val,
        unit=unit,
        expected_price=float(expected_price),
        location=location,
        quality_grade=quality_grade,
        availability_date=avail_date,
        description=description,
        image_url=image_url,
        status=initial_status
    )
    db.session.add(listing)
    db.session.flush()

    if inspection:
        inspection.listing_id = listing.id

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Produce listing created successfully.' if initial_status == 'ACTIVE' else 'Listing created and held under review.',
        'data': listing.to_dict(include_farmer=True)
    }), 201

@farmers_bp.route('/listings/<int:listing_id>', methods=['GET'])
@token_required
@role_required('farmer')
def get_listing(current_user, listing_id):
    listing = ProduceListing.query.get(listing_id)
    if not listing:
        return jsonify({'success': False, 'message': 'Listing not found.'}), 404
    if listing.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized to view this listing.'}), 403
    return jsonify({'success': True, 'data': listing.to_dict(include_farmer=False)}), 200

@farmers_bp.route('/listings/<int:listing_id>', methods=['PUT'])
@token_required
@role_required('farmer')
def update_listing(current_user, listing_id):
    listing = ProduceListing.query.get(listing_id)
    if not listing:
        return jsonify({'success': False, 'message': 'Listing not found.'}), 404
    if listing.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'You can only edit your own listings.'}), 403

    data = request.get_json() or {}

    # Anti-Bypass Protection: Detect produce or image alterations (Section 12)
    old_crop = listing.crop
    old_image = listing.image_url
    crop_changed = ('crop' in data and data['crop'] and data['crop'].strip().lower() != old_crop.lower())
    image_changed = ('image_url' in data and data['image_url'] and data['image_url'].strip() != old_image)

    new_inspection_id = data.get('inspection_id')
    new_inspection = None

    if crop_changed or image_changed:
        if new_inspection_id:
            try:
                new_inspection = db.session.get(QualityInspection, int(new_inspection_id))
            except (ValueError, TypeError):
                new_inspection = None

            if not new_inspection or new_inspection.farmer_id != current_user.id:
                return jsonify({
                    'success': False,
                    'message': 'Unauthorized inspection: The specified inspection record does not belong to your account.'
                }), 403

            # Verify updated produce is not rotten
            if (new_inspection.verification_status in ['REJECTED', 'ROTTEN', 'REJECT'] or
                new_inspection.visible_defect_level in ['CRITICAL_SPOILAGE', 'ROTTEN'] or
                getattr(new_inspection, 'ai_assessed_grade', '') in ['Sub-standard / Rotten', 'ROTTEN', 'REJECTED']):
                return jsonify({
                    'success': False,
                    'status': 'REJECTED',
                    'message': 'Cannot update listing: The updated produce photo was verified as rotten or unfit for sale.',
                    'listing_decision': {'status': 'REJECT', 'reason': new_inspection.assessment_notes or 'Produce verified as rotten.'}
                }), 422

            # Verify updated crop compatibility
            target_crop = data.get('crop', listing.crop).strip()
            is_compat, mismatch_reason = are_crops_compatible(target_crop, new_inspection.detected_crop)
            if not is_compat or new_inspection.verification_status == 'CROP_MISMATCH':
                return jsonify({
                    'success': False,
                    'status': 'CROP_MISMATCH',
                    'message': f'Cannot update listing: Crop mismatch detected. The updated photo was identified as "{new_inspection.detected_crop}".'
                }), 422

            new_inspection.listing_id = listing.id
            if new_inspection.verification_status in ['REVIEW_REQUIRED', 'REVIEW', 'IMAGE_UNSUITABLE', 'UNVERIFIED']:
                listing.status = 'PAUSED'
        else:
            # Produce crop or image changed without fresh inspection -> hold under review
            listing.status = 'PAUSED'

    if 'crop' in data and data['crop']:
        listing.crop = data['crop'].strip()
    if 'quantity' in data:
        if not validate_positive_number(data['quantity']):
            return jsonify({'success': False, 'message': 'Quantity must be greater than 0.'}), 400
        qty_val = float(data['quantity'])
        if qty_val < 5000:
            return jsonify({'success': False, 'message': 'Minimum listing quantity is 5,000 kg.'}), 400
        if qty_val > 50000:
            return jsonify({'success': False, 'message': 'Maximum listing quantity is 50,000 kg.'}), 400
        diff = qty_val - listing.quantity
        listing.quantity = qty_val
        listing.available_quantity = max(0.0, listing.available_quantity + diff)
        if listing.available_quantity <= 0.0001:
            listing.available_quantity = 0.0
            listing.status = 'SOLD'
    if 'expected_price' in data:
        if not validate_positive_number(data['expected_price']):
            return jsonify({'success': False, 'message': 'Expected price must be greater than 0.'}), 400
        listing.expected_price = float(data['expected_price'])
    if 'location' in data and data['location']:
        listing.location = data['location'].strip()
    if 'quality_grade' in data and data['quality_grade']:
        listing.quality_grade = data['quality_grade'].strip()
    if 'availability_date' in data and data['availability_date']:
        avail_date = validate_date(data['availability_date'])
        if avail_date:
            listing.availability_date = avail_date
    if 'description' in data:
        listing.description = data['description'].strip()
    if 'image_url' in data:
        listing.image_url = data['image_url'].strip()
    if 'status' in data and data['status'] in ['ACTIVE', 'PAUSED', 'SOLD']:
        # If crop or image was modified without inspection, force PAUSED
        if (crop_changed or image_changed) and not new_inspection:
            listing.status = 'PAUSED'
        else:
            listing.status = data['status']

    db.session.commit()
    msg = 'Listing updated successfully.'
    if (crop_changed or image_changed) and not new_inspection:
        msg = 'Produce details updated. Listing held under PAUSED status pending AI quality re-inspection.'

    return jsonify({
        'success': True,
        'message': msg,
        'data': listing.to_dict(include_farmer=False)
    }), 200

@farmers_bp.route('/listings/<int:listing_id>/status', methods=['PUT'])
@token_required
@role_required('farmer')
def toggle_status(current_user, listing_id):
    listing = db.session.get(ProduceListing, listing_id)
    if not listing or listing.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Listing not found or unauthorized.'}), 404
    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ['ACTIVE', 'PAUSED', 'SOLD']:
        return jsonify({'success': False, 'message': 'Invalid status.'}), 400

    # Anti-bypass verification: Prevent publishing rotten, mismatched, or uninspected listings
    if new_status == 'ACTIVE':
        insp = listing.quality_inspections[-1] if listing.quality_inspections else QualityInspection.query.filter_by(listing_id=listing.id).order_by(QualityInspection.created_at.desc()).first()
        if not insp and listing.image_url:
            norm_url = listing.image_url.lstrip('/')
            insp = QualityInspection.query.filter(
                QualityInspection.farmer_id == current_user.id,
                (
                    (QualityInspection.image_url == listing.image_url) | 
                    (QualityInspection.image_url == f"/{norm_url}") |
                    (QualityInspection.image_url == norm_url)
                )
            ).order_by(QualityInspection.created_at.desc()).first()

        if not insp:
            return jsonify({
                'success': False,
                'status': 'INSPECTION_REQUIRED',
                'message': 'Cannot activate listing: Listing has no completed AI quality inspection report. Please perform a produce scan first.'
            }), 422

        if (insp.verification_status in ['REJECTED', 'ROTTEN', 'REJECT'] or
            insp.visible_defect_level in ['CRITICAL_SPOILAGE', 'ROTTEN'] or
            getattr(insp, 'ai_assessed_grade', '') in ['Sub-standard / Rotten', 'ROTTEN', 'REJECTED']):
            return jsonify({
                'success': False,
                'status': 'REJECTED',
                'message': 'Cannot activate listing: The produce photo was verified as rotten, spoiled, or unfit for sale.'
            }), 422

        is_compat, mismatch_reason = are_crops_compatible(listing.crop, insp.detected_crop)
        if not is_compat or insp.verification_status == 'CROP_MISMATCH':
            return jsonify({
                'success': False,
                'status': 'CROP_MISMATCH',
                'message': f'Cannot activate listing: Crop mismatch detected. Listing is "{listing.crop}", but inspection identified "{insp.detected_crop}".'
            }), 422

        if insp.verification_status in ['REVIEW_REQUIRED', 'REVIEW', 'IMAGE_UNSUITABLE', 'UNVERIFIED']:
            return jsonify({
                'success': False,
                'status': 'REVIEW_REQUIRED',
                'message': 'Cannot activate listing: Produce inspection is currently flagged for review and cannot be published directly.'
            }), 422

    listing.status = new_status
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Listing status changed to {new_status}.',
        'data': listing.to_dict()
    }), 200

@farmers_bp.route('/listings/<int:listing_id>', methods=['DELETE'])
@token_required
@role_required('farmer')
def delete_listing(current_user, listing_id):
    listing = ProduceListing.query.get(listing_id)
    if not listing or listing.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Listing not found or unauthorized.'}), 404
    
    # Check if there are active orders for this listing
    active_order = Order.query.filter(Order.listing_id == listing_id, Order.status.in_(['CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT'])).first()
    if active_order:
        return jsonify({'success': False, 'message': 'Cannot delete listing with active orders.'}), 400

    db.session.delete(listing)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Listing deleted successfully.'}), 200
