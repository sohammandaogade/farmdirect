"""
AI Intelligence API Routes for FarmDirect.
Endpoints for Hybrid Matching, Demand Forecasting, Price/Profit, Selling Time, and Procurement Optimization.
"""

from flask import Blueprint, request, jsonify
from utils.auth import token_required
from models import ProduceListing
from services.ai.hybrid_matching import HybridMatchingEngine
from services.ai.demand_forecaster import DemandForecastService
from services.ai.price_forecaster import PriceForecasterService
from services.ai.smart_selling import SmartSellingService
from services.ai.negotiation_copilot import NegotiationCopilot
from services.ai.procurement_optimizer import ProcurementOptimizer
from services.ai.anomaly_detector import AnomalyDetector

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
hybrid_engine = HybridMatchingEngine()

@ai_bp.route('/hybrid-match', methods=['POST'])
def hybrid_match():
    data = request.get_json() or {}
    crop = data.get('crop', '').strip()
    
    # Filter candidate listings
    query = ProduceListing.query.filter(ProduceListing.status == 'ACTIVE', ProduceListing.available_quantity > 0)
    if crop:
        query = query.filter(ProduceListing.crop.ilike(f'%{crop}%'))
    listings = query.all()

    buyer_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        from utils.auth import decode_token
        p = decode_token(auth_header.split(' ')[1])
        if p:
            buyer_id = p.get('user_id')

    ranked_results = hybrid_engine.rank_hybrid(listings, data, buyer_id)
    return jsonify({
        'success': True,
        'count': len(ranked_results),
        'data': ranked_results,
        'requirements': data
    }), 200

@ai_bp.route('/demand', methods=['GET'])
def get_demand():
    crop = request.args.get('crop', 'Tomato')
    region = request.args.get('region', 'Pune')
    report = DemandForecastService.get_demand_forecast(crop, region)
    return jsonify({'success': True, 'data': report}), 200

@ai_bp.route('/price-forecast', methods=['GET'])
def get_price_forecast():
    crop = request.args.get('crop', 'Tomato')
    region = request.args.get('region', 'Pune')
    quality = request.args.get('quality', 'Grade A')
    qty = float(request.args.get('quantity', 1000))
    forecast = PriceForecasterService.get_predictive_fair_price(crop, region, quality, qty)
    return jsonify({'success': True, 'data': forecast}), 200

@ai_bp.route('/profit-calculator', methods=['POST'])
def calculate_profit():
    data = request.get_json() or {}
    crop = data.get('crop', 'Tomato')
    acres = float(data.get('acres', 1.0))
    cost = float(data.get('cost', 0)) if data.get('cost') else None
    yield_kg = float(data.get('yield_kg', 0)) if data.get('yield_kg') else None
    price = float(data.get('price', 0)) if data.get('price') else None
    result = PriceForecasterService.calculate_crop_profit(crop, acres, cost, yield_kg, price)
    return jsonify({'success': True, 'data': result}), 200

@ai_bp.route('/smart-selling', methods=['POST'])
def smart_selling():
    data = request.get_json() or {}
    crop = data.get('crop', 'Tomato')
    price = float(data.get('price', 25.0))
    qty = float(data.get('quantity', 1000.0))
    region = data.get('region', 'Pune')
    result = SmartSellingService.evaluate_selling_time(crop, price, qty, region)
    return jsonify({'success': True, 'data': result}), 200

@ai_bp.route('/negotiation-copilot', methods=['POST'])
def negotiation_copilot():
    data = request.get_json() or {}
    request_id = data.get('request_id')
    role = data.get('role', 'farmer')
    if not request_id:
        return jsonify({'success': False, 'message': 'request_id is required.'}), 400
    res = NegotiationCopilot.analyze_negotiation(request_id, role)
    return jsonify(res), 200

@ai_bp.route('/procurement-optimizer', methods=['POST'])
def procurement_optimizer():
    data = request.get_json() or {}
    raw_query = data.get('query')
    if raw_query:
        req = ProcurementOptimizer.parse_natural_language_query(raw_query)
        if 'max_price' in data and data['max_price']:
            req['max_price'] = float(data['max_price'])
    else:
        req = {
            'crop': data.get('crop', 'Tomato'),
            'quantity': float(data.get('quantity', 2000.0)),
            'quality': data.get('quality', 'Grade A'),
            'location': data.get('location', 'Pune'),
            'max_price': float(data.get('max_price', 35.0)),
            'deadline': data.get('deadline', 'This Friday')
        }
    plans_data = ProcurementOptimizer.generate_procurement_plans(req)
    return jsonify({'success': True, 'data': plans_data}), 200

@ai_bp.route('/duplicate-check', methods=['POST'])
def duplicate_check():
    data = request.get_json() or {}
    farmer_id = data.get('farmer_id', 1)
    crop = data.get('crop', 'Tomato')
    qty = float(data.get('quantity', 1000.0))
    price = float(data.get('price', 25.0))
    loc = data.get('location', 'Pune')
    desc = data.get('description', '')
    res = AnomalyDetector.check_duplicate_listing(farmer_id, crop, qty, price, loc, desc)
    return jsonify({'success': True, 'data': res}), 200
