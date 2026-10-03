from flask import Blueprint, request, jsonify
from database import db
from models import ProduceListing, User
from services.price_engine import PriceEngine
from services.logistics import LogisticsService
from utils.auth import decode_token

marketplace_bp = Blueprint('marketplace', __name__, url_prefix='/api/marketplace')

@marketplace_bp.route('', methods=['GET'])
def get_listings():
    query = ProduceListing.query.filter(
        ProduceListing.status.in_(['PUBLISHED', 'ACTIVE', 'APPROVED']),
        ProduceListing.available_quantity > 0
    )

    q = request.args.get('q', '').strip()
    if q:
        query = query.filter(
            (ProduceListing.crop.ilike(f'%{q}%')) |
            (ProduceListing.location.ilike(f'%{q}%')) |
            (ProduceListing.description.ilike(f'%{q}%'))
        )

    crop = request.args.get('crop', '').strip()
    if crop:
        query = query.filter(ProduceListing.crop.ilike(f'%{crop}%'))

    location = request.args.get('location', '').strip()
    if location:
        query = query.filter(ProduceListing.location.ilike(f'%{location}%'))

    quality = request.args.get('quality', '').strip()
    if quality:
        query = query.filter(ProduceListing.quality_grade.ilike(f'%{quality}%'))

    min_price = request.args.get('min_price')
    if min_price:
        try:
            query = query.filter(ProduceListing.expected_price >= float(min_price))
        except ValueError:
            pass

    max_price = request.args.get('max_price')
    if max_price:
        try:
            query = query.filter(ProduceListing.expected_price <= float(max_price))
        except ValueError:
            pass

    min_quantity = request.args.get('min_quantity')
    if min_quantity:
        try:
            query = query.filter(ProduceListing.available_quantity >= float(min_quantity))
        except ValueError:
            pass

    # Sorting
    sort = request.args.get('sort', 'newest').lower()
    if sort == 'price_asc':
        query = query.order_by(ProduceListing.expected_price.asc())
    elif sort == 'price_desc':
        query = query.order_by(ProduceListing.expected_price.desc())
    elif sort == 'quantity_desc':
        query = query.order_by(ProduceListing.available_quantity.desc())
    else:  # newest
        query = query.order_by(ProduceListing.created_at.desc())

    listings = query.all()
    return jsonify({
        'success': True,
        'count': len(listings),
        'data': [l.to_dict(include_farmer=True) for l in listings]
    }), 200

@marketplace_bp.route('/<int:listing_id>', methods=['GET'])
def get_listing_detail(listing_id):
    listing = db.session.get(ProduceListing, listing_id)
    if not listing:
        return jsonify({'success': False, 'message': 'Listing not found.'}), 404

    if listing.status not in ['PUBLISHED', 'ACTIVE', 'APPROVED']:
        return jsonify({'success': False, 'message': 'This produce listing is not publicly published.'}), 404

    data = listing.to_dict(include_farmer=True)
    
    # Fair price insight
    data['price_insight'] = PriceEngine.get_price_insight(
        listing.crop,
        listing.location,
        listing.expected_price
    )

    # Attach verified AI quality inspection if available
    from models import QualityInspection
    insp = QualityInspection.query.filter_by(listing_id=listing.id).order_by(QualityInspection.created_at.desc()).first()
    if insp:
        data['quality_inspection'] = insp.to_dict()

    # Check if a buyer is calling and provide logistics estimate
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        if payload and payload.get('role') == 'buyer':
            buyer_user = User.query.get(payload['user_id'])
            if buyer_user and buyer_user.buyer_profile:
                data['logistics_estimate'] = LogisticsService.estimate_logistics(
                    listing.location,
                    buyer_user.buyer_profile.location,
                    listing.available_quantity
                )

    return jsonify({
        'success': True,
        'data': data
    }), 200
