"""
Farm Waste & Agricultural By-products Marketplace Route Blueprint.
Secondary revenue ecosystem for straw, bagasse, pomace, husks, and compost.
"""

from flask import Blueprint, request, jsonify
from utils.auth import token_required
from models import WasteListing, WasteOrder, db

waste_bp = Blueprint('waste', __name__, url_prefix='/api/waste')

@waste_bp.route('/listings', methods=['GET'])
def get_waste_listings():
    query = WasteListing.query.filter_by(status='ACTIVE')
    waste_type = request.args.get('type')
    location = request.args.get('location')

    if waste_type:
        query = query.filter(WasteListing.waste_type.ilike(f'%{waste_type}%'))
    if location:
        query = query.filter(WasteListing.location.ilike(f'%{location}%'))

    listings = query.order_by(WasteListing.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(listings),
        'data': [l.to_dict() for l in listings]
    }), 200

@waste_bp.route('/my-listings', methods=['GET'])
@token_required
def get_my_waste_listings(current_user):
    listings = WasteListing.query.filter_by(farmer_id=current_user.id).order_by(WasteListing.created_at.desc()).all()
    return jsonify({'success': True, 'data': [l.to_dict() for l in listings]}), 200

@waste_bp.route('/listings', methods=['POST'])
@token_required
def create_waste_listing(current_user):
    if current_user.role != 'farmer':
        return jsonify({'success': False, 'message': 'Only registered farmers can list agricultural waste.'}), 403

    data = request.get_json() or {}
    waste_type = data.get('waste_type')
    quantity = float(data.get('quantity', 0))
    price = float(data.get('asking_price', 0))

    if not waste_type or quantity <= 0 or price <= 0:
        return jsonify({'success': False, 'message': 'Waste type, valid quantity, and asking price are required.'}), 400

    listing = WasteListing(
        farmer_id=current_user.id,
        waste_type=waste_type,
        quantity=quantity,
        unit=data.get('unit', 'tonnes'),
        asking_price=price,
        location=data.get('location') or (current_user.farmer_profile.location if current_user.farmer_profile else 'Pune'),
        description=data.get('description', ''),
        suggested_uses=data.get('suggested_uses', 'Biofuel, Compost, Cattle Fodder'),
        image_url=data.get('image_url') or 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=600',
        status='ACTIVE'
    )
    db.session.add(listing)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Waste listing published successfully.', 'data': listing.to_dict()}), 201

@waste_bp.route('/orders', methods=['POST'])
@token_required
def purchase_waste(current_user):
    data = request.get_json() or {}
    listing_id = data.get('waste_listing_id')
    quantity = float(data.get('quantity', 0))

    listing = WasteListing.query.get(listing_id)
    if not listing or listing.status != 'ACTIVE':
        return jsonify({'success': False, 'message': 'Waste listing not available.'}), 404

    if quantity <= 0 or quantity > listing.quantity:
        return jsonify({'success': False, 'message': f'Quantity must be between 1 and {listing.quantity} {listing.unit}.'}), 400

    total_price = round(quantity * listing.asking_price, 2)
    order = WasteOrder(
        waste_listing_id=listing.id,
        buyer_id=current_user.id,
        quantity=quantity,
        unit=listing.unit,
        total_price=total_price,
        status='CONFIRMED'
    )

    # Decrement remaining quantity
    listing.quantity -= quantity
    if listing.quantity <= 0:
        listing.status = 'SOLD'

    db.session.add(order)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Successfully placed waste procurement order for ₹{total_price:,.2f}.',
        'data': order.to_dict()
    }), 201
