from flask import Blueprint, request, jsonify
from models import ProduceListing, User
from services.matching_engine import MatchingEngine
from services.price_engine import PriceEngine
from services.logistics import LogisticsService
from utils.auth import decode_token

matching_bp = Blueprint('matching', __name__, url_prefix='/api/matching')

@matching_bp.route('', methods=['POST'])
def match_produce():
    req_data = request.get_json() or {}
    
    crop = req_data.get('crop', '').strip()
    quantity = float(req_data.get('quantity', 0)) if req_data.get('quantity') else 0
    max_price = float(req_data.get('max_price', 0)) if req_data.get('max_price') else 0
    location = req_data.get('location', '').strip()
    quality = req_data.get('quality', '').strip()
    required_by_date = req_data.get('required_by_date')

    # If buyer is logged in and location wasn't explicitly typed, use buyer's profile location
    auth_header = request.headers.get('Authorization')
    buyer_user = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        if payload and payload.get('role') == 'buyer':
            buyer_user = User.query.get(payload['user_id'])
            if buyer_user and buyer_user.buyer_profile and not location:
                location = buyer_user.buyer_profile.location

    # Query active listings
    active_query = ProduceListing.query.filter(
        ProduceListing.status == 'ACTIVE',
        ProduceListing.available_quantity > 0
    )

    if crop:
        # Filter for candidates that match or broadly match crop
        active_query = active_query.filter(ProduceListing.crop.ilike(f'%{crop}%'))

    candidate_listings = active_query.all()

    engine = MatchingEngine()
    ranked_results = engine.rank_listings(candidate_listings, {
        'crop': crop,
        'quantity': quantity,
        'max_price': max_price,
        'location': location,
        'quality': quality,
        'required_by_date': required_by_date
    })

    # Enrich top matches with price insights and logistics estimate
    for item in ranked_results:
        listing_obj = item['listing']
        item['price_insight'] = PriceEngine.get_price_insight(
            listing_obj['crop'],
            listing_obj['location'],
            listing_obj['expected_price']
        )
        if location:
            item['logistics_estimate'] = LogisticsService.estimate_logistics(
                listing_obj['location'],
                location,
                quantity if quantity > 0 else listing_obj['available_quantity']
            )

    return jsonify({
        'success': True,
        'count': len(ranked_results),
        'requirements': {
            'crop': crop,
            'quantity': quantity,
            'max_price': max_price,
            'location': location,
            'quality': quality,
            'required_by_date': required_by_date
        },
        'data': ranked_results
    }), 200
