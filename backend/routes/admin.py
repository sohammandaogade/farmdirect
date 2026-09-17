from flask import Blueprint, request, jsonify
from database import db
from models import User, ProduceListing, Order
from utils.auth import token_required, role_required
from services.analytics import AnalyticsService

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@token_required
@role_required('admin')
def get_all_users(current_user):
    role_filter = request.args.get('role')
    query = User.query
    if role_filter:
        query = query.filter_by(role=role_filter.lower())
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(users),
        'data': [u.to_dict() for u in users]
    }), 200

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PUT'])
@token_required
@role_required('admin')
def toggle_user_status(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404
    if user.id == current_user.id:
        return jsonify({'success': False, 'message': 'Cannot deactivate your own admin account.'}), 400

    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'User {"activated" if user.is_active else "deactivated"} successfully.',
        'data': user.to_dict()
    }), 200

@admin_bp.route('/listings', methods=['GET'])
@token_required
@role_required('admin')
def get_all_listings(current_user):
    listings = ProduceListing.query.order_by(ProduceListing.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(listings),
        'data': [l.to_dict(include_farmer=True) for l in listings]
    }), 200

@admin_bp.route('/listings/<int:listing_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def remove_listing(current_user, listing_id):
    listing = ProduceListing.query.get(listing_id)
    if not listing:
        return jsonify({'success': False, 'message': 'Listing not found.'}), 404
    db.session.delete(listing)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Listing removed by administrator.'
    }), 200

@admin_bp.route('/orders', methods=['GET'])
@token_required
@role_required('admin')
def get_all_orders(current_user):
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(orders),
        'data': [o.to_dict() for o in orders]
    }), 200

@admin_bp.route('/analytics', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_dashboard_metrics(current_user):
    data = AnalyticsService.get_admin_analytics()
    return jsonify({
        'success': True,
        'data': data
    }), 200
