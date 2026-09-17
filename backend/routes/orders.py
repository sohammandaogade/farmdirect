from datetime import date, datetime
from flask import Blueprint, request, jsonify
from database import db
from models import Order, OrderStatusHistory, Notification
from utils.auth import token_required

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

VALID_TRANSITIONS = {
    'CONFIRMED': ['PICKUP_SCHEDULED', 'CANCELLED'],
    'PICKUP_SCHEDULED': ['IN_TRANSIT', 'CANCELLED'],
    'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
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
