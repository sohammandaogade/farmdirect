from flask import Blueprint, request, jsonify
from database import db
from models import BuyerProfile
from utils.auth import token_required, role_required

buyers_bp = Blueprint('buyers', __name__, url_prefix='/api/buyers')

@buyers_bp.route('/profile', methods=['GET'])
@token_required
@role_required('buyer')
def get_profile(current_user):
    profile = current_user.buyer_profile
    if not profile:
        return jsonify({'success': False, 'message': 'Buyer profile not found.'}), 404
    return jsonify({'success': True, 'data': profile.to_dict()}), 200

@buyers_bp.route('/profile', methods=['PUT'])
@token_required
@role_required('buyer')
def update_profile(current_user):
    data = request.get_json() or {}
    profile = current_user.buyer_profile
    if not profile:
        profile = BuyerProfile(user_id=current_user.id, business_name='', buyer_type='Restaurant', location='')
        db.session.add(profile)

    if 'business_name' in data and data['business_name']:
        profile.business_name = data['business_name'].strip()
    if 'buyer_type' in data and data['buyer_type']:
        profile.buyer_type = data['buyer_type'].strip()
    if 'location' in data and data['location']:
        profile.location = data['location'].strip()
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
