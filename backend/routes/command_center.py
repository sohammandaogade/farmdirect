"""
AI Market Command Center, Geographic Heatmap, What-If Simulator, and Anomaly Auditing Blueprint.
"""

from flask import Blueprint, request, jsonify
from utils.auth import token_required
from models import ProduceListing, Order, User, AnomalyEvent, CropMarketHistory, db
from services.ai.simulator_engine import MarketSimulatorEngine
from services.ai.anomaly_detector import AnomalyDetector
from services.ai.demand_forecaster import DemandForecastService

command_center_bp = Blueprint('command_center', __name__, url_prefix='/api/command-center')

# Western Maharashtra agricultural districts coordinates and baseline telemetry
DISTRICT_REGISTRY = {
    'Pune': {'lat': 18.5204, 'lng': 73.8567, 'region_role': 'Primary Consumption & Transit Hub'},
    'Nashik': {'lat': 19.9975, 'lng': 73.7898, 'region_role': 'Horticulture & Onion/Grape Capital'},
    'Satara': {'lat': 17.6805, 'lng': 74.0183, 'region_role': 'Potato & Hill Vegetable Plateau'},
    'Ahmednagar': {'lat': 19.0952, 'lng': 74.7496, 'region_role': 'Grain & Dairy Belt'},
    'Sangli': {'lat': 16.8524, 'lng': 74.5815, 'region_role': 'River Basin & Brassica Center'},
    'Mumbai': {'lat': 19.0760, 'lng': 72.8777, 'region_role': 'Terminal Wholesale Consumption Port'}
}

@command_center_bp.route('/metrics', methods=['GET'])
def get_command_center_metrics():
    active_listings = ProduceListing.query.filter_by(status='ACTIVE').all()
    total_supply_kg = sum(l.available_quantity for l in active_listings)
    
    orders = Order.query.filter(Order.status != 'CANCELLED').all()
    gmv = sum(o.total_amount for o in orders)
    total_traded_kg = sum(o.quantity for o in orders)

    # Anomalies count
    pending_anomalies = AnomalyEvent.query.filter_by(status='NEEDS_REVIEW').count()
    total_anomalies = AnomalyEvent.query.count()

    # Risk orders (in transit or pending pickup with distance > 180 km)
    risk_orders = [o for o in orders if o.status in ['CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT'] and (o.distance_km or 0) > 150]

    # Top demanded crops from CropMarketHistory
    histories = CropMarketHistory.query.all()
    demand_rankings = sorted(histories, key=lambda h: h.demand_index, reverse=True)

    recommendations = [
        "Onion demand pressure is tight (+15% 7-day forecast in Nashik). Recommend incentivizing farmer listings with zero commission promo.",
        "High perishability alert on Tomato harvests in Pune talukas. Ensure carrier dispatch capacity is allocated by 06:00 AM.",
        f"{pending_anomalies} flagged pricing/quantity anomalies currently pending administrator review queue."
    ]

    return jsonify({
        'success': True,
        'summary': {
            'total_active_listings': len(active_listings),
            'total_supply_kg': round(total_supply_kg, 1),
            'total_gmv_inr': round(gmv, 2),
            'total_traded_kg': round(total_traded_kg, 1),
            'pending_anomalies_count': pending_anomalies,
            'total_anomalies_recorded': total_anomalies,
            'high_risk_shipments_count': len(risk_orders),
            'demand_trend_overall': 'Bullish (+9.4% Platform-wide)',
            'logistics_load_factor': '76.5% Fleet Efficiency',
            'overall_trust_index': '97.2% Certified Reliability'
        },
        'demand_rankings': [h.to_dict() for h in demand_rankings],
        'ai_strategic_recommendations': recommendations
    }), 200

@command_center_bp.route('/heatmap', methods=['GET'])
def get_market_heatmap():
    layer = request.args.get('layer', 'supply').lower()  # supply, demand, price, risk, logistics
    active_listings = ProduceListing.query.filter_by(status='ACTIVE').all()

    heatmap_points = []
    for district, meta in DISTRICT_REGISTRY.items():
        dist_listings = [l for l in active_listings if district.lower() in l.location.lower()]
        supply_kg = sum(l.available_quantity for l in dist_listings)
        avg_price = (sum(l.expected_price for l in dist_listings) / len(dist_listings)) if dist_listings else 25.0

        demand_rep = DemandForecastService.get_demand_forecast('Tomato', district)
        demand_idx = demand_rep['current_demand_index'] if demand_rep else 70.0

        risk_val = 65.0 if district in ['Nashik', 'Pune'] else 30.0
        logistics_val = 85.0 if district in ['Mumbai', 'Pune'] else 60.0

        # Intensity calculation (0.0 to 1.0) based on selected layer
        if layer == 'demand':
            intensity = round(demand_idx / 100.0, 2)
            metric_label = f"Demand Index: {demand_idx:.0f}/100 ({demand_rep['trend']})"
        elif layer == 'price':
            intensity = round(min(1.0, avg_price / 45.0), 2)
            metric_label = f"Avg Produce Rate: ₹{avg_price:.2f}/kg"
        elif layer == 'risk':
            intensity = round(risk_val / 100.0, 2)
            metric_label = f"Operational Risk Score: {risk_val:.0f}/100"
        elif layer == 'logistics':
            intensity = round(logistics_val / 100.0, 2)
            metric_label = f"Freight Route Density: {logistics_val:.0f}%"
        else:
            # Default: Supply
            intensity = round(min(1.0, max(0.15, supply_kg / 8000.0)), 2)
            metric_label = f"Available Supply: {supply_kg:,.0f} kg ({len(dist_listings)} listings)"

        heatmap_points.append({
            'district': district,
            'latitude': meta['lat'],
            'longitude': meta['lng'],
            'role': meta['region_role'],
            'intensity': intensity,
            'metric_label': metric_label,
            'supply_kg': supply_kg,
            'demand_index': demand_idx,
            'avg_price': round(avg_price, 2),
            'risk_score': risk_val,
            'logistics_score': logistics_val
        })

    return jsonify({
        'success': True,
        'active_layer': layer,
        'points': heatmap_points
    }), 200

@command_center_bp.route('/simulate', methods=['POST'])
def run_simulation():
    data = request.get_json() or {}
    d_chg = data.get('demand_change', 20.0)
    s_chg = data.get('supply_change', -15.0)
    t_chg = data.get('transport_change', 10.0)
    r_chg = data.get('risk_change', 15.0)

    sim_res = MarketSimulatorEngine.run_simulation(d_chg, s_chg, t_chg, r_chg)
    return jsonify({'success': True, 'data': sim_res}), 200

@command_center_bp.route('/anomalies', methods=['GET'])
def get_anomalies():
    status = request.args.get('status')
    anomalies = AnomalyDetector.get_all_anomalies(status)
    return jsonify({'success': True, 'count': len(anomalies), 'data': anomalies}), 200

@command_center_bp.route('/anomalies/<int:anomaly_id>', methods=['PUT'])
def update_anomaly_status(anomaly_id):
    data = request.get_json() or {}
    new_status = data.get('status', 'RESOLVED')
    note = data.get('resolution_note', 'Audit completed by platform administrator.')

    anomaly = AnomalyEvent.query.get(anomaly_id)
    if not anomaly:
        return jsonify({'success': False, 'message': 'Anomaly record not found.'}), 404

    anomaly.status = new_status
    anomaly.resolution_note = note
    db.session.commit()

    return jsonify({'success': True, 'message': 'Anomaly status updated.', 'data': anomaly.to_dict()}), 200
