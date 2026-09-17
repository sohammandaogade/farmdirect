from flask import Blueprint, request, jsonify
from services.logistics import LogisticsService

logistics_bp = Blueprint('logistics', __name__, url_prefix='/api/logistics')

@logistics_bp.route('/estimate', methods=['POST'])
def estimate():
    data = request.get_json() or {}
    farmer_loc = data.get('farmer_location', '').strip()
    buyer_loc = data.get('buyer_location', '').strip()
    quantity_kg = float(data.get('quantity_kg', 1000)) if data.get('quantity_kg') else 1000.0

    if not farmer_loc or not buyer_loc:
        return jsonify({'success': False, 'message': 'Farmer location and buyer location are required.'}), 400

    result = LogisticsService.estimate_logistics(farmer_loc, buyer_loc, quantity_kg)
    return jsonify({
        'success': True,
        'data': result
    }), 200
