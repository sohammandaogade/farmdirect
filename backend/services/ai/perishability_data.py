"""
Centralized crop perishability and post-harvest shelf-life metadata.
Provides transparent baseline data for agricultural storage and transit limits.
"""

CROP_PERISHABILITY_REGISTRY = {
    'tomato': {
        'crop': 'Tomato',
        'perishability_level': 'HIGH',
        'shelf_life_days': 7,
        'optimal_temp_celsius': '12°C - 15°C',
        'max_unrefrigerated_hours': 36,
        'max_recommended_transit_km': 250,
        'handling_notes': 'Pressure-sensitive skin. Stacking limit 4 crates high.'
    },
    'onion': {
        'crop': 'Onion',
        'perishability_level': 'LOW',
        'shelf_life_days': 60,
        'optimal_temp_celsius': '20°C - 25°C (Well-ventilated)',
        'max_unrefrigerated_hours': 720,
        'max_recommended_transit_km': 1500,
        'handling_notes': 'Moisture sensitive. Requires dry, aerated gunny bags.'
    },
    'potato': {
        'crop': 'Potato',
        'perishability_level': 'LOW',
        'shelf_life_days': 75,
        'optimal_temp_celsius': '10°C - 14°C',
        'max_unrefrigerated_hours': 960,
        'max_recommended_transit_km': 1800,
        'handling_notes': 'Avoid direct sunlight exposure to prevent solanine greening.'
    },
    'grapes': {
        'crop': 'Grapes',
        'perishability_level': 'HIGH',
        'shelf_life_days': 10,
        'optimal_temp_celsius': '0°C - 2°C (Pre-cooled)',
        'max_unrefrigerated_hours': 24,
        'max_recommended_transit_km': 350,
        'handling_notes': 'Requires sulfur dioxide pads and corrugated export cartons.'
    },
    'carrot': {
        'crop': 'Carrot',
        'perishability_level': 'MEDIUM',
        'shelf_life_days': 18,
        'optimal_temp_celsius': '4°C - 8°C',
        'max_unrefrigerated_hours': 72,
        'max_recommended_transit_km': 400,
        'handling_notes': 'Wash and top trimmed. Prone to moisture loss without liners.'
    },
    'cabbage': {
        'crop': 'Cabbage',
        'perishability_level': 'MEDIUM',
        'shelf_life_days': 21,
        'optimal_temp_celsius': '5°C - 10°C',
        'max_unrefrigerated_hours': 96,
        'max_recommended_transit_km': 450,
        'handling_notes': 'Retain 2-3 outer wrapper leaves to shield inner head.'
    },
    'cauliflower': {
        'crop': 'Cauliflower',
        'perishability_level': 'HIGH',
        'shelf_life_days': 7,
        'optimal_temp_celsius': '4°C - 7°C',
        'max_unrefrigerated_hours': 36,
        'max_recommended_transit_km': 200,
        'handling_notes': 'Curd browning occurs quickly if exposed to ambient heat.'
    },
    'capsicum': {
        'crop': 'Capsicum',
        'perishability_level': 'MEDIUM',
        'shelf_life_days': 12,
        'optimal_temp_celsius': '8°C - 10°C',
        'max_unrefrigerated_hours': 48,
        'max_recommended_transit_km': 300,
        'handling_notes': 'Susceptible to chilling injury below 7°C.'
    },
    'wheat': {
        'crop': 'Wheat',
        'perishability_level': 'LOW',
        'shelf_life_days': 365,
        'optimal_temp_celsius': 'Dry Ambient (<12% moisture)',
        'max_unrefrigerated_hours': 8760,
        'max_recommended_transit_km': 3000,
        'handling_notes': 'Airtight storage protected against weevil infestation.'
    },
    'rice': {
        'crop': 'Rice',
        'perishability_level': 'LOW',
        'shelf_life_days': 365,
        'optimal_temp_celsius': 'Dry Ambient',
        'max_unrefrigerated_hours': 8760,
        'max_recommended_transit_km': 3000,
        'handling_notes': 'Paddy requires clean dry storage pallets.'
    }
}

DEFAULT_METADATA = {
    'crop': 'Agricultural Produce',
    'perishability_level': 'MEDIUM',
    'shelf_life_days': 14,
    'optimal_temp_celsius': '15°C - 20°C',
    'max_unrefrigerated_hours': 48,
    'max_recommended_transit_km': 300,
    'handling_notes': 'Standard commercial farm produce handling guidelines apply.'
}

def get_crop_perishability(crop_name):
    if not crop_name:
        return DEFAULT_METADATA
    clean = crop_name.strip().lower()
    for key, data in CROP_PERISHABILITY_REGISTRY.items():
        if key in clean or clean in key:
            return data
    return DEFAULT_METADATA

def evaluate_transit_perishability(crop_name, distance_km):
    meta = get_crop_perishability(crop_name)
    max_km = meta['max_recommended_transit_km']
    level = meta['perishability_level']

    if distance_km <= (max_km * 0.4):
        risk_score = 10.0
        status = 'Optimal Proximity'
        notes = f'Short transit distance (~{distance_km:.0f} km) preserves optimal freshness for {meta["crop"]}.'
    elif distance_km <= max_km:
        risk_score = 35.0
        status = 'Manageable Transit'
        notes = f'Transit distance (~{distance_km:.0f} km) is within safe operational radius ({max_km} km).'
    elif distance_km <= (max_km * 1.5):
        risk_score = 70.0
        status = 'Elevated Spoilage Risk'
        notes = f'{distance_km:.0f} km exceeds standard {meta["crop"]} threshold ({max_km} km). Fast-dispatch LCV recommended.'
    else:
        risk_score = 90.0
        status = 'Severe Transit Risk'
        notes = f'{distance_km:.0f} km is highly unsuited for fresh unrefrigerated {meta["crop"]} delivery.'

    return {
        'perishability_level': level,
        'shelf_life_days': meta['shelf_life_days'],
        'risk_score': risk_score,
        'status': status,
        'notes': notes,
        'optimal_temp': meta['optimal_temp_celsius']
    }
