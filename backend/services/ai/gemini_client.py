"""
Central Gemini Client for FarmDirect AI Services.
Provides resilient, cached, structured interaction with Google Gemini models
via lightweight HTTP REST calls without requiring heavy third-party SDKs.
"""

import os
import json
import base64
import time
import hashlib
import logging
from datetime import datetime, timedelta

logger = logging.getLogger('farmdirect.ai.gemini')

class GeminiClient:
    _instance = None
    _cache = {}  # In-memory query cache: {hash: (response_data, expire_timestamp)}
    CACHE_TTL_SECONDS = 300  # 5 minutes cache for deterministic queries

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiClient, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        self.model = os.environ.get('GEMINI_MODEL', 'gemini-flash-latest')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.timeout = 15  # 15s request timeout
        if self.api_key:
            logger.info(f"GeminiClient initialized with model: {self.model} (API Key configured)")
        else:
            logger.info("GeminiClient initialized in FALLBACK mode (GEMINI_API_KEY not set)")

    @property
    def current_api_key(self):
        return os.environ.get('GEMINI_API_KEY') or self.api_key

    def is_available(self):
        """Returns True if the API key is configured."""
        key = self.current_api_key
        return bool(key and len(key.strip()) > 10)

    _active_model = None

    def get_active_model(self):
        """Returns the working model identifier, dynamically discovering supported models from Gemini API."""
        if self._active_model:
            return self._active_model

        env_model = os.environ.get('GEMINI_MODEL')
        if env_model:
            self._active_model = env_model
            return self._active_model

        if not self.is_available():
            return self.model

        try:
            import requests
            list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.current_api_key}"
            resp = requests.get(list_url, timeout=5)
            if resp.status_code == 200:
                models_data = resp.json().get('models', [])
                supported = [
                    m['name'].replace('models/', '') for m in models_data 
                    if 'generateContent' in m.get('supportedGenerationMethods', [])
                ]
                for candidate in ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-pro-latest', 'gemini-2.5-flash-lite']:
                    if candidate in supported:
                        self._active_model = candidate
                        self.model = candidate
                        return candidate
                if supported:
                    self._active_model = supported[0]
                    self.model = supported[0]
                    return supported[0]
        except Exception as e:
            logger.warning(f"Could not query ListModels: {e}")

        self._active_model = self.model
        return self._active_model

    def _get_cache_key(self, prompt, system_instruction, schema_str=""):
        raw = f"{prompt}|{system_instruction}|{schema_str}"
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()

    def _check_cache(self, cache_key):
        if cache_key in self._cache:
            data, expire_at = self._cache[cache_key]
            if time.time() < expire_at:
                logger.debug("Gemini cache hit for prompt.")
                return data
            else:
                del self._cache[cache_key]
        return None

    def _set_cache(self, cache_key, data):
        # Keep cache bounded to 200 items
        if len(self._cache) > 200:
            oldest_key = min(self._cache, key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]
        self._cache[cache_key] = (data, time.time() + self.CACHE_TTL_SECONDS)

    def generate_text(self, prompt, system_instruction=None, temperature=0.3):
        """
        Generates freeform or structured text response from Gemini.
        Returns {'success': True, 'content': text} or {'success': False, 'error': msg, 'fallback': True}
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'GEMINI_API_KEY is not configured on this server.',
                'fallback': True
            }

        cache_key = self._get_cache_key(prompt, system_instruction or "")
        cached = self._check_cache(cache_key)
        if cached:
            return {'success': True, 'content': cached, 'cached': True}

        try:
            import requests

            active_model = self.get_active_model()
            url = f"{self.base_url}/{active_model}:generateContent?key={self.current_api_key}"
            headers = {'Content-Type': 'application/json'}

            payload = {
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": 2048
                }
            }

            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            start_t = time.time()
            resp = requests.post(url, headers=headers, json=payload, timeout=self.timeout)
            elapsed = time.time() - start_t

            if resp.status_code == 200:
                data = resp.json()
                try:
                    candidates = data.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        parts = candidates[0]['content'].get('parts', [])
                        text_result = parts[0].get('text', '') if parts else ''
                        self._set_cache(cache_key, text_result)
                        logger.info(f"Gemini text generation succeeded in {elapsed:.2f}s")
                        return {'success': True, 'content': text_result, 'latency_s': elapsed}
                except (KeyError, IndexError) as parse_err:
                    logger.warning(f"Error parsing Gemini response payload: {parse_err}")
                return {'success': False, 'error': 'Unexpected response structure from model', 'fallback': True}
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")
                return {
                    'success': False,
                    'status_code': resp.status_code,
                    'error': f"Model returned HTTP {resp.status_code}",
                    'fallback': True
                }

        except Exception as e:
            logger.warning(f"Gemini request failed: {e}")
            return {'success': False, 'error': str(e), 'fallback': True}

    def generate_structured(self, prompt, schema, system_instruction=None, temperature=0.1):
        """
        Generates strict, schema-validated JSON from Gemini using responseMimeType="application/json".
        Returns {'success': True, 'data': parsed_json} or {'success': False, 'error': msg, 'fallback': True}
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'GEMINI_API_KEY is not configured on this server.',
                'fallback': True
            }

        schema_str = json.dumps(schema, sort_keys=True)
        cache_key = self._get_cache_key(prompt, system_instruction or "", schema_str)
        cached = self._check_cache(cache_key)
        if cached:
            return {'success': True, 'data': cached, 'cached': True}

        try:
            import requests

            active_model = self.get_active_model()
            url = f"{self.base_url}/{active_model}:generateContent?key={self.current_api_key}"
            headers = {'Content-Type': 'application/json'}

            # Append explicit schema reminder to system instruction
            enforced_system = (system_instruction or "") + (
                f"\n\nYou MUST respond with a single valid JSON object strictly matching this schema:\n"
                f"{schema_str}\nDo not enclose in markdown blocks. Output raw JSON only."
            )

            payload = {
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ],
                "systemInstruction": {
                    "parts": [{"text": enforced_system}]
                },
                "generationConfig": {
                    "temperature": temperature,
                    "responseMimeType": "application/json",
                    "maxOutputTokens": 2048
                }
            }

            start_t = time.time()
            resp = requests.post(url, headers=headers, json=payload, timeout=self.timeout)
            elapsed = time.time() - start_t

            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get('candidates', [])
                if candidates and 'content' in candidates[0]:
                    parts = candidates[0]['content'].get('parts', [])
                    raw_text = parts[0].get('text', '').strip() if parts else ''
                    
                    # Clean potential markdown fences if present
                    if raw_text.startswith("```json"):
                        raw_text = raw_text[7:]
                    elif raw_text.startswith("```"):
                        raw_text = raw_text[3:]
                    if raw_text.endswith("```"):
                        raw_text = raw_text[:-3]
                    raw_text = raw_text.strip()

                    try:
                        parsed_json = json.loads(raw_text)
                        self._set_cache(cache_key, parsed_json)
                        logger.info(f"Gemini structured JSON succeeded in {elapsed:.2f}s")
                        return {'success': True, 'data': parsed_json, 'latency_s': elapsed}
                    except json.JSONDecodeError as json_err:
                        logger.warning(f"Gemini returned invalid JSON: {json_err} - raw: {raw_text[:200]}")
                        return {'success': False, 'error': 'Invalid JSON returned by model', 'fallback': True}

            logger.warning(f"Gemini structured call HTTP {resp.status_code}: {resp.text[:200]}")
            return {'success': False, 'error': f"Model returned HTTP {resp.status_code}", 'fallback': True}

        except Exception as e:
            logger.warning(f"Gemini structured request error: {e}")
            return {'success': False, 'error': str(e), 'fallback': True}

    def analyze_image(self, image_bytes, mime_type, prompt, schema=None, system_instruction=None):
        """
        Multimodal visual analysis of a produce image using Gemini Vision.
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'GEMINI_API_KEY is not configured on this server.',
                'fallback': True
            }

        try:
            import requests

            active_model = self.get_active_model()
            url = f"{self.base_url}/{active_model}:generateContent?key={self.current_api_key}"
            headers = {'Content-Type': 'application/json'}

            b64_image = base64.b64encode(image_bytes).decode('utf-8')

            parts = [
                {"text": prompt},
                {
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": b64_image
                    }
                }
            ]

            payload = {
                "contents": [{"parts": parts}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2048
                }
            }

            if schema:
                payload["generationConfig"]["responseMimeType"] = "application/json"
                schema_str = json.dumps(schema)
                enforced_sys = (system_instruction or "") + (
                    f"\n\nYou MUST return strictly valid JSON conforming to this schema:\n{schema_str}"
                )
                payload["systemInstruction"] = {"parts": [{"text": enforced_sys}]}
            elif system_instruction:
                payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

            start_t = time.time()
            resp = requests.post(url, headers=headers, json=payload, timeout=self.timeout + 5)
            elapsed = time.time() - start_t

            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get('candidates', [])
                if candidates and 'content' in candidates[0]:
                    parts = candidates[0]['content'].get('parts', [])
                    raw_text = parts[0].get('text', '').strip() if parts else ''
                    
                    if schema:
                        if raw_text.startswith("```json"):
                            raw_text = raw_text[7:]
                        elif raw_text.startswith("```"):
                            raw_text = raw_text[3:]
                        if raw_text.endswith("```"):
                            raw_text = raw_text[:-3]
                        raw_text = raw_text.strip()
                        parsed = json.loads(raw_text)
                        logger.info(f"Gemini multimodal vision succeeded in {elapsed:.2f}s")
                        return {'success': True, 'data': parsed, 'latency_s': elapsed}
                    return {'success': True, 'content': raw_text, 'latency_s': elapsed}

            logger.warning(f"Gemini multimodal call failed HTTP {resp.status_code}: {resp.text[:200]}")
            return {'success': False, 'error': f"Model returned HTTP {resp.status_code}", 'fallback': True}

        except Exception as e:
            logger.warning(f"Gemini multimodal analysis error: {e}")
            return {'success': False, 'error': str(e), 'fallback': True}

    def test_connection(self):
        """Tests whether GEMINI_API_KEY is configured and can reach the Gemini API."""
        if not self.is_available():
            return {
                'configured': False,
                'status': 'KEY_NOT_FOUND',
                'message': 'GEMINI_API_KEY environment variable is not detected in the running process.'
            }
        try:
            import requests
            # 1. Fetch available models for this API key
            list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.current_api_key}"
            list_resp = requests.get(list_url, timeout=10)
            available_models = []
            if list_resp.status_code == 200:
                models_data = list_resp.json().get('models', [])
                available_models = [
                    m['name'].replace('models/', '') for m in models_data 
                    if 'generateContent' in m.get('supportedGenerationMethods', [])
                ]
            
            # 2. Test generation through candidates until verified
            preferred_order = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-pro-latest', 'gemini-2.5-flash-lite']
            candidates_to_try = [m for m in preferred_order if m in available_models]
            if not candidates_to_try:
                candidates_to_try = available_models or ['gemini-flash-latest']

            working_model = None
            last_resp = None
            for candidate in candidates_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={self.current_api_key}"
                payload = {
                    "contents": [{"parts": [{"text": "Hello, respond with OK"}]}],
                    "generationConfig": {"maxOutputTokens": 10}
                }
                resp = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
                last_resp = resp
                if resp.status_code == 200:
                    working_model = candidate
                    self._active_model = candidate
                    self.model = candidate
                    break

            if working_model:
                return {
                    'configured': True,
                    'status': 'CONNECTED',
                    'active_model': working_model,
                    'available_models': available_models[:10],
                    'message': f'Gemini API is connected and responding successfully using {working_model}.'
                }
            else:
                status_str = f'HTTP_{last_resp.status_code}' if last_resp else 'HTTP_ERR'
                msg = f'Gemini API returned {status_str}: {last_resp.text[:200]}' if last_resp else 'No model response'
                return {
                    'configured': True,
                    'status': status_str,
                    'available_models': available_models[:10],
                    'message': msg
                }
        except Exception as e:
            return {
                'configured': True,
                'status': 'CONNECTION_ERROR',
                'message': f'Failed to reach Gemini API: {str(e)}'
            }


# Global singleton instance
gemini_client = GeminiClient()
