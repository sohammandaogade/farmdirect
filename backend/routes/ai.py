"""
AI Intelligence API Routes for FarmDirect.
Endpoints for Hybrid Matching, Demand Forecasting, Price/Profit, Selling Time, and Procurement Optimization.
"""

from flask import Blueprint, request, jsonify
from database import db
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

# -------------------------------------------------------------
# NEW MODULAR AI INTELLIGENCE ENDPOINTS
# -------------------------------------------------------------

@ai_bp.route('/procurement/parse', methods=['POST'])
def parse_procurement_query():
    data = request.get_json() or {}
    query = data.get('query', '').strip()
    if not query:
        return jsonify({'success': False, 'message': 'Procurement query text is required.'}), 400
    res = ProcurementOptimizer.parse_natural_language_query(query)
    return jsonify({'success': True, 'data': res}), 200

@ai_bp.route('/listing/generate', methods=['POST'])
def generate_listing_draft():
    data = request.get_json() or {}
    prompt = data.get('prompt', '').strip()
    if not prompt:
        return jsonify({'success': False, 'message': 'Prompt description is required.'}), 400
    from services.ai.copilot_service import CopilotService
    draft = CopilotService.generate_listing_attributes(prompt)
    return jsonify({'success': True, 'data': draft}), 200

@ai_bp.route('/listing/analyze', methods=['POST'])
def analyze_listing_completeness():
    data = request.get_json() or {}
    from services.ai.copilot_service import CopilotService
    audit = CopilotService.analyze_listing_quality(data)
    return jsonify({'success': True, 'data': audit}), 200

@ai_bp.route('/listing/from-image', methods=['POST'])
def generate_listing_from_image():
    from flask import current_app
    from services.ai.gemini_vision import GeminiVisionService
    from services.ai.copilot_service import CopilotService

    file_obj = request.files.get('image')
    description = request.form.get('description', '')
    declared_grade = request.form.get('declared_grade', 'Grade A')
    crop_hint = request.form.get('crop', 'Tomato')

    if not file_obj:
        return jsonify({'success': False, 'message': 'Produce image file is required.'}), 400

    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    inspection = GeminiVisionService.analyze_produce_image(
        file_obj,
        user_crop=crop_hint,
        declared_grade=declared_grade,
        upload_folder=upload_folder
    )

    if not inspection.get('success'):
        return jsonify(inspection), 400

    # Server-side blocking: Do NOT generate listing for rotten/unfit produce
    if inspection.get('verification_status') == 'REJECTED' or inspection.get('listing_decision', {}).get('status') == 'REJECT':
        return jsonify({
            'success': False,
            'status': 'REJECTED',
            'message': 'Cannot create listing: Uploaded produce was verified as rotten, spoiled, or unfit for sale.',
            'inspection': inspection
        }), 422

    detected_crop = inspection.get('detected_crop') or crop_hint
    assessed_grade = inspection.get('ai_assessed_grade') or declared_grade
    full_prompt = f"I have fresh {assessed_grade} {detected_crop}. {description}".strip()

    listing_draft = CopilotService.generate_listing_attributes(full_prompt)
    listing_draft['crop'] = detected_crop
    listing_draft['quality_grade'] = assessed_grade
    listing_draft['image_url'] = inspection.get('image_url')
    listing_draft['inspection_summary'] = inspection

    return jsonify({
        'success': True,
        'data': {
            'inspection': inspection,
            'suggested_listing': listing_draft
        }
    }), 200

@ai_bp.route('/vision/analyze-produce', methods=['POST'])
def analyze_produce_vision():
    """
    Primary Multimodal Vision Analysis Endpoint.
    Universal crop identification, quality assessment (rot/spoilage detection),
    crop mismatch checking, and three-state listing decision (APPROVE, REJECT, REVIEW).
    """
    from flask import current_app
    from services.ai.gemini_vision import GeminiVisionService

    file_obj = request.files.get('image')
    if not file_obj:
        return jsonify({'success': False, 'message': 'Produce image file is required in multipart upload.'}), 400

    crop = request.form.get('crop')
    declared_grade = request.form.get('declared_grade', 'Grade A')
    upload_folder = current_app.config.get('UPLOAD_FOLDER')

    result = GeminiVisionService.analyze_produce_image(
        file_obj,
        user_crop=crop,
        declared_grade=declared_grade,
        upload_folder=upload_folder
    )
    return jsonify(result), 200 if result.get('success') else 400

@ai_bp.route('/match/explain', methods=['POST'])
def explain_match():
    data = request.get_json() or {}
    listing_id = data.get('listing_id')
    req = data.get('requirements') or {}

    if not listing_id:
        return jsonify({'success': False, 'message': 'listing_id is required.'}), 400

    listing = db.session.get(ProduceListing, listing_id)
    if not listing:
        return jsonify({'success': False, 'message': 'Listing not found.'}), 404

    buyer_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        from utils.auth import decode_token
        p = decode_token(auth_header.split(' ')[1])
        if p:
            buyer_id = p.get('user_id')

    explanation = hybrid_engine.generate_ai_match_explanation(listing, req, buyer_id)
    return jsonify({'success': True, 'data': explanation}), 200

@ai_bp.route('/pricing/insight', methods=['POST'])
def get_pricing_insight():
    data = request.get_json() or {}
    crop = data.get('crop', 'Tomato')
    region = data.get('region', 'Pune')
    price = float(data.get('price', 25.0))

    from services.price_engine import PriceEngine
    insight = PriceEngine.generate_ai_price_insight(crop, region, price)
    return jsonify({'success': True, 'data': insight}), 200

@ai_bp.route('/analytics/summary', methods=['GET'])
def get_analytics_summary():
    from services.analytics import AnalyticsService
    summary = AnalyticsService.generate_executive_marketplace_summary()
    return jsonify({'success': True, 'data': summary}), 200

