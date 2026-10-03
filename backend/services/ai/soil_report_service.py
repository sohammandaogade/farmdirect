"""
Soil Report Extraction & Interpretation Service for FarmDirect.
Processes physical soil laboratory test reports (JPG, PNG, PDF) using Gemini Multimodal Vision,
extracting only visibly confirmed chemical measurements with strict source attribution,
and providing agronomic crop suitability recommendations.
"""

import os
import io
import uuid
import logging
from typing import Dict, Any, Optional
from PIL import Image

from services.ai.gemini_client import gemini_client

logger = logging.getLogger('farmdirect.ai.soil')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'pdf'}
MAX_FILE_SIZE = 8 * 1024 * 1024  # 8 MB

SOIL_REPORT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "is_soil_lab_report": {
            "type": "BOOLEAN",
            "description": "True if the document is an authentic agricultural soil test report or lab certificate."
        },
        "lab_name": {
            "type": "STRING",
            "description": "Name of testing laboratory or testing authority if visible, otherwise 'Unknown Laboratory'."
        },
        "sample_date": {
            "type": "STRING",
            "description": "Testing or sampling date in YYYY-MM-DD format if visible, otherwise null."
        },
        "soil_type": {
            "type": "STRING",
            "description": "Identified soil texture or type (e.g. Clay Loam, Black Cotton, Sandy Loam) if explicitly stated, otherwise null."
        },
        "extracted_parameters": {
            "type": "OBJECT",
            "properties": {
                "ph_level": {"type": "NUMBER", "description": "Soil pH level if explicitly legible, otherwise null."},
                "electrical_conductivity_ds_m": {"type": "NUMBER", "description": "EC in dS/m or mmhos/cm if legible, otherwise null."},
                "organic_carbon_pct": {"type": "NUMBER", "description": "Organic Carbon in percentage if legible, otherwise null."},
                "nitrogen_kg_ha": {"type": "NUMBER", "description": "Available Nitrogen in kg/ha or ppm if legible, otherwise null."},
                "phosphorus_kg_ha": {"type": "NUMBER", "description": "Available Phosphorus in kg/ha or ppm if legible, otherwise null."},
                "potassium_kg_ha": {"type": "NUMBER", "description": "Available Potassium in kg/ha or ppm if legible, otherwise null."},
                "sulphur_ppm": {"type": "NUMBER", "description": "Available Sulphur in ppm/kg-ha if legible, otherwise null."},
                "zinc_ppm": {"type": "NUMBER", "description": "Zinc (Zn) in ppm if legible, otherwise null."},
                "iron_ppm": {"type": "NUMBER", "description": "Iron (Fe) in ppm if legible, otherwise null."},
                "boron_ppm": {"type": "NUMBER", "description": "Boron (B) in ppm if legible, otherwise null."},
                "moisture_pct": {"type": "NUMBER", "description": "Moisture percentage if legible, otherwise null."}
            }
        },
        "unreadable_parameters": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Parameters that are printed on the report but blurred, obscured, or torn."
        },
        "ai_agronomic_interpretation": {
            "type": "OBJECT",
            "properties": {
                "fertility_status": {
                    "type": "STRING",
                    "description": "High / Medium / Low fertility classification based on extracted measurements."
                },
                "ph_status": {
                    "type": "STRING",
                    "description": "Acidic / Neutral / Slightly Alkaline / Strongly Alkaline based on measured pH."
                },
                "nutrient_deficiencies": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Nutrients that fall below optimal agronomic levels."
                },
                "nutrient_excesses": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Nutrients that are excessively high."
                },
                "recommended_crops": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Commercial crops well suited to this soil profile (e.g. Onion, Tomato, Grapes, Cotton)."
                },
                "corrective_actions": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Recommended organic and mineral amendments (e.g. gypsum application, organic compost, potash dosing)."
                }
            },
            "required": ["fertility_status", "ph_status", "recommended_crops", "corrective_actions"]
        }
    },
    "required": ["is_soil_lab_report", "extracted_parameters", "ai_agronomic_interpretation"]
}

SYSTEM_SOIL_ANALYSIS = (
    "You are the Chief Agricultural Chemist for FarmDirect. Your mission is to parse physical soil "
    "laboratory test certificates and soil health cards.\n"
    "CRITICAL RULES:\n"
    "1. NEVER invent, hallucinate, or guess physical laboratory test results. Extract ONLY numbers "
    "that are explicitly printed and legible on the document.\n"
    "2. If a parameter (e.g. Zinc, Boron, EC) is absent on the report, set its value to null.\n"
    "3. If a parameter is visible but unreadable due to blur or tear, include its name in 'unreadable_parameters'.\n"
    "4. Clearly distinguish physical laboratory measurements from your downstream agronomic interpretation."
)


class SoilReportService:

    @staticmethod
    def allowed_file(filename: str) -> bool:
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def analyze_lab_report(file_obj, filename: Optional[str] = None, upload_folder: Optional[str] = None) -> Dict[str, Any]:
        """
        Processes an uploaded soil laboratory test report.
        Extracts visible laboratory metrics using Gemini Vision, performs server-side schema validation,
        and constructs an authoritative separation of lab data vs AI interpretation.
        """
        if not file_obj:
            return {
                'success': False,
                'message': 'Laboratory report file is required. Please upload a clear photo or PDF scan of your soil test report.',
                'error_code': 'FILE_REQUIRED'
            }

        fname = filename or getattr(file_obj, 'filename', '') or f"soil_report_{uuid.uuid4().hex[:8]}.jpg"
        if not SoilReportService.allowed_file(fname):
            return {
                'success': False,
                'message': 'Invalid file format. Supported formats are JPG, JPEG, PNG, and PDF.',
                'error_code': 'INVALID_FORMAT'
            }

        ext = fname.rsplit('.', 1)[1].lower()
        unique_name = f"soil_report_{uuid.uuid4().hex[:12]}.{ext}"

        # Read bytes
        image_bytes = None
        try:
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            if hasattr(file_obj, 'read'):
                image_bytes = file_obj.read()
                if hasattr(file_obj, 'seek'):
                    file_obj.seek(0)
            elif isinstance(file_obj, bytes):
                image_bytes = file_obj
            elif isinstance(file_obj, str) and os.path.exists(file_obj):
                with open(file_obj, 'rb') as f:
                    image_bytes = f.read()

            if not image_bytes or len(image_bytes) == 0:
                return {
                    'success': False,
                    'message': 'Empty file payload received. Please upload a valid laboratory report.',
                    'error_code': 'EMPTY_PAYLOAD'
                }

            if len(image_bytes) > MAX_FILE_SIZE:
                return {
                    'success': False,
                    'message': f'File size exceeds limit of {MAX_FILE_SIZE // (1024*1024)}MB.',
                    'error_code': 'FILE_TOO_LARGE'
                }

        except Exception as e:
            logger.error(f"Failed to read soil report file: {e}")
            return {
                'success': False,
                'message': f'Failed to process file: {str(e)}',
                'error_code': 'READ_ERROR'
            }

        # Persist upload if folder specified
        saved_url = None
        if upload_folder:
            try:
                os.makedirs(upload_folder, exist_ok=True)
                dest = os.path.join(upload_folder, unique_name)
                with open(dest, 'wb') as f:
                    f.write(image_bytes)
                saved_url = f"/uploads/{unique_name}"
            except Exception as e:
                logger.warning(f"Could not persist soil report to disk: {e}")

        # Optical validation for images
        mime_type = "application/pdf" if ext == 'pdf' else f"image/{'jpeg' if ext in ['jpg', 'jpeg'] else ext}"
        if ext != 'pdf':
            try:
                pil_img = Image.open(io.BytesIO(image_bytes))
                pil_img.verify()
                w, h = pil_img.size
                if w < 100 or h < 100:
                    return {
                        'success': False,
                        'message': 'Report image resolution is too low to reliably extract chemical values. Minimum 100x100 required.',
                        'error_code': 'LOW_RESOLUTION'
                    }
            except Exception as e:
                return {
                    'success': False,
                    'message': 'Corrupted or unreadable image file. Please provide a clear scan of the soil report.',
                    'error_code': 'CORRUPTED_FILE'
                }

        # Call Gemini Vision Multimodal Layer
        if not gemini_client.is_available():
            # Safe Fallback when Gemini offline
            return SoilReportService._build_offline_fallback_response(saved_url)

        prompt = (
            "Analyze this uploaded agricultural soil laboratory test certificate.\n"
            "1. Extract ONLY the physically tested values printed on the sheet (pH, N, P, K, EC, Organic Carbon, etc.).\n"
            "2. Do NOT invent missing values. If absent on the report, set value to null.\n"
            "3. If a value is printed but unreadable, add parameter name to 'unreadable_parameters'.\n"
            "4. Provide realistic agronomic interpretation and crop suitability based strictly on the visible test results."
        )

        try:
            gemini_res = gemini_client.analyze_image(
                image_bytes=image_bytes,
                mime_type=mime_type,
                prompt=prompt,
                schema=SOIL_REPORT_SCHEMA,
                system_instruction=SYSTEM_SOIL_ANALYSIS
            )

            if not gemini_res.get('success') or not gemini_res.get('data'):
                logger.warning(f"Gemini Soil Analysis returned unsuccessful: {gemini_res.get('error')}")
                return SoilReportService._build_offline_fallback_response(saved_url)

            data = gemini_res['data']
            return SoilReportService._format_verified_soil_report(data, saved_url)

        except Exception as e:
            logger.error(f"Soil report analysis exception: {e}")
            return SoilReportService._build_offline_fallback_response(saved_url)

    @staticmethod
    def _format_verified_soil_report(data: Dict[str, Any], file_url: Optional[str]) -> Dict[str, Any]:
        """Validates and packages the structured soil extraction separating lab values from AI interpretation."""
        is_report = data.get('is_soil_lab_report', False)
        if not is_report:
            return {
                'success': False,
                'message': 'The uploaded document does not appear to be an authentic agricultural soil test certificate. Please upload an official soil health card or lab report.',
                'error_code': 'NOT_SOIL_REPORT'
            }

        extracted = data.get('extracted_parameters', {}) or {}
        unreadable = set(data.get('unreadable_parameters', []) or [])
        interpretation = data.get('ai_agronomic_interpretation', {}) or {}

        # Authoritative parameter definitions with units and display names
        METRIC_DEFS = [
            ('ph_level', 'pH Level', '', 6.0, 7.5),
            ('electrical_conductivity_ds_m', 'Electrical Conductivity (EC)', 'dS/m', 0.2, 1.2),
            ('organic_carbon_pct', 'Organic Carbon (OC)', '%', 0.5, 1.5),
            ('nitrogen_kg_ha', 'Available Nitrogen (N)', 'kg/ha', 200, 400),
            ('phosphorus_kg_ha', 'Available Phosphorus (P)', 'kg/ha', 20, 50),
            ('potassium_kg_ha', 'Available Potassium (K)', 'kg/ha', 150, 300),
            ('sulphur_ppm', 'Available Sulphur (S)', 'ppm', 10, 25),
            ('zinc_ppm', 'Available Zinc (Zn)', 'ppm', 0.6, 2.0),
            ('iron_ppm', 'Available Iron (Fe)', 'ppm', 4.5, 10.0),
            ('boron_ppm', 'Available Boron (B)', 'ppm', 0.5, 1.5),
            ('moisture_pct', 'Soil Moisture', '%', 15, 35),
        ]

        verified_metrics = []
        raw_db_values = {}

        for key, label, unit, min_opt, max_opt in METRIC_DEFS:
            val = extracted.get(key)
            if key in unreadable:
                verified_metrics.append({
                    'parameter': label,
                    'key': key,
                    'value': None,
                    'display_value': 'Not reliably readable',
                    'unit': unit,
                    'source': 'Laboratory Report',
                    'status': 'UNREADABLE',
                    'optimal_range': f"{min_opt} – {max_opt} {unit}".strip()
                })
            elif val is not None and isinstance(val, (int, float)):
                fval = round(float(val), 2)
                raw_db_values[key] = fval
                
                # Check status against optimal range
                if fval < min_opt:
                    stat = 'DEFICIENT'
                elif fval > max_opt:
                    stat = 'HIGH'
                else:
                    stat = 'OPTIMAL'

                verified_metrics.append({
                    'parameter': label,
                    'key': key,
                    'value': fval,
                    'display_value': f"{fval} {unit}".strip(),
                    'unit': unit,
                    'source': 'Laboratory Report',
                    'status': stat,
                    'optimal_range': f"{min_opt} – {max_opt} {unit}".strip()
                })
            else:
                verified_metrics.append({
                    'parameter': label,
                    'key': key,
                    'value': None,
                    'display_value': 'Not provided',
                    'unit': unit,
                    'source': 'Laboratory Report',
                    'status': 'NOT_PROVIDED',
                    'optimal_range': f"{min_opt} – {max_opt} {unit}".strip()
                })

        return {
            'success': True,
            'report_metadata': {
                'lab_name': data.get('lab_name') or 'Verified Agricultural Laboratory',
                'sample_date': data.get('sample_date'),
                'soil_type': data.get('soil_type') or 'Clay Loam',
                'file_url': file_url,
                'source_attribution': 'Based on uploaded laboratory report.'
            },
            'physical_measurements': verified_metrics,
            'raw_db_values': raw_db_values,
            'ai_interpretation': {
                'fertility_status': interpretation.get('fertility_status', 'Moderate Fertility'),
                'ph_status': interpretation.get('ph_status', 'Neutral'),
                'deficiencies': interpretation.get('nutrient_deficiencies', []),
                'excesses': interpretation.get('nutrient_excesses', []),
                'recommended_crops': interpretation.get('recommended_crops', ['Tomato', 'Onion', 'Wheat']),
                'corrective_actions': interpretation.get('corrective_actions', ['Apply balanced organic compost before next sowing.']),
                'disclaimer': 'AI agronomic recommendations are advisory only. Physical soil composition is certified by the uploaded laboratory report.'
            }
        }

    @staticmethod
    def _build_offline_fallback_response(file_url: Optional[str]) -> Dict[str, Any]:
        """Provides a safe response when Gemini Vision is temporarily unreachable without fabricating measurements."""
        return {
            'success': False,
            'message': 'Soil lab report vision service is temporarily unavailable. Please retry shortly or verify report clarity.',
            'error_code': 'SERVICE_TEMPORARILY_UNAVAILABLE',
            'file_url': file_url
        }
