"""
AI Copilot Service for Farmers and Buyers, with Multilingual Speech/Text Parser and Listing Generator.
Supports English, Hindi, and Marathi commands with human-in-the-loop confirmation.
"""

import re
from datetime import date, timedelta
from models import ProduceListing, Order, User, CropMarketHistory
from services.ai.demand_forecaster import DemandForecastService
from services.ai.price_forecaster import PriceForecasterService
from services.ai.smart_selling import SmartSellingService
from services.ai.risk_engine import RiskEngine
from services.ai.trust_engine import TrustEngine

class CopilotService:

    @staticmethod
    def get_farmer_copilot_response(farmer_id, query_text):
        q = query_text.strip().lower() if query_text else ''
        farmer = User.query.get(farmer_id)
        if not farmer:
            return {'reply': "Farmer account not found.", 'context': {}}

        listings = ProduceListing.query.filter_by(farmer_id=farmer_id, status='ACTIVE').all()
        orders = Order.query.filter_by(farmer_id=farmer_id).all()

        # 1. "What should I sell now?" / "When to sell?"
        if any(w in q for w in ['sell now', 'what to sell', 'when to sell', 'selling time', 'recommendation']):
            if not listings:
                return {
                    'reply': "You currently have no active produce listings. Start by adding your upcoming harvest so our AI can analyze market timing for you.",
                    'action_suggestion': '/farmer/listings/new'
                }
            top_listing = listings[0]
            intel = SmartSellingService.evaluate_selling_time(
                top_listing.crop,
                top_listing.expected_price,
                top_listing.available_quantity,
                top_listing.location
            )
            reply = (
                f"**Strategic Recommendation for {intel['crop']}: {intel['decision']}**\n\n"
                f"{intel['headline']}\n\n"
                f"• Current Price: ₹{intel['current_price']:.2f}/kg | Projected 7-day Price: ₹{intel['predicted_future_price']:.2f}/kg\n"
                f"• Demand Pressure: {intel['demand_summary']['index']}/100 ({intel['demand_summary']['trend']})\n"
                f"• Perishability: {intel['perishability']['level']} ({intel['perishability']['shelf_life_days']} days shelf life)\n\n"
                f"**Reasoning:** {intel['reasoning']}"
            )
            return {'reply': reply, 'data': intel}

        # 2. "Which of my crops have high demand?" / "Demand forecast"
        elif any(w in q for w in ['demand', 'market demand', 'highest demand', 'trending']):
            reports = []
            crops_seen = set()
            for l in listings:
                if l.crop not in crops_seen:
                    crops_seen.add(l.crop)
                    d = DemandForecastService.get_demand_forecast(l.crop, l.location)
                    reports.append(d)
            if not reports:
                reports = [DemandForecastService.get_demand_forecast('Tomato', 'Pune'), DemandForecastService.get_demand_forecast('Onion', 'Nashik')]

            text_lines = ["**Regional Demand Analysis for Your Produce Portfolio:**\n"]
            for r in reports:
                text_lines.append(
                    f"• **{r['crop']} ({r['region']})**: Demand Index **{r['current_demand_index']}/100** ({r['trend']}) "
                    f"| 7-Day Forecast: **{r['forecast_7d_pct']:+}%**\n  _{r['explanation']}_\n"
                )
            return {'reply': '\n'.join(text_lines), 'data': reports}

        # 3. "What price should I list at?" / "Price advice"
        elif any(w in q for w in ['price', 'rate', 'list at', 'fair price']):
            crop = listings[0].crop if listings else 'Tomato'
            p = PriceForecasterService.get_predictive_fair_price(crop, 'Pune', 'Grade A', 1000)
            reply = (
                f"**Predictive Pricing Benchmark for {crop} (Grade A):**\n\n"
                f"• Recommended Listing Price: **₹{p['predicted_price']:.2f}/kg**\n"
                f"• Fair Reference Range: **₹{p['lower_bound']:.2f} – ₹{p['upper_bound']:.2f}/kg**\n"
                f"• Expected Revenue for 1,000 kg: **₹{p['expected_revenue']:,.2f}**\n\n"
                f"_{p['factors'][0]} with {p['factors'][1]}._"
            )
            return {'reply': reply, 'data': p}

        # 4. "Do I have surplus stock?" / "Inventory"
        elif any(w in q for w in ['surplus', 'stock', 'inventory', 'quantity']):
            total_stock = sum(l.available_quantity for l in listings)
            reply = (
                f"**Inventory Snapshot:**\n\n"
                f"You have **{total_stock:,.0f} kg** across {len(listings)} active listing(s).\n"
            )
            for l in listings:
                reply += f"• {l.crop} ({l.quality_grade}): {l.available_quantity:,.0f} kg available in {l.location} @ ₹{l.expected_price}/kg\n"
            reply += "\n💡 _Tip: Check the Smart Selling page to evaluate optimal dispatch schedules._"
            return {'reply': reply, 'data': {'total_stock_kg': total_stock, 'active_listings': len(listings)}}

        # 5. Default General Agricultural Advisor Response
        else:
            trust_info = TrustEngine.get_farmer_trust(farmer_id)
            reply = (
                f"Hello {farmer.name}! I am your FarmDirect AI Copilot.\n\n"
                f"• Your Supplier Trust Score is **{trust_info['trust_score']}% ({trust_info['reliability_tier']})**\n"
                f"• Active Produce Volume: **{sum(l.available_quantity for l in listings):,.0f} kg**\n\n"
                f"You can ask me questions like:\n"
                f"• _'What should I sell now?'_\n"
                f"• _'Which of my crops have high demand?'_\n"
                f"• _'What price should I list my tomatoes at?'_\n"
                f"• _'Do I have surplus stock?'_"
            )
            return {'reply': reply, 'context': {'farmer_name': farmer.name}}

    @staticmethod
    def get_buyer_copilot_response(buyer_id, query_text):
        q = query_text.strip().lower() if query_text else ''
        buyer = User.query.get(buyer_id)

        if any(w in q for w in ['buy', 'need', 'procure', 'tonnes', 'kg', 'looking for']):
            from services.ai.procurement_optimizer import ProcurementOptimizer
            req = ProcurementOptimizer.parse_natural_language_query(query_text)
            plans_data = ProcurementOptimizer.generate_procurement_plans(req)
            plans = plans_data.get('plans', [])

            reply = (
                f"**Procurement Optimization Results for {req['quantity']:,.0f} kg {req['crop']} ({req['quality']}):**\n\n"
                f"I parsed your requirement for **{req['location']}** and structured 3 distinct sourcing plans:\n\n"
            )
            for p in plans:
                reply += (
                    f"• **{p['plan_name']}** ({p['tag']}):\n"
                    f"  Landed Cost: **₹{p['total_landed_cost']:,.2f}** (₹{p['effective_landed_rate_per_kg']:.2f}/kg) "
                    f"| Fulfillment: **{p['fulfillment_percentage']}%** | Suppliers: **{p['suppliers_count']}**\n"
                )
            reply += "\nClick over to the **AI Procurement** panel to review supplier allocations and send direct purchase requests!"
            return {'reply': reply, 'data': plans_data}
        else:
            return {
                'reply': (
                    f"Hello! I am your Commercial Procurement Copilot.\n\n"
                    f"Try entering natural language requirements like:\n"
                    f"• _'I need 5 tonnes of Grade A tomatoes near Pune below ₹30/kg by Friday'_\n"
                    f"• _'Find 3000 kg onions within 100 km of Nashik'_\n\n"
                    f"I will extract the requirements, split orders among certified suppliers, and calculate optimal multi-stop freight savings."
                )
            }

    @staticmethod
    def parse_multilingual_voice(transcript, detected_language='en'):
        """
        Parses text transcripts in English, Hindi, or Marathi into structured FarmDirect actions.
        """
        raw = transcript.strip()
        t = raw.lower()

        # Intent detection
        intent = 'SELL_PRODUCE'
        lang_name = 'English'

        # Marathi Intent keywords: माझ्याकडे (I have), विकायचे (to sell), भाव (price), टोमॅटो (tomato), कांदा (onion)
        if any(w in t for w in ['माझ्याकडे', 'विकायचे', 'भाव', 'टोमॅटो', 'कांदा', 'बटाटा', 'शेतकरी']):
            lang_name = 'Marathi (मराठी)'
            if any(w in t for w in ['विकायचे', 'माझ्याकडे', 'आहेत']):
                intent = 'SELL_PRODUCE'
            elif any(w in t for w in ['भाव', 'दर', 'किंमत']):
                intent = 'CHECK_PRICE'

        # Hindi Intent keywords: मुझे बेचना है, मेरे पास, टमाटर, प्याज, दाम
        elif any(w in t for w in ['बेचना', 'मेरे पास', 'दाम', 'टमाटर', 'प्याज', 'आलू', 'भाव']):
            lang_name = 'Hindi (हिन्दी)'
            if any(w in t for w in ['बेचना', 'मेरे पास']):
                intent = 'SELL_PRODUCE'
            elif any(w in t for w in ['दाम', 'भाव', 'रेट']):
                intent = 'CHECK_PRICE'

        # Crop detection
        crop = 'Tomato'
        if any(w in t for w in ['tomato', 'टोमॅटो', 'टमाटर']):
            crop = 'Tomato'
        elif any(w in t for w in ['onion', 'कांदा', 'प्याज']):
            crop = 'Onion'
        elif any(w in t for w in ['potato', 'बटाटा', 'आलू']):
            crop = 'Potato'
        elif any(w in t for w in ['wheat', 'गहू', 'गेहूं']):
            crop = 'Wheat'
        elif any(w in t for w in ['grapes', 'द्राक्षे', 'अंगूर']):
            crop = 'Grapes'

        # Quantity detection
        qty = 1000.0
        # Check Marathi / Hindi numeric words
        if 'दोन हजार' in t or 'दो हजार' in t:
            qty = 2000.0
        elif 'पाच हजार' in t or 'पांच हजार' in t or '5 tonnes' in t:
            qty = 5000.0
        elif 'एक हजार' in t or '1000' in t:
            qty = 1000.0
        elif 'तीन हजार' in t or '3000' in t:
            qty = 3000.0
        else:
            num = re.search(r'(\d+)', t)
            if num:
                qty = float(num.group(1))

        # Suggested price
        price_intel = PriceForecasterService.get_predictive_fair_price(crop, 'Pune')
        suggested_price = price_intel['predicted_price']

        if intent == 'SELL_PRODUCE':
            confirmation_prompt = (
                f"Would you like to list {qty:,.0f} kg of fresh {crop} at ₹{suggested_price:.2f}/kg on the FarmDirect marketplace?"
            )
            action_payload = {
                'action': 'CREATE_LISTING',
                'crop': crop,
                'quantity': qty,
                'expected_price': suggested_price,
                'location': 'Pune',
                'quality_grade': 'Grade A',
                'availability_date': date.today().isoformat()
            }
        else:
            confirmation_prompt = f"The current reference benchmark for {crop} in Pune is ₹{suggested_price:.2f}/kg. Would you like to view detailed market forecasts?"
            action_payload = {
                'action': 'VIEW_PRICE_INSIGHT',
                'crop': crop
            }

        return {
            'success': True,
            'transcript': raw,
            'language': lang_name,
            'intent': intent,
            'extracted_crop': crop,
            'extracted_quantity': qty,
            'suggested_price': suggested_price,
            'confirmation_prompt': confirmation_prompt,
            'action_payload': action_payload,
            'requires_confirmation': True
        }

    @staticmethod
    def generate_listing_attributes(prompt_text):
        """
        AI Listing Generator: Generates polished title, description, tags, and price band from short text.
        """
        clean = prompt_text.strip()
        lower = clean.lower()

        # Identify crop
        known_crops = ['Tomato', 'Onion', 'Potato', 'Grapes', 'Carrot', 'Cabbage', 'Cauliflower', 'Wheat']
        crop = 'Tomato'
        for c in known_crops:
            if c.lower() in lower:
                crop = c
                break

        # Quantity
        qty = 2000.0
        m = re.search(r'(\d+(?:\.\d+)?)\s*(?:ton|tonne|tonnes|t|kg|kilos)?\b', lower)
        if m:
            val = float(m.group(1))
            qty = (val * 1000.0) if val < 20 else val

        # Location
        loc = 'Pune'
        for city in ['Pune', 'Nashik', 'Satara', 'Sangli', 'Ahmednagar', 'Mumbai']:
            if city.lower() in lower:
                loc = city
                break

        # Price benchmark
        p_data = PriceForecasterService.get_predictive_fair_price(crop, loc)
        price = p_data['predicted_price']

        title = f"Fresh Harvest {crop} ({qty:,.0f} kg) — Direct from {loc} Farm"
        description = (
            f"Farm-fresh commercial grade {crop} harvested at peak physiological maturity. "
            f"Uniform caliber, clean grading, ideal for institutional buyers, supermarket chains, and food processors. "
            f"Ready for bulk crate dispatch from {loc}."
        )
        tags = [crop, f"{loc} Harvest", "Grade A Certified", "Direct Farmer Supply", "Bulk Available"]
        buyer_categories = ["Supermarket Chains", "Hospitality / Restaurant Groups", "Wholesale Distributors", "Food Processors"]

        return {
            'crop': crop,
            'quantity': qty,
            'expected_price': price,
            'location': loc,
            'quality_grade': 'Grade A',
            'suggested_title': title,
            'suggested_description': description,
            'tags': tags,
            'suggested_buyer_categories': buyer_categories,
            'price_benchmark': {
                'min': p_data['lower_bound'],
                'max': p_data['upper_bound'],
                'recommended': price
            }
        }
