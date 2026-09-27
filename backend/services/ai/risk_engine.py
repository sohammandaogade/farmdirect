"""
Harvest & Supply Risk Intelligence Service for FarmDirect.
Calculates crop harvest windows, weather exposure, perishability risks, and actionable mitigations.
"""

from datetime import date, timedelta
from services.ai.perishability_data import get_crop_perishability, evaluate_transit_perishability

CROP_GROWTH_CYCLES = {
    'tomato': {'cycle_days': 80, 'harvest_span_days': 15, 'temp_sensitivity': 'Moderate'},
    'onion': {'cycle_days': 120, 'harvest_span_days': 20, 'temp_sensitivity': 'Low'},
    'potato': {'cycle_days': 90, 'harvest_span_days': 15, 'temp_sensitivity': 'Low'},
    'grapes': {'cycle_days': 140, 'harvest_span_days': 12, 'temp_sensitivity': 'High'},
    'carrot': {'cycle_days': 75, 'harvest_span_days': 14, 'temp_sensitivity': 'Moderate'},
    'cabbage': {'cycle_days': 70, 'harvest_span_days': 12, 'temp_sensitivity': 'Low'},
    'cauliflower': {'cycle_days': 65, 'harvest_span_days': 10, 'temp_sensitivity': 'High'},
    'wheat': {'cycle_days': 115, 'harvest_span_days': 18, 'temp_sensitivity': 'Low'}
}

class RiskEngine:

    @staticmethod
    def assess_crop_risk(crop, sowing_date_str=None, location='Pune', distance_km=100.0, available_qty=1000.0):
        clean_crop = crop.strip().lower() if crop else 'tomato'
        growth = CROP_GROWTH_CYCLES.get(clean_crop, {'cycle_days': 80, 'harvest_span_days': 14, 'temp_sensitivity': 'Moderate'})
        perish = get_crop_perishability(clean_crop)

        # Parse or default sowing date
        if sowing_date_str:
            try:
                sowing = date.fromisoformat(sowing_date_str)
            except Exception:
                sowing = date.today() - timedelta(days=65)
        else:
            sowing = date.today() - timedelta(days=65)

        cycle = growth['cycle_days']
        harvest_start = sowing + timedelta(days=cycle)
        harvest_end = harvest_start + timedelta(days=growth['harvest_span_days'])
        days_to_harvest = (harvest_start - date.today()).days

        # Weather snapshot heuristic for Western India belt
        loc_clean = location.strip().lower() if location else 'pune'
        if 'nashik' in loc_clean:
            weather_risk_score = 25.0
            weather_status = 'Clear Autumn Skies / Minimal Rain Hazard'
        elif 'satara' in loc_clean:
            weather_risk_score = 30.0
            weather_status = 'Moderate Morning Fog / Stable Field Conditions'
        elif 'sangli' in loc_clean:
            weather_risk_score = 20.0
            weather_status = 'Favorable River Basin Conditions'
        else:
            weather_risk_score = 22.0
            weather_status = 'Stable Regional Micro-climate (28°C - 32°C)'

        # Perishability evaluation
        transit_eval = evaluate_transit_perishability(clean_crop, distance_km)
        perishability_risk = transit_eval['risk_score']

        # Supply pressure: if large quantity and high perishability
        supply_pressure_score = 65.0 if (available_qty >= 3000.0 and perish['perishability_level'] == 'HIGH') else 30.0

        # Composite Operational Risk Score (0 - 100)
        overall_risk = (
            (weather_risk_score * 0.25) +
            (perishability_risk * 0.40) +
            (supply_pressure_score * 0.35)
        )
        overall_risk = round(max(5.0, min(95.0, overall_risk)), 1)

        if overall_risk >= 65:
            risk_tier = 'High Operational Risk'
        elif overall_risk >= 40:
            risk_tier = 'Moderate Operational Risk'
        else:
            risk_tier = 'Low Operational Risk'

        mitigations = []
        if perish['perishability_level'] == 'HIGH':
            mitigations.append("Prioritize nearby commercial buyers within 150 km to preserve harvest brix and firmness.")
            mitigations.append("Coordinate early morning crate pickup to prevent ambient heat degradation during loading.")
        if supply_pressure_score >= 60:
            mitigations.append(f"High available volume ({available_qty:,.0f} kg): consider splitting into dual fulfillment batches.")
        if days_to_harvest <= 5:
            mitigations.append("Crop is entering immediate harvest window. Lock advance buyer contracts to guarantee off-take.")
        else:
            mitigations.append(f"Estimated {days_to_harvest} days remaining until peak maturity.")

        return {
            'crop': crop.strip().title() if crop else 'Tomato',
            'location': location,
            'harvest_window': {
                'start_date': harvest_start.isoformat(),
                'end_date': harvest_end.isoformat(),
                'days_remaining': max(0, days_to_harvest),
                'status': 'Imminent Harvest' if days_to_harvest <= 5 else 'Maturing On-Field'
            },
            'weather_risk': {
                'score': weather_risk_score,
                'status': weather_status,
                'temperature_sensitivity': growth['temp_sensitivity']
            },
            'perishability_risk': {
                'level': perish['perishability_level'],
                'shelf_life_days': perish['shelf_life_days'],
                'score': perishability_risk,
                'transit_notes': transit_eval['notes']
            },
            'overall_risk_score': overall_risk,
            'risk_tier': risk_tier,
            'mitigation_recommendations': mitigations,
            'disclaimer': 'Risk intelligence synthesizes agricultural crop cycles, regional transit distance, and platform supply velocity.'
        }
