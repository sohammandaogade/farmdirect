from flask import Blueprint, request, jsonify
from database import db
from models import User, FarmerProfile, BuyerProfile
from utils.auth import generate_token, token_required
from utils.validation import validate_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    role = data.get('role', '').lower().strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()

    if not name or not email or not password or not role:
        return jsonify({'success': False, 'message': 'Name, email, password, and role are required.'}), 400

    if role not in ['farmer', 'buyer']:
        return jsonify({'success': False, 'message': 'Role must be either "farmer" or "buyer".'}), 400

    if not validate_email(email):
        return jsonify({'success': False, 'message': 'Invalid email address format.'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'An account with this email already exists.'}), 400

    user = User(
        name=name,
        email=email,
        phone=phone,
        role=role
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    if role == 'farmer':
        farm_name = data.get('farm_name', '').strip() or f"{name}'s Farm"
        location = data.get('farm_location', '').strip() or data.get('location', '').strip()
        farm_size = data.get('farm_size', '').strip()
        primary_crops = data.get('primary_crops', '').strip()

        if not location:
            db.session.rollback()
            return jsonify({'success': False, 'message': 'Farm location is required for farmer registration.'}), 400

        profile = FarmerProfile(
            user_id=user.id,
            farm_name=farm_name,
            location=location,
            farm_size=farm_size,
            primary_crops=primary_crops
        )
        db.session.add(profile)

    elif role == 'buyer':
        business_name = data.get('business_name', '').strip() or f"{name} Enterprise"
        buyer_type = data.get('buyer_type', '').strip() or 'Restaurant'
        location = data.get('business_location', '').strip() or data.get('location', '').strip()

        if not location:
            db.session.rollback()
            return jsonify({'success': False, 'message': 'Business location is required for buyer registration.'}), 400

        profile = BuyerProfile(
            user_id=user.id,
            business_name=business_name,
            buyer_type=buyer_type,
            location=location
        )
        db.session.add(profile)

    db.session.commit()

    token = generate_token(user)
    return jsonify({
        'success': True,
        'message': 'Registration successful.',
        'data': {
            'user': user.to_dict(),
            'token': token
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'Please provide both email and password.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Your account has been deactivated. Please contact support.'}), 403

    token = generate_token(user)
    return jsonify({
        'success': True,
        'message': 'Login successful.',
        'data': {
            'user': user.to_dict(),
            'token': token
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    unread_notifications = len([n for n in current_user.notifications if not n.is_read])
    user_data = current_user.to_dict()
    user_data['unread_notifications_count'] = unread_notifications
    return jsonify({
        'success': True,
        'data': user_data
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({
        'success': True,
        'message': 'Logged out successfully.'
    }), 200
