"""
Structured Output Schemas for FarmDirect AI Services.
Enforces strict JSON schema validation across Gemini model responses.
"""

# 1. Natural Language Procurement Query Schema
PROCUREMENT_QUERY_SCHEMA = {
    "type": "object",
    "properties": {
        "crop": {
            "type": "string",
            "description": "Standardized crop name (e.g. Tomato, Onion, Potato, Wheat, Grapes)"
        },
        "quantity": {
            "type": "number",
            "description": "Normalized quantity in kilograms (kg)"
        },
        "unit": {
            "type": "string",
            "enum": ["kg", "quintal", "tonnes"],
            "description": "Original unit specified by buyer"
        },
        "quality": {
            "type": "string",
            "enum": ["Grade A", "Grade B", "Organic", "Processing Grade", "Any"],
            "description": "Desired produce quality standard"
        },
        "location": {
            "type": "string",
            "description": "Target delivery region or city (e.g. Pune, Nashik, Mumbai, Satara)"
        },
        "max_price": {
            "type": "number",
            "description": "Maximum ceiling price per kg in INR (null if not specified)"
        },
        "delivery_deadline": {
            "type": "string",
            "description": "Expected delivery window or deadline (e.g. 'Within 2 days', 'This Friday', 'Immediate')"
        },
        "extracted_preferences": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Specific buyer preferences like 'pre-cooled', 'crate-packed', 'high shelf-life'"
        }
    },
    "required": ["crop", "quantity", "unit", "quality", "location"]
}

# 2. Farmer Listing Copilot Schema
LISTING_ATTRIBUTES_SCHEMA = {
    "type": "object",
    "properties": {
        "crop": {
            "type": "string",
            "description": "Standardized crop name (e.g. Tomato, Onion, Potato)"
        },
        "quantity": {
            "type": "number",
            "description": "Available harvest quantity in kilograms"
        },
        "unit": {
            "type": "string",
            "enum": ["kg", "quintal", "tonnes"],
            "description": "Quantity unit"
        },
        "expected_price": {
            "type": "number",
            "description": "Suggested fair price in INR per kg"
        },
        "quality_grade": {
            "type": "string",
            "enum": ["Grade A", "Grade B", "Organic", "Processing Grade"],
            "description": "Estimated produce grade"
        },
        "location": {
            "type": "string",
            "description": "Farm harvest location"
        },
        "availability_date": {
            "type": "string",
            "description": "ISO date YYYY-MM-DD when produce will be ready for pickup/dispatch"
        },
        "title": {
            "type": "string",
            "description": "Attractive, concise marketplace title (e.g. 'Fresh Harvest Nashik Red Onions - Grade A')"
        },
        "description": {
            "type": "string",
            "description": "Factual descriptive overview for buyers highlighting harvest method, shelf life, and grade"
        },
        "suggested_tags": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Tags for search indexing (e.g. ['Direct-From-Farm', 'Naturally-Ripened', 'Grade-A'])"
        }
    },
    "required": ["crop", "quantity", "expected_price", "quality_grade", "title", "description"]
}

# 3. Listing Quality Assistant Schema
LISTING_QUALITY_AUDIT_SCHEMA = {
    "type": "object",
    "properties": {
        "completeness_score": {
            "type": "number",
            "description": "Score from 0 to 100 on listing detail completeness"
        },
        "missing_attributes": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of missing critical fields that buyers look for (e.g. 'Packaging type', 'Pickup window')"
        },
        "recommendations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Actionable, non-coercive tips to improve inquiry rates"
        },
        "quality_summary": {
            "type": "string",
            "description": "Brief objective assessment of the listing"
        }
    },
    "required": ["completeness_score", "missing_attributes", "recommendations", "quality_summary"]
}

# 4. AI Match Explanation Schema
MATCH_EXPLANATION_SCHEMA = {
    "type": "object",
    "properties": {
        "match_verdict": {
            "type": "string",
            "description": "Summary verdict (e.g. 'Excellent Match', 'Compatible Match', 'Partial Match')"
        },
        "verified_compatibility_points": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of factual match reasons based strictly on verified backend data"
        },
        "operational_trade_offs": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Potential considerations like transit distance or split order requirement"
        },
        "summary": {
            "type": "string",
            "description": "One-paragraph plain-language explanation of why this supplier was matched"
        }
    },
    "required": ["match_verdict", "verified_compatibility_points", "summary"]
}

# 5. Pricing Intelligence Insight Schema
PRICING_INSIGHT_SCHEMA = {
    "type": "object",
    "properties": {
        "fair_price_min": {
            "type": "number",
            "description": "Lower bound of recommended fair price range in INR/kg"
        },
        "fair_price_max": {
            "type": "number",
            "description": "Upper bound of recommended fair price range in INR/kg"
        },
        "pricing_verdict": {
            "type": "string",
            "enum": ["Competitive", "Fair Market Alignment", "Premium"],
            "description": "How the asked/quoted price compares to regional benchmarks"
        },
        "primary_factors": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Key factors influencing price like seasonal mandi arrivals, volume discounts, transport distance"
        },
        "advisory_note": {
            "type": "string",
            "description": "Factual non-binding pricing guidance for buyer/farmer"
        }
    },
    "required": ["fair_price_min", "fair_price_max", "pricing_verdict", "primary_factors", "advisory_note"]
}

# 6. Negotiation Suggestion Schema
NEGOTIATION_SUGGESTION_SCHEMA = {
    "type": "object",
    "properties": {
        "suggested_counter_price": {
            "type": "number",
            "description": "Suggested counter-offer price in INR/kg"
        },
        "rationale": {
            "type": "string",
            "description": "Clear business rationale based on volume, reference range, and seller/buyer margins"
        },
        "acceptance_probability": {
            "type": "string",
            "enum": ["High", "Moderate", "Challenging"],
            "description": "Estimated acceptance likelihood without guaranteeing transaction outcomes"
        },
        "strategic_points": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Key negotiation leverage points (e.g. payment speed, loading convenience, recurring commitment)"
        }
    },
    "required": ["suggested_counter_price", "rationale", "acceptance_probability", "strategic_points"]
}

# 7. Multimodal Produce Visual Analysis Schema
PRODUCE_VISION_SCHEMA = {
    "type": "object",
    "properties": {
        "identified_crop": {
            "type": "string",
            "description": "Crop identified from visual appearance"
        },
        "crop_confidence": {
            "type": "number",
            "description": "Confidence percentage in crop identification (0-100)"
        },
        "visual_ripeness_stage": {
            "type": "string",
            "description": "Visual ripeness observation (e.g. Mature Green, Breaker, Ripe, Over-ripe)"
        },
        "color_appearance": {
            "type": "string",
            "description": "Observations regarding color uniformity and surface luster"
        },
        "visible_defects_observed": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of visible superficial defects observed (e.g. minor skin blemishes, sunburn, scarring, bruising)"
        },
        "defect_severity": {
            "type": "string",
            "enum": ["None/Negligible", "Low", "Moderate", "High"],
            "description": "Estimated visual defect severity level"
        },
        "packaging_observation": {
            "type": "string",
            "description": "Observations on crates, sacks, or loose bulk presentation if visible in image"
        },
        "suggested_grade": {
            "type": "string",
            "enum": ["Grade A", "Grade B", "Grade C / Processing"],
            "description": "AI-assisted visual grade assessment"
        },
        "observations_summary": {
            "type": "string",
            "description": "Factual visual observation summary"
        },
        "disclaimer": {
            "type": "string",
            "description": "Standard disclaimer statement"
        }
    },
    "required": ["identified_crop", "visual_ripeness_stage", "defect_severity", "suggested_grade", "observations_summary"]
}

# 8. Marketplace Analytics Summary Schema
MARKETPLACE_ANALYTICS_SCHEMA = {
    "type": "object",
    "properties": {
        "executive_summary": {
            "type": "string",
            "description": "High-level plain English summary of marketplace activity and liquidity"
        },
        "key_demand_trends": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Bullet points highlighting rising/falling demand patterns grounded in actual orders"
        },
        "regional_observations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Regional concentration insights (e.g. Pune wholesale buyer activity vs Nashik supply)"
        },
        "actionable_recommendations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Strategic tips for platform administrators, farmers, or buyers based on data"
        }
    },
    "required": ["executive_summary", "key_demand_trends", "regional_observations", "actionable_recommendations"]
}

# 9. Primary Multimodal Produce Vision & Listing Suitability Schema
GEMINI_PRIMARY_VISION_SCHEMA = {
    "type": "object",
    "properties": {
        "is_agricultural_produce": {
            "type": "boolean",
            "description": "True if the image clearly shows raw or harvested agricultural produce (vegetable, fruit, grain, cereal, pulse, spice, root, tuber, etc.). False if it shows non-agricultural subjects (e.g. vehicle, person, laptop, building, animal, processed packaged food, random object)."
        },
        "image_suitability": {
            "type": "object",
            "properties": {
                "is_usable": {
                    "type": "boolean",
                    "description": "True if image optical quality is sufficient to evaluate crop and condition. False if extremely blurry, pitch black, severe glare, completely obscured, or unreadable."
                },
                "issue_detected": {
                    "type": "string",
                    "enum": ["NONE", "BLURRY", "POOR_LIGHTING", "OBSCURED", "NON_AGRICULTURAL", "CORRUPTED"],
                    "description": "Optical or semantic issue detected in the photo"
                }
            },
            "required": ["is_usable", "issue_detected"]
        },
        "multiple_crops_detected": {
            "type": "boolean",
            "description": "True if two or more distinctly different types of produce crops are visible mixed together in the image."
        },
        "crop_identification": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Specific agricultural commodity name in lowercase singular form (e.g. onion, tomato, potato, mango, wheat, rice, ginger, apple, carrot, cabbage, capsicum, chili, etc.) or 'non_produce' if not agricultural produce."
                },
                "confidence": {
                    "type": "number",
                    "description": "Confidence score between 0.00 and 1.00 indicating certainty of crop identification."
                }
            },
            "required": ["name", "confidence"]
        },
        "quality_assessment": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["ACCEPTABLE", "ROTTEN", "UNCERTAIN"],
                    "description": "ACCEPTABLE if fresh or only minor cosmetic marks. ROTTEN if visible mold, rot, extensive decay, leaking fluid, collapsed sunken necrotic tissue, severe decomposition, or unfit for sale. UNCERTAIN if quality cannot be reliably assessed."
                },
                "confidence": {
                    "type": "number",
                    "description": "Confidence score between 0.00 and 1.00 indicating certainty of quality assessment."
                },
                "issues": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of visible physical defects observed (e.g. 'visible mold', 'fungal growth', 'severe rot', 'collapsed tissue', 'deep decay', 'minor surface scar', 'none')."
                }
            },
            "required": ["status", "confidence", "issues"]
        },
        "listing_decision": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["APPROVE", "REJECT", "REVIEW"],
                    "description": "APPROVE if genuine agricultural produce in acceptable condition. REJECT if rotten/spoiled or non-agricultural. REVIEW if ambiguous, blurry, multiple crops, or uncertain quality."
                },
                "reason": {
                    "type": "string",
                    "description": "Clear explanation of the listing decision and condition observations."
                }
            },
            "required": ["status", "reason"]
        }
    },
    "required": [
        "is_agricultural_produce",
        "image_suitability",
        "multiple_crops_detected",
        "crop_identification",
        "quality_assessment",
        "listing_decision"
    ]
}

