from datetime import date, datetime
from flask import Blueprint, request, jsonify
from database import db
from models import Order, OrderStatusHistory, Notification, OrderComplaint
from utils.auth import token_required

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

VALID_TRANSITIONS = {
    'CONFIRMED': ['PICKUP_SCHEDULED', 'CANCELLED'],
    'PICKUP_SCHEDULED': ['IN_TRANSIT', 'CANCELLED'],
    'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': []
}

@orders_bp.route('', methods=['GET'])
@token_required
def get_orders(current_user):
    status_filter = request.args.get('status')
    
    if current_user.role == 'farmer':
        query = Order.query.filter_by(farmer_id=current_user.id)
    elif current_user.role == 'buyer':
        query = Order.query.filter_by(buyer_id=current_user.id)
    else:  # admin
        query = Order.query

    if status_filter:
        query = query.filter_by(status=status_filter.upper())

    orders_list = query.order_by(Order.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(orders_list),
        'data': [o.to_dict() for o in orders_list]
    }), 200

@orders_bp.route('/<int:order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found.'}), 404

    # Security check: must be farmer, buyer, or admin
    if current_user.role == 'farmer' and order.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized access to this order.'}), 403
    if current_user.role == 'buyer' and order.buyer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized access to this order.'}), 403

    return jsonify({
        'success': True,
        'data': order.to_dict()
    }), 200

@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
@token_required
def update_order_status(current_user, order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found.'}), 404

    # Only farmer or admin can advance operational status
    if current_user.role == 'buyer':
        return jsonify({'success': False, 'message': 'Buyers cannot change operational delivery status.'}), 403

    if current_user.role == 'farmer' and order.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'You can only update status for your own farm orders.'}), 403

    data = request.get_json() or {}
    new_status = data.get('status', '').upper().strip()
    note = data.get('note', '').strip()

    allowed = VALID_TRANSITIONS.get(order.status, [])
    if new_status not in allowed and current_user.role != 'admin':
        return jsonify({
            'success': False,
            'message': f'Cannot transition from {order.status} to {new_status}. Allowed transitions: {", ".join(allowed) if allowed else "None (Terminal State)"}'
        }), 400

    order.status = new_status
    if new_status == 'DELIVERED':
        order.actual_delivery_date = date.today()
    elif new_status == 'PICKUP_SCHEDULED':
        order.pickup_date = date.today()

    # Create status history
    history = OrderStatusHistory(
        order_id=order.id,
        status=new_status,
        note=note or f'Status updated to {new_status} by {current_user.name}.',
        updated_by=current_user.id
    )
    db.session.add(history)

    # Notify counterpart (buyer)
    notif = Notification(
        user_id=order.buyer_id,
        title=f'Order Update: {order.order_number}',
        message=f'Your order {order.order_number} for {order.crop} has moved to: {new_status.replace("_", " ")}.',
        type='order_status',
        link=f'/buyer/orders'
    )
    db.session.add(notif)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Order status updated to {new_status}.',
        'data': order.to_dict()
    }), 200

@orders_bp.route('/<int:order_id>/history', methods=['GET'])
@token_required
def get_order_history(current_user, order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found.'}), 404

    if current_user.role == 'farmer' and order.farmer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized.'}), 403
    if current_user.role == 'buyer' and order.buyer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized.'}), 403

    history = OrderStatusHistory.query.filter_by(order_id=order_id).order_by(OrderStatusHistory.created_at.asc()).all()
    return jsonify({
        'success': True,
        'data': [h.to_dict() for h in history]
    }), 200

@orders_bp.route('/<int:order_id>/rate', methods=['POST'])
@token_required
def rate_order(current_user, order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found.'}), 404

    # Security check: Only the buyer of this order can submit ratings
    if current_user.role != 'buyer' or order.buyer_id != current_user.id:
        return jsonify({'success': False, 'message': 'Only the purchasing buyer can submit an order rating.'}), 403

    # Status check: Only delivered or completed orders can be rated
    if order.status not in ['DELIVERED', 'COMPLETED']:
        return jsonify({
            'success': False,
            'message': f'Cannot rate order with status {order.status}. Only delivered or completed orders can be rated.'
        }), 400

    # Duplicate check: Prevent multiple ratings for the same order
    if order.rating is not None:
        return jsonify({
            'success': False,
            'message': f'This order has already been rated ({order.rating} stars). Duplicate ratings are prohibited.'
        }), 400

    data = request.get_json() or {}
    rating_val = data.get('rating')
    review_text = data.get('review_text', '').strip()

    if not rating_val or not isinstance(rating_val, int) or rating_val < 1 or rating_val > 5:
        return jsonify({'success': False, 'message': 'Rating must be an integer between 1 and 5 stars.'}), 400

    order.rating = rating_val
    order.review_text = review_text or None
    order.rated_at = datetime.utcnow()

    # If status was DELIVERED, advance to COMPLETED
    if order.status == 'DELIVERED':
        order.status = 'COMPLETED'
        history = OrderStatusHistory(
            order_id=order.id,
            status='COMPLETED',
            note=f'Order marked as COMPLETED following buyer rating ({rating_val} stars).',
            updated_by=current_user.id
        )
        db.session.add(history)

    # Notify farmer of rating
    notif = Notification(
        user_id=order.farmer_id,
        title=f'New Rating Received: Order {order.order_number}',
        message=f'Buyer {current_user.name} rated order {order.order_number} {rating_val}/5 stars: "{review_text[:60] if review_text else "No written review"}".',
        type='rating',
        link='/farmer/orders'
    )
    db.session.add(notif)

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Order rating and review submitted successfully.',
        'data': order.to_dict()
    }), 200

BUYER_COMPLAINT_CATEGORIES = [
    'Wrong quantity', 'Poor quality', 'Damaged produce', 'Wrong crop',
    'Missing delivery', 'Late delivery', 'Payment problem', 'Seller issue', 'Other'
]

FARMER_COMPLAINT_CATEGORIES = [
    'Buyer payment issue', 'Buyer cancellation', 'Incorrect order',
    'Delivery dispute', 'Buyer misconduct', 'Suspicious buyer', 'Other'
]

@orders_bp.route('/<int:order_id>/complaints', methods=['POST'])
@token_required
def create_order_complaint(current_user, order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found.'}), 404

    # Security check: User must be either the buyer or the farmer of this order
    is_buyer = (current_user.id == order.buyer_id)
    is_farmer = (current_user.id == order.farmer_id)
    if not (is_buyer or is_farmer):
        return jsonify({'success': False, 'message': 'Unauthorized to report issues on this order.'}), 403

    role = 'buyer' if is_buyer else 'farmer'
    data = request.get_json() or {}
    category = data.get('category', '').strip()
    description = data.get('description', '').strip()
    evidence_path = data.get('evidence_path', '').strip()

    valid_categories = BUYER_COMPLAINT_CATEGORIES if is_buyer else FARMER_COMPLAINT_CATEGORIES
    if not category:
        return jsonify({'success': False, 'message': 'Complaint category is required.'}), 400

    if not description or len(description) < 5:
        return jsonify({'success': False, 'message': 'Please provide a detailed description (minimum 5 characters).'}), 400

    year = datetime.utcnow().year
    ticket_count = OrderComplaint.query.count() + 1
    ticket_number = f"CMP-{year}-{ticket_count:05d}"

    complaint = OrderComplaint(
        ticket_number=ticket_number,
        order_id=order.id,
        listing_id=order.listing_id,
        reporter_id=current_user.id,
        reporter_role=role,
        category=category,
        description=description,
        evidence_path=evidence_path or None,
        status='SUBMITTED'
    )
    db.session.add(complaint)

    # Notify counterpart
    counterpart_id = order.farmer_id if is_buyer else order.buyer_id
    notif = Notification(
        user_id=counterpart_id,
        title=f'Issue Reported on Order {order.order_number}',
        message=f'{current_user.name} filed a dispute under category "{category}". Ticket: {ticket_number}.',
        type='complaint',
        link='/buyer/orders' if is_farmer else '/farmer/orders'
    )
    db.session.add(notif)
    db.session.commit()

    # Trigger supplier dispute anomaly audit
    try:
        from services.ai.anomaly_detector import AnomalyDetector
        AnomalyDetector.audit_complaint_fraud(order.farmer_id)
    except Exception:
        pass

    return jsonify({
        'success': True,
        'message': f'Complaint ticket {ticket_number} created successfully.',
        'data': complaint.to_dict()
    }), 201

@orders_bp.route('/<int:order_id>/complaints', methods=['GET'])
@token_required
def get_order_complaints(current_user, order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found.'}), 404

    if current_user.role != 'admin' and current_user.id not in [order.buyer_id, order.farmer_id]:
        return jsonify({'success': False, 'message': 'Unauthorized.'}), 403

    complaints = OrderComplaint.query.filter_by(order_id=order_id).order_by(OrderComplaint.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(complaints),
        'data': [c.to_dict() for c in complaints]
    }), 200

@orders_bp.route('/complaints', methods=['GET'])
@token_required
def get_user_complaints(current_user):
    if current_user.role == 'admin':
        complaints = OrderComplaint.query.order_by(OrderComplaint.created_at.desc()).all()
    else:
        complaints = OrderComplaint.query.filter_by(reporter_id=current_user.id).order_by(OrderComplaint.created_at.desc()).all()

    return jsonify({
        'success': True,
        'count': len(complaints),
        'data': [c.to_dict() for c in complaints]
    }), 200

@orders_bp.route('/complaints/<int:complaint_id>/status', methods=['PUT'])
@token_required
def update_complaint_status(current_user, complaint_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Only platform administrators can adjudicate complaints.'}), 403

    complaint = OrderComplaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'success': False, 'message': 'Complaint ticket not found.'}), 404

    data = request.get_json() or {}
    new_status = data.get('status', '').upper().strip()
    resolution_note = data.get('resolution_note', '').strip()

    valid_statuses = ['SUBMITTED', 'UNDER REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED']
    if new_status not in valid_statuses:
        return jsonify({
            'success': False,
            'message': f'Invalid status "{new_status}". Valid statuses: {", ".join(valid_statuses)}'
        }), 400

    complaint.status = new_status
    if resolution_note:
        complaint.resolution_note = resolution_note

    # Notify reporter
    notif = Notification(
        user_id=complaint.reporter_id,
        title=f'Complaint Update: {complaint.ticket_number}',
        message=f'Your complaint {complaint.ticket_number} has been updated to: {new_status}. {resolution_note[:60] if resolution_note else ""}',
        type='complaint',
        link='/buyer/orders' if complaint.reporter_role == 'buyer' else '/farmer/orders'
    )
    db.session.add(notif)

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Complaint status updated to {new_status}.',
        'data': complaint.to_dict()
    }), 200
