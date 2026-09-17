from flask import Blueprint, request, jsonify
from models import PriceReference
from services.price_engine import PriceEngine

price_bp = Blueprint('price', __name__, url_prefix='/api/price-reference')

@price_bp.route('', methods=['GET'])
def list_prices():
    records = PriceReference.query.order_by(PriceReference.crop.asc(), PriceReference.region.asc()).all()
    return jsonify({
        'success': True,
        'count': len(records),
        'disclaimer': 'Historical / demo reference benchmarks. Not live mandi or exchange market data.',
        'data': [r.to_dict() for r in records]
    }), 200

@price_bp.route('/<string:crop>', methods=['GET'])
def get_crop_reference(crop):
    region = request.args.get('region', 'Pune')
    price_val = request.args.get('price')

    listing_price = float(price_val) if price_val else 0.0
    insight = PriceEngine.get_price_insight(crop, region, listing_price)
    
    return jsonify({
        'success': True,
        'data': insight
    }), 200
