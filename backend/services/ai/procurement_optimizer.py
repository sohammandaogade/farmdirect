"""
AI Procurement Optimizer for FarmDirect.
Parses natural language procurement requests, solves multi-supplier split allocation,
and constructs 3 distinct plans (Plan A: Lowest Cost, Plan B: Reliability, Plan C: Speed).
"""

import re
from datetime import date, timedelta
from models import ProduceListing
from services.matching_engine import MatchingEngine
from services.ai.trust_engine import TrustEngine
from services.logistics import LogisticsService

class ProcurementOptimizer:

    @staticmethod
    def parse_natural_language_query(text):
        """
        Extracts structured procurement intent from natural language statements.
        Example: "I need 5 tonnes of Grade A tomatoes near Pune below ₹30/kg by Friday"
        """
        if not text:
            return {}

        raw = text.strip()
        lower = raw.lower()

        # Extract Crop
        known_crops = ['tomato', 'onion', 'potato', 'grapes', 'carrot', 'cabbage', 'cauliflower', 'capsicum', 'wheat', 'rice']
        detected_crop = 'Tomato'
        for c in known_crops:
            if c in lower:
                detected_crop = c.title()
                break

        # Extract Quantity (handling tonnes, quintals, kg)
        quantity_kg = 2000.0
        tonne_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ton|tonne|tonnes|t)\b', lower)
        quintal_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:quintal|quintals|q)\b', lower)
        kg_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilogram|kilograms)\b', lower)

        if tonne_match:
            quantity_kg = float(tonne_match.group(1)) * 1000.0
        elif quintal_match:
            quantity_kg = float(quintal_match.group(1)) * 100.0
        elif kg_match:
            quantity_kg = float(kg_match.group(1))

        # Extract Quality
        quality = 'Grade A'
        if 'organic' in lower:
            quality = 'Organic'
        elif 'grade b' in lower:
            quality = 'Grade B'
        elif 'grade a' in lower:
            quality = 'Grade A'

        # Extract Location
        known_cities = ['pune', 'nashik', 'mumbai', 'satara', 'sangli', 'ahmednagar', 'nagpur', 'aurangabad']
        detected_loc = 'Pune'
        for city in known_cities:
            if city in lower:
                detected_loc = city.title()
                break

        # Extract Max Price / Budget
        max_price = 30.0
        price_match = re.search(r'(?:₹|rs\.?|below|under|max|at\s*most)?\s*(\d+(?:\.\d+)?)\s*(?:/kg|per\s*kg|rs)?\b', lower)
        if price_match:
            # Look specifically for numbers following budget indicator
            budget_spec = re.search(r'(?:below|under|max|budget|ceiling|upto)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)', lower)
            if budget_spec:
                max_price = float(budget_spec.group(1))
            else:
                # Direct price rate match
                rate_match = re.search(r'(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)', lower)
                if rate_match:
                    max_price = float(rate_match.group(1))

        # Extract Deadline
        deadline = (date.today() + timedelta(days=5)).isoformat()
        if 'friday' in lower:
            deadline = 'This Friday'
        elif 'tomorrow' in lower:
            deadline = 'Tomorrow Morning'
        elif 'urgent' in lower or 'immediate' in lower:
            deadline = 'Immediate (Today/Tomorrow)'

        return {
            'crop': detected_crop,
            'quantity': quantity_kg,
            'quality': quality,
            'location': detected_loc,
            'max_price': max_price,
            'deadline': deadline,
            'raw_query': raw
        }

    @staticmethod
    def generate_procurement_plans(requirement):
        crop = requirement.get('crop', 'Tomato')
        req_quantity = float(requirement.get('quantity', 2000.0))
        max_price = float(requirement.get('max_price', 35.0))
        buyer_loc = requirement.get('location', 'Pune')

        # Find eligible active listings
        listings = ProduceListing.query.filter(
            ProduceListing.crop.ilike(f'%{crop}%'),
            ProduceListing.status == 'ACTIVE',
            ProduceListing.available_quantity > 0
        ).all()

        if not listings:
            return {
                'success': False,
                'message': f"No active suppliers currently listed for {crop}."
            }

        # Score and prepare suppliers
        supplier_pool = []
        for l in listings:
            dist = MatchingEngine.get_distance(l.location, buyer_loc)
            trust_info = TrustEngine.get_farmer_trust(l.farmer_id)
            logistics = LogisticsService.estimate_logistics(l.location, buyer_loc, min(l.available_quantity, req_quantity))

            supplier_pool.append({
                'listing_id': l.id,
                'farmer_id': l.farmer_id,
                'farmer_name': l.farmer.name if l.farmer else 'Farmer',
                'farm_name': l.farmer.farmer_profile.farm_name if l.farmer and l.farmer.farmer_profile else l.farmer.name,
                'location': l.location,
                'distance_km': dist,
                'price_per_kg': l.expected_price,
                'available_kg': l.available_quantity,
                'quality_grade': l.quality_grade,
                'trust_score': trust_info['trust_score'],
                'reliability_tier': trust_info['reliability_tier'],
                'freight_cost': logistics['estimated_transport_cost'],
                'delivery_time': logistics['estimated_delivery_time']
            })

        # --- Helper to build a plan given a sort key ---
        def build_plan(plan_name, tag, sorted_suppliers):
            allocated = []
            remaining_needed = req_quantity
            total_produce_cost = 0.0
            total_freight_cost = 0.0
            total_distance = 0.0

            for s in sorted_suppliers:
                if remaining_needed <= 0:
                    break
                qty = min(remaining_needed, s['available_kg'])
                produce_cost = qty * s['price_per_kg']
                # Scale freight proportionately to allocated tonnage
                freight = s['freight_cost'] * (qty / max(1.0, s['available_kg']))
                
                allocated.append({
                    'farmer_name': s['farmer_name'],
                    'farm_name': s['farm_name'],
                    'location': s['location'],
                    'distance_km': s['distance_km'],
                    'allocated_quantity_kg': qty,
                    'price_per_kg': s['price_per_kg'],
                    'produce_cost': round(produce_cost, 2),
                    'freight_cost': round(freight, 2),
                    'trust_score': s['trust_score'],
                    'quality_grade': s['quality_grade']
                })

                total_produce_cost += produce_cost
                total_freight_cost += freight
                total_distance = max(total_distance, s['distance_km'])
                remaining_needed -= qty

            fulfilled_qty = req_quantity - remaining_needed
            fulfillment_pct = round((fulfilled_qty / req_quantity) * 100, 1) if req_quantity > 0 else 100.0

            # Multi-farmer consolidation discount on freight (if multi-stop)
            consolidation_discount = 0.0
            if len(allocated) > 1:
                consolidation_discount = round(total_freight_cost * 0.18, 2)  # 18% multi-stop route pooling savings
                total_freight_cost -= consolidation_discount

            landed_cost = total_produce_cost + total_freight_cost
            effective_rate = round(landed_cost / fulfilled_qty, 2) if fulfilled_qty > 0 else 0.0
            avg_trust = round(sum(a['trust_score'] for a in allocated) / len(allocated), 1) if allocated else 85.0

            return {
                'plan_name': plan_name,
                'tag': tag,
                'fulfilled_quantity_kg': fulfilled_qty,
                'fulfillment_percentage': fulfillment_pct,
                'total_produce_cost': round(total_produce_cost, 2),
                'total_freight_cost': round(total_freight_cost, 2),
                'consolidation_savings': consolidation_discount,
                'total_landed_cost': round(landed_cost, 2),
                'effective_landed_rate_per_kg': effective_rate,
                'avg_supplier_trust': avg_trust,
                'max_distance_km': total_distance,
                'suppliers_count': len(allocated),
                'allocations': allocated
            }

        # 1. PLAN A — Lowest Landed Cost (sort by price + per-kg freight)
        pool_by_cost = sorted(supplier_pool, key=lambda s: s['price_per_kg'] + (s['freight_cost'] / max(1.0, s['available_kg'])))
        plan_a = build_plan('Plan A — Lowest Landed Cost', 'Best Economic Value', pool_by_cost)

        # 2. PLAN B — Highest Reliability (sort by trust score descending, then price)
        pool_by_trust = sorted(supplier_pool, key=lambda s: (-s['trust_score'], s['price_per_kg']))
        plan_b = build_plan('Plan B — Highest Reliability', 'Zero-Risk Certified Sourcing', pool_by_trust)

        # 3. PLAN C — Fastest Delivery (sort by distance km ascending, then available volume)
        pool_by_speed = sorted(supplier_pool, key=lambda s: (s['distance_km'], -s['available_kg']))
        plan_c = build_plan('Plan C — Fastest Delivery', 'Shortest Transit Radius', pool_by_speed)

        return {
            'requirement': requirement,
            'plans': [plan_a, plan_b, plan_c],
            'disclaimer': 'Multi-supplier procurement packages calculate landed costs including vehicle pooling and freight consolidation.'
        }
