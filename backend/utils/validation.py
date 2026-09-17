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
