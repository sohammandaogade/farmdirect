"""
What-If Market Simulator Engine for FarmDirect Admin Command Center.
Simulates macroeconomic policy, climate, and fuel shocks on agricultural commodity pricing and supply buffers.
"""

from models import ProduceListing, Order

class MarketSimulatorEngine:

    @staticmethod
    def run_simulation(demand_change_pct=0.0, supply_change_pct=0.0, transport_cost_change_pct=0.0, risk_shock_pct=0.0):
        d_chg = float(demand_change_pct)
        s_chg = float(supply_change_pct)
        t_chg = float(transport_cost_change_pct)
        r_chg = float(risk_shock_pct)

        # Baseline platform aggregated numbers
        active_listings = ProduceListing.query.filter_by(status='ACTIVE').all()
        baseline_supply_kg = sum(l.available_quantity for l in active_listings) or 15000.0
        baseline_avg_price = (sum(l.expected_price for l in active_listings) / len(active_listings)) if active_listings else 24.50

        # Economic Price Elasticity: Price changes inversely with supply and directly with demand
        # Agricultural demand elasticity ~ -0.4 to -0.6
        elasticity_factor = 0.55
        net_pressure = d_chg - s_chg  # e.g., +20% demand and -15% supply = +35% net pressure

        projected_price_change_pct = (net_pressure * elasticity_factor) + (t_chg * 0.12)
        projected_avg_price = baseline_avg_price * (1.0 + (projected_price_change_pct / 100.0))

        # Supply volume projection
        projected_supply_kg = baseline_supply_kg * (1.0 + (s_chg / 100.0))
        projected_demand_kg = (baseline_supply_kg * 0.95) * (1.0 + (d_chg / 100.0))
        supply_demand_gap_kg = projected_demand_kg - projected_supply_kg

        # Freight and logistics pressure
        freight_pressure_index = max(10.0, min(100.0, 50.0 + (t_chg * 0.8) + (abs(supply_demand_gap_kg) / baseline_supply_kg * 15.0)))

        # Composite market risk score under simulation
        simulated_risk_score = max(5.0, min(95.0, 35.0 + (r_chg * 0.7) + (max(0, supply_demand_gap_kg) / baseline_supply_kg * 25.0)))

        # Crop-specific impacts
        crop_projections = [
            {
                'crop': 'Tomato',
                'baseline_price': 28.0,
                'projected_price': round(28.0 * (1.0 + (projected_price_change_pct * 1.15) / 100.0), 2),
                'perishability': 'High',
                'vulnerability': 'High — Perishable harvest highly sensitive to transport disruptions.'
            },
            {
                'crop': 'Onion',
                'baseline_price': 22.0,
                'projected_price': round(22.0 * (1.0 + (projected_price_change_pct * 0.90) / 100.0), 2),
                'perishability': 'Low',
                'vulnerability': 'Moderate — Storage buffer dampens immediate price spikes.'
            },
            {
                'crop': 'Potato',
                'baseline_price': 20.0,
                'projected_price': round(20.0 * (1.0 + (projected_price_change_pct * 0.85) / 100.0), 2),
                'perishability': 'Low',
                'vulnerability': 'Low — Cold chain reserves maintain floor equilibrium.'
            },
            {
                'crop': 'Wheat',
                'baseline_price': 30.0,
                'projected_price': round(30.0 * (1.0 + (projected_price_change_pct * 0.70) / 100.0), 2),
                'perishability': 'Low',
                'vulnerability': 'Low — Long-term staple with minimal transit degradation.'
            }
        ]

        if supply_demand_gap_kg > 0:
            market_state = f"Deficit Shortage (+{supply_demand_gap_kg:,.0f} kg unmet demand)"
            recommendation = "Recommend activating inter-district procurement pooling and expanding farmer onboarding in Satara/Sangli."
        elif supply_demand_gap_kg < -1000:
            market_state = f"Supply Glut Surplus ({abs(supply_demand_gap_kg):,.0f} kg excess)"
            recommendation = "Recommend facilitating food processor off-take and cold storage holding incentives."
        else:
            market_state = "Balanced Equilibrium"
            recommendation = "Market maintains stable clearance without intervention."

        return {
            'inputs': {
                'demand_change_pct': d_chg,
                'supply_change_pct': s_chg,
                'transport_cost_change_pct': t_chg,
                'risk_shock_pct': r_chg
            },
            'baseline': {
                'supply_volume_kg': round(baseline_supply_kg, 1),
                'average_price_per_kg': round(baseline_avg_price, 2)
            },
            'projections': {
                'projected_price_change_pct': round(projected_price_change_pct, 1),
                'projected_avg_price_per_kg': round(projected_avg_price, 2),
                'projected_supply_kg': round(projected_supply_kg, 1),
                'projected_demand_kg': round(projected_demand_kg, 1),
                'supply_demand_gap_kg': round(supply_demand_gap_kg, 1),
                'freight_pressure_index': round(freight_pressure_index, 1),
                'simulated_risk_score': round(simulated_risk_score, 1),
                'market_state': market_state,
                'strategic_recommendation': recommendation
            },
            'crop_breakdown': crop_projections,
            'disclaimer': 'SIMULATION MODEL: Results represent algorithmic elasticity projections based on micro-economic agricultural models. Not guaranteed future market outcomes.'
        }
