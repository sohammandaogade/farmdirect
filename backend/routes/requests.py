from flask import Blueprint, request, jsonify
from database import db
from models import PurchaseRequest, ProduceListing, Negotiation, Notification
from utils.auth import token_required, role_required
from utils.validation import validate_positive_number

requests_bp = Blueprint('requests', __name__, url_prefix='/api/requests')

@requests_bp.route('', methods=['POST'])
@token_required
@role_required('buyer')
def create_request(current_user):
    data = request.get_json() or {}
    listing_id = data.get('listing_id')
    requested_quantity = data.get('requested_quantity')
    offered_price = data.get('offered_price')
    message = data.get('message', '').strip()

    if not listing_id:
        return jsonify({'success': False, 'message': 'Listing ID is required.'}), 400

    listing = ProduceListing.query.get(listing_id)
    if not listing or listing.status != 'ACTIVE':
        return jsonify({'success': False, 'message': 'Produce listing is unavailable or inactive.'}), 404

    if not validate_positive_number(requested_quantity):
        return jsonify({'success': False, 'message': 'Requested quantity must be greater than 0.'}), 400

    requested_quantity = float(requested_quantity)
    if requested_quantity > listing.available_quantity:
        return jsonify({
            'success': False,
            'message': f'Requested quantity ({requested_quantity:,.0f} kg) exceeds available stock ({listing.available_quantity:,.0f} kg).'
        }), 400

    if not validate_positive_number(offered_price):
        return jsonify({'success': False, 'message': 'Offer price must be greater than 0.'}), 400

    offered_price = float(offered_price)

    # Check if buyer already has an active pending/negotiating request for this listing
    existing = PurchaseRequest.query.filter_by(
        buyer_id=current_user.id,
        listing_id=listing_id
    ).filter(PurchaseRequest.status.in_(['PENDING', 'NEGOTIATING'])).first()
    
    if existing:
        return jsonify({
            'success': False,
            'message': 'You already have an active request in progress for this listing.',
            'data': existing.to_dict()
        }), 400

    # Create Purchase Request
    purchase_request = PurchaseRequest(
        buyer_id=current_user.id,
        listing_id=listing.id,
        requested_quantity=requested_quantity,
        offered_price=offered_price,
        message=message or f'Offer of ₹{offered_price}/kg for {requested_quantity:,.0f} kg of {listing.crop}.',
        status='PENDING'
    )
    db.session.add(purchase_request)
    db.session.flush()

    # Create first Negotiation record
    initial_offer = Negotiation(
        request_id=purchase_request.id,
        sender_id=current_user.id,
        sender_role='buyer',
        offered_price=offered_price,
        offered_quantity=requested_quantity,
        message=purchase_request.message,
        status='PENDING'
    )
    db.session.add(initial_offer)

    # Notify Farmer
    farmer_notification = Notification(
        user_id=listing.farmer_id,
        title=f'New Purchase Request: {listing.crop}',
        message=f'{current_user.name} sent an offer of ₹{offered_price}/kg for {requested_quantity:,.0f} kg of {listing.crop}.',
        type='request',
        link=f'/farmer/requests'
    )
    db.session.add(farmer_notification)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Purchase request sent successfully.',
        'data': purchase_request.to_dict()
    }), 201

@requests_bp.route('', methods=['GET'])
@token_required
def get_requests(current_user):
    status_filter = request.args.get('status')
    
    if current_user.role == 'farmer':
        query = PurchaseRequest.query.join(ProduceListing).filter(
            ProduceListing.farmer_id == current_user.id
        )
    elif current_user.role == 'buyer':
        query = PurchaseRequest.query.filter_by(buyer_id=current_user.id)
    else:  # admin
        query = PurchaseRequest.query

    if status_filter:
        query = query.filter(PurchaseRequest.status == status_filter.upper())

    requests_list = query.order_by(PurchaseRequest.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(requests_list),
        'data': [r.to_dict(include_details=True) for r in requests_list]
    }), 200

@requests_bp.route('/<int:request_id>', methods=['GET'])
@token_required
def get_request_detail(current_user, request_id):
    req_item = PurchaseRequest.query.get(request_id)
    if not req_item:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    # Security check: must be the buyer, the listing's farmer, or an admin
    if current_user.role == 'buyer' and req_item.buyer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized access to this request.'}), 403
    if current_user.role == 'farmer' and req_item.listing.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized access to this request.'}), 403

    data = req_item.to_dict(include_details=True)
    data['negotiations'] = [n.to_dict() for n in req_item.negotiations]
    return jsonify({
        'success': True,
        'data': data
    }), 200

@requests_bp.route('/<int:request_id>/cancel', methods=['PUT'])
@token_required
@role_required('buyer')
def cancel_request(current_user, request_id):
    req_item = PurchaseRequest.query.get(request_id)
    if not req_item or req_item.buyer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Request not found or unauthorized.'}), 404

    if req_item.status in ['ACCEPTED', 'CANCELLED']:
        return jsonify({'success': False, 'message': f'Cannot cancel request with status {req_item.status}.'}), 400

    req_item.status = 'CANCELLED'
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Purchase request cancelled.',
        'data': req_item.to_dict()
    }), 200
