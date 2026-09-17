from flask import Blueprint, jsonify
from services.analytics import AnalyticsService
from utils.auth import token_required, role_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/farmer', methods=['GET'])
@token_required
@role_required('farmer')
def get_farmer_analytics(current_user):
    data = AnalyticsService.get_farmer_analytics(current_user.id)
    return jsonify({
        'success': True,
        'data': data
    }), 200

@analytics_bp.route('/buyer', methods=['GET'])
@token_required
@role_required('buyer')
def get_buyer_analytics(current_user):
    data = AnalyticsService.get_buyer_analytics(current_user.id)
    return jsonify({
        'success': True,
        'data': data
    }), 200

@analytics_bp.route('/admin', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_analytics(current_user):
    data = AnalyticsService.get_admin_analytics()
    return jsonify({
        'success': True,
        'data': data
    }), 200
