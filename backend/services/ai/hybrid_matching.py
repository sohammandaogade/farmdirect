"""
Hybrid AI Matching Engine for FarmDirect.
Multi-stage orchestration combining deterministic weighted baselines with historical transactions,
trust reputation, price intelligence, logistics turnaround, perishability limits, and operational risk.
"""

from services.matching_engine import MatchingEngine
from services.price_engine import PriceEngine
from services.logistics import LogisticsService
from services.ai.trust_engine import TrustEngine
from services.ai.demand_forecaster import DemandForecastService
from services.ai.perishability_data import evaluate_transit_perishability
from services.ai.risk_engine import RiskEngine
from models import Order, ProduceListing

class HybridMatchingEngine:

    def __init__(self):
        self.baseline_engine = MatchingEngine()

    def evaluate_hybrid_match(self, listing, req, buyer_id=None):
        """
        Orchestrates Stages 1 through 9 to produce a Hybrid Match Score and explainable factor checklist.
        """
        # --- Stage 1 & 2: Hard constraints & Deterministic Explainable Weighted Baseline ---
        base_result = self.baseline_engine.score_listing(listing, req)
        if base_result['match_score'] == 0:
            return {
                'listing_id': listing.id,
                'listing': listing.to_dict(),
                'hybrid_score': 0.0,
                'tier': 'Incompatible',
                'factors': {
                    'baseline': 0, 'trust': 0, 'price': 0, 'logistics': 0,
                    'demand': 0, 'perishability': 0, 'risk': 0
                },
                'positive_factors': [],
                'negative_factors': ['Requested crop does not match produce listing.'],
                'recommendations': ['Search for an alternative crop or flexible requirements.']
            }

        base_score = base_result['match_score']
        farmer_id = listing.farmer_id
        crop = listing.crop
        listing_price = listing.expected_price
        farmer_loc = listing.location
        buyer_loc = req.get('location') or 'Pune'

        # --- Stage 3: Historical Transaction Intelligence ---
        history_bonus = 0.0
        if buyer_id:
            past_deals = Order.query.filter_by(farmer_id=farmer_id, buyer_id=buyer_id, status='DELIVERED').count()
            if past_deals >= 2:
                history_bonus = 4.0
            elif past_deals == 1:
                history_bonus = 2.0

        # --- Stage 4: Trust & Reliability Intelligence ---
        trust_data = TrustEngine.get_farmer_trust(farmer_id)
        trust_score = trust_data['trust_score']
        # Normalized trust factor (80-100 mapped to bonus/neutral/penalty)
        trust_factor = (trust_score - 80.0) * 0.15

        # --- Stage 5: Price Intelligence ---
        price_insight = PriceEngine.get_price_insight(crop, farmer_loc, listing_price)
        price_bonus = 0.0
        if price_insight and price_insight.get('has_reference'):
            tag = price_insight.get('tag')
            if tag == 'competitive':
                price_bonus = 4.0
            elif tag == 'fair':
                price_bonus = 2.0
            elif tag == 'premium':
                price_bonus = -3.0

        # --- Stage 6: Logistics & Transit Turnaround ---
        req_qty = float(req.get('quantity') or 1000.0)
        logistics_data = LogisticsService.estimate_logistics(farmer_loc, buyer_loc, req_qty)
        distance_km = logistics_data['distance_km']
        logistics_score = max(20.0, 100.0 - (distance_km * 0.35))

        # --- Stage 7: Demand Pressure Impact ---
        demand_data = DemandForecastService.get_demand_forecast(crop, buyer_loc)
        demand_index = demand_data.get('current_demand_index', 75.0)

        # --- Stage 8: Perishability & Shelf Life Transit Limit ---
        perish_eval = evaluate_transit_perishability(crop, distance_km)
        perish_penalty = 0.0
        if perish_eval['perishability_level'] == 'HIGH' and distance_km > 200:
            perish_penalty = -6.0
        elif perish_eval['perishability_level'] == 'HIGH' and distance_km <= 50:
            perish_penalty = 3.0

        # --- Stage 9: Operational Risk ---
        risk_data = RiskEngine.assess_crop_risk(crop, None, farmer_loc, distance_km, listing.available_quantity)
        risk_score = risk_data['overall_risk_score']
        risk_penalty = - (risk_score - 20.0) * 0.08 if risk_score > 20 else 2.0

        # --- Composite Hybrid Calculation ---
        # Baseline forms 60% core, remaining 40% from trust, logistics, price, perishability, risk
        composite = (
            (base_score * 0.60) +
            (trust_score * 0.15) +
            (logistics_score * 0.15) +
            (history_bonus) +
            (price_bonus) +
            (trust_factor) +
            (perish_penalty) +
            (risk_penalty)
        )
        final_score = round(max(10.0, min(100.0, composite)), 1)

        # Quality tiering
        if final_score >= 88.0:
            tier = 'Strong Match (Excellent Fit)'
        elif final_score >= 74.0:
            tier = 'Good Match (Recommended)'
        elif final_score >= 55.0:
            tier = 'Moderate Fit (Acceptable)'
        else:
            tier = 'Low Match (Review Alternatives)'

        # Build Explainable Factor Checklist
        positive_factors = []
        negative_factors = []

        # Crop & Quantity
        if listing.available_quantity >= req_qty:
            positive_factors.append(f"Required volume available ({listing.available_quantity:,.0f} kg available vs {req_qty:,.0f} kg needed)")
        else:
            negative_factors.append(f"Partial fulfillment only ({listing.available_quantity:,.0f} kg of {req_qty:,.0f} kg requested)")

        # Price
        max_p = float(req.get('max_price') or 0.0)
        if max_p > 0 and listing_price <= max_p:
            savings = max_p - listing_price
            positive_factors.append(f"Competitive price: ₹{listing_price:.2f}/kg is ₹{savings:.2f} within your ₹{max_p:.2f} cap")
        elif max_p > 0 and listing_price > max_p:
            negative_factors.append(f"Price ₹{listing_price:.2f}/kg exceeds your budget ceiling by ₹{listing_price - max_p:.2f}")

        # Location & Logistics
        if distance_km <= 50:
            positive_factors.append(f"Same agricultural district ({farmer_loc} to {buyer_loc}, ~{distance_km:.0f} km, fast delivery)")
        elif distance_km > 180:
            negative_factors.append(f"Longer transit distance (~{distance_km:.0f} km), estimated freight ₹{logistics_data['estimated_transport_cost']:,.0f}")
        else:
            positive_factors.append(f"Moderate regional transit (~{distance_km:.0f} km away)")

        # Trust & Quality
        if trust_score >= 95.0:
            positive_factors.append(f"High supplier trust: {trust_data['reliability_tier']} ({trust_score:.0f}% completion score)")
        elif trust_score < 90.0:
            negative_factors.append(f"Supplier reliability score is moderate ({trust_score:.0f}%)")

        if history_bonus > 0:
            positive_factors.append("Strong historical transaction track record with this specific buyer")

        # Perishability & Risk
        if perish_eval['perishability_level'] == 'HIGH':
            if distance_km <= 100:
                positive_factors.append(f"High perishability handled safely: short delivery window ({perish_eval['shelf_life_days']} days shelf life)")
            else:
                negative_factors.append(f"High perishability crop with {distance_km:.0f} km transit requires expedited dispatch")

        # Recommendations
        recommendations = []
        if listing.available_quantity < req_qty:
            shortfall = req_qty - listing.available_quantity
            recommendations.append(f"Use Procurement Optimizer to split the {shortfall:,.0f} kg shortfall with a secondary supplier.")
        if listing_price <= (max_p * 0.95) if max_p > 0 else False:
            recommendations.append("Attractive pricing: Lock in volume with immediate purchase request.")
        else:
            recommendations.append("Use AI Negotiation Copilot to submit a balanced counter-offer.")

        return {
            'listing_id': listing.id,
            'listing': listing.to_dict(),
            'hybrid_score': final_score,
            'tier': tier,
            'factors': {
                'baseline_score': round(base_score, 1),
                'trust_score': round(trust_score, 1),
                'logistics_score': round(logistics_score, 1),
                'risk_score': round(risk_score, 1),
                'demand_index': round(demand_index, 1)
            },
            'positive_factors': positive_factors,
            'negative_factors': negative_factors,
            'recommendations': recommendations,
            'logistics_estimate': logistics_data,
            'trust_profile': trust_data,
            'price_insight': price_insight,
            'perishability': perish_eval
        }

    def rank_hybrid(self, listings, req, buyer_id=None):
        results = []
        for listing in listings:
            res = self.evaluate_hybrid_match(listing, req, buyer_id)
            if res['hybrid_score'] > 0:
                results.append(res)
        results.sort(key=lambda x: x['hybrid_score'], reverse=True)
        return results
