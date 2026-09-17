from flask import Blueprint, request, jsonify
from database import db
from models import User, FarmerProfile, ProduceListing, Order
from utils.auth import token_required, role_required
from utils.validation import validate_positive_number, validate_date

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

    listing = ProduceListing(
        farmer_id=current_user.id,
        crop=crop,
        quantity=float(quantity),
        available_quantity=float(quantity),
        unit=unit,
        expected_price=float(expected_price),
        location=location,
        quality_grade=quality_grade,
        availability_date=avail_date,
        description=description,
        image_url=image_url,
        status='ACTIVE'
    )
    db.session.add(listing)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Produce listing created successfully.',
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
    if 'crop' in data and data['crop']:
        listing.crop = data['crop'].strip()
    if 'quantity' in data:
        if not validate_positive_number(data['quantity']):
            return jsonify({'success': False, 'message': 'Quantity must be greater than 0.'}), 400
        diff = float(data['quantity']) - listing.quantity
        listing.quantity = float(data['quantity'])
        listing.available_quantity = max(0.0, listing.available_quantity + diff)
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
        listing.status = data['status']

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Listing updated successfully.',
        'data': listing.to_dict(include_farmer=False)
    }), 200

@farmers_bp.route('/listings/<int:listing_id>/status', methods=['PUT'])
@token_required
@role_required('farmer')
def toggle_status(current_user, listing_id):
    listing = ProduceListing.query.get(listing_id)
    if not listing or listing.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Listing not found or unauthorized.'}), 404
    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ['ACTIVE', 'PAUSED', 'SOLD']:
        return jsonify({'success': False, 'message': 'Invalid status.'}), 400
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
