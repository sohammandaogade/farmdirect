import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from database import db
from models import User

def generate_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(hours=current_app.config.get('JWT_EXPIRATION_HOURS', 48)),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'success': False, 'message': 'Authentication token missing.'}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({'success': False, 'message': 'Invalid or expired token.'}), 401

        current_user = db.session.get(User, payload['user_id'])
        if not current_user or not current_user.is_active:
            return jsonify({'success': False, 'message': 'User not found or account deactivated.'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({
                    'success': False,
                    'message': f'Unauthorized access. Role must be one of: {", ".join(roles)}'
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator
