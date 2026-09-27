"""
Smart Selling Time Intelligence for FarmDirect.
Helps farmers decide whether to SELL NOW, WAIT, or REVIEW based on perishability, price forecast, and demand velocity.
"""

from services.ai.perishability_data import get_crop_perishability
from services.ai.demand_forecaster import DemandForecastService
from services.ai.price_forecaster import PriceForecasterService

class SmartSellingService:

    @staticmethod
    def evaluate_selling_time(crop, current_price, quantity_kg=1000.0, region='Pune', harvest_date_str=None):
        clean_crop = crop.strip().title() if crop else 'Tomato'
        price_val = float(current_price) if current_price else 25.0
        qty = float(quantity_kg) if quantity_kg else 1000.0

        perish = get_crop_perishability(clean_crop)
        demand = DemandForecastService.get_demand_forecast(clean_crop, region)
        price_intel = PriceForecasterService.get_predictive_fair_price(clean_crop, region, 'Grade A', qty)

        forecast_price = price_intel['predicted_price']
        demand_trend = demand['trend']
        f7_pct = demand['forecast_7d_pct']
        perish_level = perish['perishability_level']
        shelf_life = perish['shelf_life_days']

        # Core Decision Logic with Transparent Trade-offs
        if perish_level == 'HIGH':
            if forecast_price > price_val and f7_pct > 10.0:
                # Potential price increase exists but holding HIGH perishability crop causes spoilage!
                decision = 'REVIEW SELLING NOW'
                headline = 'Price upside exists, but high perishability requires prompt execution.'
                reason = (
                    f"While predicted 7-day price suggests ₹{forecast_price:.2f}/kg (+{f7_pct}%), "
                    f"{clean_crop} is a HIGH perishability crop ({shelf_life} days shelf life). "
                    f"Holding inventory risks physical weight loss and grade degradation exceeding the projected price gain."
                )
                action_items = [
                    "List immediately on marketplace with a firm ceiling bid.",
                    "Engage buyers offering advance pickup within 48 hours.",
                    "Split volume if necessary to avoid post-harvest bottlenecks."
                ]
            else:
                decision = 'SELL NOW'
                headline = 'Optimal freshness window active — capture current buyer demand.'
                reason = (
                    f"{clean_crop} has high perishability ({shelf_life} days). Current price of ₹{price_val:.2f}/kg "
                    f"is aligned with market reference benchmarks. Immediate sale locks revenue with zero spoilage risk."
                )
                action_items = [
                    "Accept inbound procurement requests.",
                    "Schedule carrier dispatch to arrive on harvest morning."
                ]
        elif perish_level == 'LOW':
            # Durable crop (Onion, Potato, Wheat)
            if f7_pct >= 5.0 and forecast_price > price_val:
                decision = 'WAIT / HOLD'
                headline = f'Favorable price trajectory (+{f7_pct}%) — holding inventory is viable.'
                reason = (
                    f"{clean_crop} has extended shelf-life ({shelf_life} days). Forward market indicators project "
                    f"tightening supply with prices reaching ₹{forecast_price:.2f}/kg over 7–14 days. Safe to hold in dry storage."
                )
                action_items = [
                    "Ensure aerated dry storage conditions.",
                    "Monitor weekly mandi arrivals for target exit price."
                ]
            else:
                decision = 'SELL NOW'
                headline = 'Stable demand window — release scheduled inventory.'
                reason = f"Current price ₹{price_val:.2f}/kg is at target equilibrium with steady buyer procurement."
                action_items = ["Fulfill current buyer requirements."]
        else:
            # Medium perishability (Carrot, Cabbage, Capsicum)
            if f7_pct >= 8.0:
                decision = 'REVIEW SELLING NOW'
                headline = 'Moderate holding window available for pre-committed contracts.'
                reason = f"Prices projected to trend upward slightly, but transit and cold-chain availability should be confirmed first."
                action_items = ["Negotiate forward purchase agreements with buyers."]
            else:
                decision = 'SELL NOW'
                headline = 'Fulfill active demand to maintain continuous crop turnover.'
                reason = f"Market conditions are stable. Fulfilling orders now optimizes seasonal cash flow."
                action_items = ["Publish active listing for fast dispatch."]

        return {
            'crop': clean_crop,
            'region': region,
            'quantity_kg': qty,
            'current_price': price_val,
            'predicted_future_price': forecast_price,
            'price_change_projected_pct': round(((forecast_price - price_val) / price_val * 100), 1) if price_val > 0 else 0,
            'decision': decision,
            'headline': headline,
            'reasoning': reason,
            'perishability': {
                'level': perish_level,
                'shelf_life_days': shelf_life,
                'optimal_temp': perish['optimal_temp_celsius']
            },
            'demand_summary': {
                'index': demand['current_demand_index'],
                'trend': demand_trend,
                '7d_forecast': f"{demand['forecast_7d_pct']:+}%"
            },
            'action_items': action_items,
            'disclaimer': 'Smart Selling recommendations synthesize perishable shelf life, forward price projections, and platform demand. The final decision remains with the farmer.'
        }
