from datetime import datetime, date
from flask import Blueprint, request, jsonify
from database import db
from models import PurchaseRequest, ProduceListing, Negotiation, Order, OrderStatusHistory, Notification
from utils.auth import token_required
from utils.validation import validate_positive_number
from services.logistics import LogisticsService

negotiations_bp = Blueprint('negotiations', __name__, url_prefix='/api/negotiations')

def generate_order_number():
    year = datetime.utcnow().year
    count = Order.query.count() + 1
    return f"FD-{year}-{count:05d}"

@negotiations_bp.route('/<int:request_id>', methods=['GET'])
@token_required
def get_negotiation_timeline(current_user, request_id):
    purchase_req = PurchaseRequest.query.get(request_id)
    if not purchase_req:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    # Security check: must be the buyer or the farmer
    if current_user.role == 'buyer' and purchase_req.buyer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized access.'}), 403
    if current_user.role == 'farmer' and purchase_req.listing.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized access.'}), 403

    negotiations = Negotiation.query.filter_by(request_id=request_id).order_by(Negotiation.created_at.asc()).all()
    latest_offer = negotiations[-1] if negotiations else None

    return jsonify({
        'success': True,
        'data': {
            'request': purchase_req.to_dict(include_details=True),
            'timeline': [n.to_dict() for n in negotiations],
            'latest_offer': latest_offer.to_dict() if latest_offer else None,
            'is_resolved': purchase_req.status in ['ACCEPTED', 'REJECTED', 'CANCELLED']
        }
    }), 200

@negotiations_bp.route('/<int:request_id>/counter', methods=['POST'])
@token_required
def counter_offer(current_user, request_id):
    purchase_req = PurchaseRequest.query.get(request_id)
    if not purchase_req:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    if purchase_req.status in ['ACCEPTED', 'REJECTED', 'CANCELLED']:
        return jsonify({'success': False, 'message': f'Cannot counter a request with status {purchase_req.status}.'}), 400

    listing = purchase_req.listing
    # Check permissions
    is_farmer = (current_user.id == listing.farmer_id)
    is_buyer = (current_user.id == purchase_req.buyer_id)

    if not (is_farmer or is_buyer):
        return jsonify({'success': False, 'message': 'Unauthorized to negotiate this request.'}), 403

    sender_role = 'farmer' if is_farmer else 'buyer'
    recipient_id = purchase_req.buyer_id if is_farmer else listing.farmer_id

    data = request.get_json() or {}
    offered_price = data.get('offered_price')
    offered_quantity = data.get('offered_quantity', purchase_req.requested_quantity)
    message = data.get('message', '').strip()

    if not validate_positive_number(offered_price):
        return jsonify({'success': False, 'message': 'Counter price must be greater than 0.'}), 400

    if not validate_positive_number(offered_quantity):
        return jsonify({'success': False, 'message': 'Counter quantity must be greater than 0.'}), 400

    offered_price = float(offered_price)
    offered_quantity = float(offered_quantity)

    if offered_quantity > listing.available_quantity:
        return jsonify({
            'success': False,
            'message': f'Counter quantity ({offered_quantity:,.0f} kg) exceeds available stock ({listing.available_quantity:,.0f} kg).'
        }), 400

    # Create new negotiation counter record
    negotiation = Negotiation(
        request_id=request_id,
        sender_id=current_user.id,
        sender_role=sender_role,
        offered_price=offered_price,
        offered_quantity=offered_quantity,
        message=message or f'{sender_role.capitalize()} countered with ₹{offered_price}/kg for {offered_quantity:,.0f} kg.',
        status='COUNTERED'
    )
    db.session.add(negotiation)

    # Update purchase request status and last values
    purchase_req.status = 'NEGOTIATING'
    purchase_req.offered_price = offered_price
    purchase_req.requested_quantity = offered_quantity

    # Notify counterpart
    notification = Notification(
        user_id=recipient_id,
        title=f'Counter-Offer: {listing.crop}',
        message=f'{current_user.name} countered with ₹{offered_price}/kg for {offered_quantity:,.0f} kg of {listing.crop}.',
        type='negotiation',
        link=f'/{"farmer" if not is_farmer else "buyer"}/negotiations/{request_id}'
    )
    db.session.add(notification)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Counter-offer submitted successfully.',
        'data': {
            'negotiation': negotiation.to_dict(),
            'request': purchase_req.to_dict()
        }
    }), 200

@negotiations_bp.route('/<int:request_id>/accept', methods=['POST'])
@token_required
def accept_offer(current_user, request_id):
    purchase_req = PurchaseRequest.query.get(request_id)
    if not purchase_req:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    if purchase_req.status in ['ACCEPTED', 'REJECTED', 'CANCELLED']:
        return jsonify({'success': False, 'message': f'This request is already {purchase_req.status.lower()}.'}), 400

    listing = purchase_req.listing
    is_farmer = (current_user.id == listing.farmer_id)
    is_buyer = (current_user.id == purchase_req.buyer_id)

    if not (is_farmer or is_buyer):
        return jsonify({'success': False, 'message': 'Unauthorized to accept this request.'}), 403

    # Get the latest negotiation offer
    latest_negotiation = Negotiation.query.filter_by(request_id=request_id).order_by(Negotiation.created_at.desc()).first()
    
    agreed_price = latest_negotiation.offered_price if latest_negotiation else purchase_req.offered_price
    agreed_quantity = latest_negotiation.offered_quantity if latest_negotiation else purchase_req.requested_quantity

    if agreed_quantity > listing.available_quantity:
        return jsonify({
            'success': False,
            'message': f'Insufficient listing stock ({listing.available_quantity:,.0f} kg available vs {agreed_quantity:,.0f} kg agreed).'
        }), 400

    total_amount = round(agreed_price * agreed_quantity, 2)
    order_number = generate_order_number()

    # Logistics calculation
    farmer_loc = listing.location
    buyer_loc = purchase_req.buyer.buyer_profile.location if purchase_req.buyer.buyer_profile else farmer_loc
    logistics = LogisticsService.estimate_logistics(farmer_loc, buyer_loc, agreed_quantity)

    # 1. Update purchase request
    purchase_req.status = 'ACCEPTED'

    # 2. Add an acceptance record in negotiation timeline
    accept_record = Negotiation(
        request_id=request_id,
        sender_id=current_user.id,
        sender_role='farmer' if is_farmer else 'buyer',
        offered_price=agreed_price,
        offered_quantity=agreed_quantity,
        message=f'Offer accepted by {current_user.name}. Final Agreement: ₹{agreed_price}/kg × {agreed_quantity:,.0f} kg = ₹{total_amount:,.2f}.',
        status='ACCEPTED'
    )
    db.session.add(accept_record)

    # 3. Create the Order
    order = Order(
        order_number=order_number,
        purchase_request_id=purchase_req.id,
        farmer_id=listing.farmer_id,
        buyer_id=purchase_req.buyer_id,
        listing_id=listing.id,
        crop=listing.crop,
        quantity=agreed_quantity,
        agreed_price=agreed_price,
        total_amount=total_amount,
        status='CONFIRMED',
        pickup_date=date.today(),
        distance_km=logistics['distance_km'],
        estimated_transport_cost=logistics['estimated_transport_cost']
    )
    db.session.add(order)
    db.session.flush()

    # 4. Create Order status history
    history = OrderStatusHistory(
        order_id=order.id,
        status='CONFIRMED',
        note=f'Order confirmed automatically following agreed negotiation at ₹{agreed_price}/kg.',
        updated_by=current_user.id
    )
    db.session.add(history)

    # 5. Decrease available quantity on the produce listing
    listing.available_quantity = round(listing.available_quantity - agreed_quantity, 2)
    if listing.available_quantity <= 0:
        listing.available_quantity = 0.0
        listing.status = 'SOLD'

    # 6. Notifications for both parties
    notif_farmer = Notification(
        user_id=listing.farmer_id,
        title=f'Order Confirmed: {order_number}',
        message=f'Agreement finalized! Order {order_number} for {agreed_quantity:,.0f} kg of {listing.crop} (Total ₹{total_amount:,.2f}) is now CONFIRMED.',
        type='order',
        link=f'/farmer/orders'
    )
    notif_buyer = Notification(
        user_id=purchase_req.buyer_id,
        title=f'Order Confirmed: {order_number}',
        message=f'Agreement finalized! Order {order_number} for {agreed_quantity:,.0f} kg of {listing.crop} (Total ₹{total_amount:,.2f}) is now CONFIRMED.',
        type='order',
        link=f'/buyer/orders'
    )
    db.session.add(notif_farmer)
    db.session.add(notif_buyer)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Offer accepted! Order {order_number} created successfully.',
        'data': {
            'order': order.to_dict(),
            'purchase_request': purchase_req.to_dict()
        }
    }), 201

@negotiations_bp.route('/<int:request_id>/reject', methods=['POST'])
@token_required
def reject_offer(current_user, request_id):
    purchase_req = PurchaseRequest.query.get(request_id)
    if not purchase_req:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    listing = purchase_req.listing
    is_farmer = (current_user.id == listing.farmer_id)
    is_buyer = (current_user.id == purchase_req.buyer_id)

    if not (is_farmer or is_buyer):
        return jsonify({'success': False, 'message': 'Unauthorized.'}), 403

    data = request.get_json() or {}
    reason = data.get('reason', '').strip() or 'Offer declined.'

    purchase_req.status = 'REJECTED'

    reject_record = Negotiation(
        request_id=request_id,
        sender_id=current_user.id,
        sender_role='farmer' if is_farmer else 'buyer',
        offered_price=purchase_req.offered_price,
        offered_quantity=purchase_req.requested_quantity,
        message=f'Offer rejected: {reason}',
        status='REJECTED'
    )
    db.session.add(reject_record)

    counterpart_id = purchase_req.buyer_id if is_farmer else listing.farmer_id
    notification = Notification(
        user_id=counterpart_id,
        title=f'Offer Rejected: {listing.crop}',
        message=f'{current_user.name} declined the offer for {listing.crop}. Reason: {reason}',
        type='negotiation',
        link=f'/{"farmer" if not is_farmer else "buyer"}/requests'
    )
    db.session.add(notification)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Offer has been rejected.',
        'data': purchase_req.to_dict()
    }), 200
