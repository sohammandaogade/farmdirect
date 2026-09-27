"""
Farm Digital Twin and Inventory Intelligence API Routes.
Provides full telemetry on soil health, historical yield curves, expenses, and inventory intelligence.
"""

from flask import Blueprint, request, jsonify
from utils.auth import token_required
from models import SoilProfile, CropHistory, FarmExpense, User, ProduceListing, db
from services.ai.demand_forecaster import DemandForecastService
from services.ai.smart_selling import SmartSellingService
from datetime import date

digital_twin_bp = Blueprint('digital_twin', __name__, url_prefix='/api/digital-twin')

@digital_twin_bp.route('/farmer/<int:farmer_id>', methods=['GET'])
def get_farmer_digital_twin(farmer_id):
    farmer = User.query.get(farmer_id)
    if not farmer:
        return jsonify({'success': False, 'message': 'Farmer not found.'}), 404

    soil = SoilProfile.query.filter_by(farmer_id=farmer_id).first()
    histories = CropHistory.query.filter_by(farmer_id=farmer_id).order_by(CropHistory.year.desc()).all()
    expenses = FarmExpense.query.filter_by(farmer_id=farmer_id).order_by(FarmExpense.expense_date.desc()).all()
    active_listings = ProduceListing.query.filter_by(farmer_id=farmer_id, status='ACTIVE').all()

    # Aggregate financial summary across historical seasons
    total_hist_revenue = sum(h.gross_revenue for h in histories)
    total_hist_cost = sum(h.cultivation_cost for h in histories)
    total_hist_margin = total_hist_revenue - total_hist_cost

    # Current seasonal projections
    current_projections = []
    for l in active_listings:
        intel = SmartSellingService.evaluate_selling_time(l.crop, l.expected_price, l.available_quantity, l.location)
        current_projections.append({
            'listing_id': l.id,
            'crop': l.crop,
            'current_quantity_kg': l.available_quantity,
            'expected_price': l.expected_price,
            'projected_revenue': round(l.available_quantity * l.expected_price, 2),
            'smart_selling_decision': intel['decision'],
            'demand_trend': intel['demand_summary']['trend']
        })

    return jsonify({
        'success': True,
        'farmer_id': farmer_id,
        'farmer_name': farmer.name,
        'farm_name': farmer.farmer_profile.farm_name if farmer.farmer_profile else farmer.name,
        'location': farmer.farmer_profile.location if farmer.farmer_profile else 'Pune',
        'farm_size': farmer.farmer_profile.farm_size if farmer.farmer_profile else '25 acres',
        'soil_profile': soil.to_dict() if soil else None,
        'crop_histories': [h.to_dict() for h in histories],
        'expenses': [e.to_dict() for e in expenses],
        'financial_summary': {
            'total_historical_revenue': total_hist_revenue,
            'total_historical_cost': total_hist_cost,
            'net_historical_profit': total_hist_margin,
            'overall_margin_pct': round((total_hist_margin / total_hist_revenue * 100), 1) if total_hist_revenue > 0 else 0
        },
        'current_projections': current_projections
    }), 200

@digital_twin_bp.route('/inventory-intelligence', methods=['GET'])
@token_required
def get_inventory_intelligence(current_user):
    farmer_id = current_user.id
    listings = ProduceListing.query.filter_by(farmer_id=farmer_id, status='ACTIVE').all()

    inventory_items = []
    total_stock_kg = 0.0
    total_projected_surplus_kg = 0.0

    for l in listings:
        demand = DemandForecastService.get_demand_forecast(l.crop, l.location)
        selling = SmartSellingService.evaluate_selling_time(l.crop, l.expected_price, l.available_quantity, l.location)

        # Expected demand volume absorption heuristic based on demand index
        absorption_pct = demand['current_demand_index'] / 100.0
        predicted_demand_kg = round(l.available_quantity * absorption_pct, 1)
        projected_surplus_kg = max(0.0, round(l.available_quantity - predicted_demand_kg, 1))

        total_stock_kg += l.available_quantity
        total_projected_surplus_kg += projected_surplus_kg

        inventory_items.append({
            'listing_id': l.id,
            'crop': l.crop,
            'quality_grade': l.quality_grade,
            'current_stock_kg': l.available_quantity,
            'unit_price': l.expected_price,
            'predicted_demand_kg': predicted_demand_kg,
            'projected_surplus_kg': projected_surplus_kg,
            'selling_window': 'Optimal Next 48h' if selling['perishability']['level'] == 'HIGH' else 'Flexible 14–21 Days',
            'price_trend': demand['trend'],
            'demand_index': demand['current_demand_index'],
            'smart_selling_action': selling['decision'],
            'action_recommendation': selling['headline']
        })

    return jsonify({
        'success': True,
        'total_stock_kg': total_stock_kg,
        'total_projected_surplus_kg': total_projected_surplus_kg,
        'active_listings_count': len(listings),
        'items': inventory_items
    }), 200

@digital_twin_bp.route('/soil', methods=['POST'])
@token_required
def update_soil(current_user):
    data = request.get_json() or {}
    soil = SoilProfile.query.filter_by(farmer_id=current_user.id).first()
    if not soil:
        soil = SoilProfile(farmer_id=current_user.id)
        db.session.add(soil)

    soil.soil_type = data.get('soil_type', soil.soil_type)
    soil.ph_level = float(data.get('ph_level', soil.ph_level))
    soil.organic_carbon_pct = float(data.get('organic_carbon_pct', soil.organic_carbon_pct))
    soil.nitrogen_kg_ha = float(data.get('nitrogen_kg_ha', soil.nitrogen_kg_ha))
    soil.phosphorus_kg_ha = float(data.get('phosphorus_kg_ha', soil.phosphorus_kg_ha))
    soil.potassium_kg_ha = float(data.get('potassium_kg_ha', soil.potassium_kg_ha))
    soil.moisture_pct = float(data.get('moisture_pct', soil.moisture_pct))
    soil.last_tested_date = date.today()

    db.session.commit()
    return jsonify({'success': True, 'data': soil.to_dict()}), 200
