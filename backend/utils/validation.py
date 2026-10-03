import re
from datetime import datetime

EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'

def validate_email(email):
    if not email or not re.match(EMAIL_REGEX, email.strip()):
        return False
    return True

def validate_positive_number(val, allow_zero=False):
    try:
        num = float(val)
        return num >= 0 if allow_zero else num > 0
    except (ValueError, TypeError):
        return False

def validate_date(date_str):
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None

INDIAN_PHONE_REGEX = r'^(?:\+91[\-\s]?)?[6-9]\d{9}$'

def validate_indian_phone(phone):
    """
    Validates Indian 10-digit mobile numbers starting with 6, 7, 8, or 9.
    Supports optional +91 or 91 country code and optional whitespace/hyphens.
    """
    if not phone or not isinstance(phone, str):
        return False
    cleaned = re.sub(r'[\s\-]', '', phone.strip())
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = cleaned[1:]
    return bool(re.match(r'^[6-9]\d{9}$', cleaned))

