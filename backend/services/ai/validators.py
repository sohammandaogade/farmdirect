"""
Backend Output Validator for Gemini Multimodal Produce Vision.
Enforces strict schema validation, type integrity, uncertainty checks,
and crop-mismatch detection to ensure AI output is never trusted blindly.
"""

import re
import logging

logger = logging.getLogger('farmdirect.ai.validators')

# Common agricultural produce synonym mappings
SYNONYM_MAP = {
    'capsicum': ['capsicum', 'bell pepper', 'shimla mirch', 'sweet pepper', 'pepper'],
    'bell pepper': ['capsicum', 'bell pepper', 'shimla mirch', 'sweet pepper', 'pepper'],
    'chili': ['chili', 'chilli', 'chilli pepper', 'green chili', 'red chili', 'mirchi'],
    'corn': ['corn', 'maize', 'sweet corn', 'makka', 'butta'],
    'maize': ['corn', 'maize', 'sweet corn', 'makka', 'butta'],
    'brinjal': ['brinjal', 'eggplant', 'aubergine', 'baingan', 'vangi'],
    'eggplant': ['brinjal', 'eggplant', 'aubergine', 'baingan', 'vangi'],
    'okra': ['okra', 'ladyfinger', 'ladies finger', 'bhindi'],
    'ladyfinger': ['okra', 'ladyfinger', 'ladies finger', 'bhindi'],
    'coriander': ['coriander', 'cilantro', 'dhania', 'kothimbir'],
    'cilantro': ['coriander', 'cilantro', 'dhania', 'kothimbir'],
    'scallion': ['scallion', 'spring onion', 'green onion'],
    'spring onion': ['scallion', 'spring onion', 'green onion'],
    'sweet potato': ['sweet potato', 'shakarkand', 'ratale'],
    'bottle gourd': ['bottle gourd', 'calabash', 'lauki', 'dudhi'],
    'bitter gourd': ['bitter gourd', 'karela'],
    'fenugreek': ['fenugreek', 'methi'],
    'spinach': ['spinach', 'palak'],
    'pigeon pea': ['pigeon pea', 'toor', 'tur', 'arhar', 'toor dal'],
    'chickpea': ['chickpea', 'gram', 'chana', 'channa', 'garbanzo'],
    'groundnut': ['groundnut', 'peanut', 'mungfali', 'shengdana'],
    'peanut': ['groundnut', 'peanut', 'mungfali', 'shengdana']
}


def normalize_crop_name(name):
    """Normalizes crop text for fuzzy linguistic comparison."""
    if not name or not isinstance(name, str):
        return ''
    s = name.strip().lower()
    # Remove non-alphanumeric except space
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    
    # Singularize common English plurals
    words = s.split()
    singular_words = []
    for w in words:
        if w.endswith('ies') and len(w) > 4:
            singular_words.append(w[:-3] + 'y')
        elif w.endswith('es') and len(w) > 3 and not w.endswith('ses'):
            singular_words.append(w[:-2])
        elif w.endswith('s') and len(w) > 2 and not w.endswith('ss'):
            singular_words.append(w[:-1])
        else:
            singular_words.append(w)
    return ' '.join(singular_words)


def are_crops_compatible(user_crop, ai_crop):
    """
    Compares user-selected crop label with AI visual identification.
    Returns (is_compatible: bool, reason: str).
    """
    if not user_crop or not ai_crop:
        return True, "No user crop specified for comparison."

    u_norm = normalize_crop_name(user_crop)
    a_norm = normalize_crop_name(ai_crop)

    if not u_norm or not a_norm:
        return True, "Crop strings normalization resulted in empty tokens."

    # Direct match or substring
    if u_norm == a_norm or u_norm in a_norm or a_norm in u_norm:
        return True, "Exact or substring match."

    # Token overlap check (e.g. 'red onion' vs 'onion')
    u_tokens = set(u_norm.split())
    a_tokens = set(a_norm.split())
    if u_tokens.intersection(a_tokens):
        return True, "Token overlap match."

    # Synonym dictionary check
    for canonical, syns in SYNONYM_MAP.items():
        if (any(s in u_norm for s in syns)) and (any(s in a_norm for s in syns)):
            return True, f"Synonym match under {canonical}."

    return False, f"User-selected crop '{user_crop}' conflicts with AI visual identification '{ai_crop}'."


class ProduceVisionValidator:
    """
    Validates Gemini Vision model output to enforce safety, structured types,
    and anti-hallucination guardrails before any listing is considered.
    """

    @staticmethod
    def validate_raw_vision_response(data):
        """
        Validates the raw dictionary returned by Gemini against required fields,
        numerical boundaries, enum values, and internal logical consistency.
        Returns (is_valid: bool, validated_data: dict, validation_error: str).
        """
        if not isinstance(data, dict):
            return False, ProduceVisionValidator._build_safe_review_payload(
                "Invalid response payload structure (not a JSON object)."
            ), "Response is not a dictionary"

        # Check required top-level keys
        required_keys = [
            'is_agricultural_produce',
            'image_suitability',
            'multiple_crops_detected',
            'crop_identification',
            'quality_assessment',
            'listing_decision'
        ]
        for rk in required_keys:
            if rk not in data:
                logger.warning(f"Gemini vision response missing required key: {rk}")
                return False, ProduceVisionValidator._build_safe_review_payload(
                    f"Response missing required field '{rk}'."
                ), f"Missing key: {rk}"

        # 1. Validate is_agricultural_produce
        is_agri = bool(data.get('is_agricultural_produce'))

        # 2. Validate image_suitability
        suitability = data.get('image_suitability')
        if not isinstance(suitability, dict):
            return False, ProduceVisionValidator._build_safe_review_payload(
                "Malformed image_suitability structure."
            ), "Malformed image_suitability"
        is_usable = bool(suitability.get('is_usable', True))
        suit_issue = str(suitability.get('issue_detected', 'NONE')).upper()
        if suit_issue not in ["NONE", "BLURRY", "POOR_LIGHTING", "OBSCURED", "NON_AGRICULTURAL", "CORRUPTED"]:
            suit_issue = "NONE"

        # 3. Validate multiple_crops_detected
        mult_crops = bool(data.get('multiple_crops_detected'))

        # 4. Validate crop_identification
        crop_id = data.get('crop_identification')
        if not isinstance(crop_id, dict):
            return False, ProduceVisionValidator._build_safe_review_payload(
                "Malformed crop_identification structure."
            ), "Malformed crop_identification"

        crop_name = str(crop_id.get('name', '')).strip().lower()
        if not crop_name:
            crop_name = 'unknown'

        try:
            crop_conf = float(crop_id.get('confidence', 0.5))
            # Clamp to [0.0, 1.0]
            crop_conf = max(0.0, min(1.0, crop_conf))
        except (ValueError, TypeError):
            crop_conf = 0.5

        # 5. Validate quality_assessment
        qa = data.get('quality_assessment')
        if not isinstance(qa, dict):
            return False, ProduceVisionValidator._build_safe_review_payload(
                "Malformed quality_assessment structure."
            ), "Malformed quality_assessment"

        qa_status = str(qa.get('status', '')).upper()
        if qa_status not in ['ACCEPTABLE', 'ROTTEN', 'UNCERTAIN']:
            logger.warning(f"Unexpected quality_assessment.status: {qa_status}, defaulting to UNCERTAIN")
            qa_status = 'UNCERTAIN'

        try:
            qa_conf = float(qa.get('confidence', 0.5))
            qa_conf = max(0.0, min(1.0, qa_conf))
        except (ValueError, TypeError):
            qa_conf = 0.5

        raw_issues = qa.get('issues', [])
        issues = [str(i) for i in raw_issues] if isinstance(raw_issues, list) else []

        # 6. Validate listing_decision
        ld = data.get('listing_decision')
        if not isinstance(ld, dict):
            return False, ProduceVisionValidator._build_safe_review_payload(
                "Malformed listing_decision structure."
            ), "Malformed listing_decision"

        ld_status = str(ld.get('status', '')).upper()
        if ld_status not in ['APPROVE', 'REJECT', 'REVIEW']:
            ld_status = 'REVIEW'

        ld_reason = str(ld.get('reason', '')).strip()
        if not ld_reason:
            ld_reason = f"Produce condition assessed as {qa_status}."

        # ---------------------------------------------------------------------
        # LOGICAL CONSISTENCY & SAFETY ENFORCEMENT
        # ---------------------------------------------------------------------
        # A. If not agricultural produce: MUST REJECT / REVIEW, NEVER APPROVE
        if not is_agri:
            ld_status = 'REJECT'
            qa_status = 'ROTTEN' if 'spoiled' in ld_reason.lower() else 'UNCERTAIN'
            ld_reason = f"Image does not contain agricultural produce (identified as {crop_name}). Non-agricultural images cannot be listed."

        # B. If image is unusable (e.g. extremely blurry or dark): MUST REVIEW
        elif not is_usable or suit_issue in ['BLURRY', 'POOR_LIGHTING', 'OBSCURED', 'CORRUPTED']:
            ld_status = 'REVIEW'
            qa_status = 'UNCERTAIN'
            ld_reason = f"Image quality check flagged: {suit_issue}. Produce condition cannot be verified."

        # C. If multiple crops detected: MUST REVIEW
        elif mult_crops:
            ld_status = 'REVIEW'
            ld_reason = "Multiple produce types detected in the image. Individual crop listings must show a single commodity."

        # D. If produce is ROTTEN: MUST REJECT! Under NO circumstances can it be APPROVE
        elif qa_status == 'ROTTEN':
            ld_status = 'REJECT'
            if not issues:
                issues = ['Visible rot or severe decay']

        # E. If quality is UNCERTAIN: MUST REVIEW, NEVER APPROVE
        elif qa_status == 'UNCERTAIN' and ld_status == 'APPROVE':
            ld_status = 'REVIEW'
            ld_reason = "Produce quality cannot be verified with sufficient certainty. Manual inspection required."

        validated = {
            "is_agricultural_produce": is_agri,
            "image_suitability": {
                "is_usable": is_usable,
                "issue_detected": suit_issue
            },
            "multiple_crops_detected": mult_crops,
            "crop_identification": {
                "name": crop_name,
                "confidence": round(crop_conf, 2)
            },
            "quality_assessment": {
                "status": qa_status,
                "confidence": round(qa_conf, 2),
                "issues": issues
            },
            "listing_decision": {
                "status": ld_status,
                "reason": ld_reason
            }
        }

        return True, validated, None

    @staticmethod
    def _build_safe_review_payload(reason):
        """Constructs a fail-safe REVIEW response when AI payload is unparseable."""
        return {
            "is_agricultural_produce": False,
            "image_suitability": {
                "is_usable": False,
                "issue_detected": "CORRUPTED"
            },
            "multiple_crops_detected": False,
            "crop_identification": {
                "name": "unknown",
                "confidence": 0.0
            },
            "quality_assessment": {
                "status": "UNCERTAIN",
                "confidence": 0.0,
                "issues": ["AI visual verification output was malformed or unparseable"]
            },
            "listing_decision": {
                "status": "REVIEW",
                "reason": f"Safety check triggered: {reason}. Listing flagged for manual review."
            }
        }
