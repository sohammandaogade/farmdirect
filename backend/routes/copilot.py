"""
Copilot API Routes for Farmer & Buyer Assistants, Voice Parser, and Listing Generator.
"""

from flask import Blueprint, request, jsonify
from utils.auth import token_required
from services.ai.copilot_service import CopilotService

copilot_bp = Blueprint('copilot', __name__, url_prefix='/api/copilot')

@copilot_bp.route('/farmer', methods=['POST'])
@token_required
def farmer_copilot(current_user):
    data = request.get_json() or {}
    query = data.get('query', '')
    lang = data.get('language') or data.get('lang')
    res = CopilotService.get_farmer_copilot_response(current_user.id, query, explicit_lang=lang)
    return jsonify({'success': True, 'data': res}), 200

@copilot_bp.route('/buyer', methods=['POST'])
@token_required
def buyer_copilot(current_user):
    data = request.get_json() or {}
    query = data.get('query', '')
    lang = data.get('language') or data.get('lang')
    res = CopilotService.get_buyer_copilot_response(current_user.id, query, explicit_lang=lang)
    return jsonify({'success': True, 'data': res}), 200

@copilot_bp.route('/voice-command', methods=['POST'])
def voice_command():
    data = request.get_json() or {}
    transcript = data.get('transcript', '')
    lang = data.get('language') or data.get('lang')
    if not transcript:
        return jsonify({'success': False, 'message': 'Transcript text is required.'}), 400
    res = CopilotService.parse_multilingual_voice(transcript, detected_language=lang or 'en')
    return jsonify({'success': True, 'data': res}), 200

@copilot_bp.route('/generate-listing', methods=['POST'])
def generate_listing():
    data = request.get_json() or {}
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({'success': False, 'message': 'Prompt description is required.'}), 400
    attrs = CopilotService.generate_listing_attributes(prompt)
    return jsonify({'success': True, 'data': attrs}), 200
