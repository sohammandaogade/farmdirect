from flask import Blueprint, jsonify
from database import db
from models import Notification
from utils.auth import token_required

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications(current_user):
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify({
        'success': True,
        'count': len(notifs),
        'unread_count': len([n for n in notifs if not n.is_read]),
        'data': [n.to_dict() for n in notifs]
    }), 200

@notifications_bp.route('/mark-read', methods=['PUT'])
@token_required
def mark_all_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({Notification.is_read: True})
    db.session.commit()
    return jsonify({'success': True, 'message': 'All notifications marked as read.'}), 200

@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@token_required
def mark_single_read(current_user, notif_id):
    notif = Notification.query.get(notif_id)
    if notif and notif.user_id == current_user.id:
        notif.is_read = True
        db.session.commit()
    return jsonify({'success': True, 'message': 'Notification marked as read.'}), 200
