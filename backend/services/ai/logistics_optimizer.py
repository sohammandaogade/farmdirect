"""
Intelligent Logistics Optimizer for FarmDirect.
Solves multi-farmer pickup routing, vehicle capacity selection, and freight pooling savings.
"""

from services.matching_engine import MatchingEngine
from services.logistics import LogisticsService

VEHICLE_FLEET = [
    {'type': 'Mini Truck / 1.5T Pickup', 'capacity_kg': 1500, 'base_fare': 400.0, 'rate_per_km': 28.0},
    {'type': '3.5T Agricultural LCV (Tata 407)', 'capacity_kg': 3500, 'base_fare': 650.0, 'rate_per_km': 34.0},
    {'type': '7.5T Medium Commercial Vehicle', 'capacity_kg': 7500, 'base_fare': 1100.0, 'rate_per_km': 42.0},
    {'type': '16T Heavy Freight Multi-Axle', 'capacity_kg': 16000, 'base_fare': 1800.0, 'rate_per_km': 54.0}
]

class LogisticsOptimizer:

    @staticmethod
    def select_optimal_vehicle(total_quantity_kg):
        for v in VEHICLE_FLEET:
            if total_quantity_kg <= v['capacity_kg']:
                return v
        return VEHICLE_FLEET[-1]

    @staticmethod
    def optimize_multi_pickup(pickups, buyer_location='Mumbai'):
        """
        pickups: list of dicts [{'location': 'Pune', 'quantity_kg': 1500, 'farmer_name': 'Rajesh Farms'}]
        """
        if not pickups:
            return {'success': False, 'message': 'No pickup locations provided.'}

        total_qty = sum(p.get('quantity_kg', 0) for p in pickups)
        vehicle = LogisticsOptimizer.select_optimal_vehicle(total_qty)

        # Calculate individual standalone trips cost
        separate_trips_cost = 0.0
        individual_legs = []
        for p in pickups:
            dist = MatchingEngine.get_distance(p['location'], buyer_location)
            leg_cost = LogisticsService.estimate_logistics(p['location'], buyer_location, p['quantity_kg'])['estimated_transport_cost']
            separate_trips_cost += leg_cost
            individual_legs.append({
                'farmer_name': p.get('farmer_name', 'Farmer'),
                'pickup_location': p['location'],
                'quantity_kg': p['quantity_kg'],
                'distance_to_buyer_km': dist,
                'standalone_freight': leg_cost
            })

        # Calculate consolidated multi-stop route
        # Waypoints sequenced from furthest pickup inwards toward buyer
        sorted_pickups = sorted(
            pickups,
            key=lambda p: MatchingEngine.get_distance(p['location'], buyer_location),
            reverse=True
        )

        stops = []
        cumulative_distance = 0.0
        prev_loc = sorted_pickups[0]['location']
        first_leg_dist = MatchingEngine.get_distance(sorted_pickups[0]['location'], buyer_location)
        cumulative_distance += first_leg_dist

        for idx, p in enumerate(sorted_pickups):
            loc = p['location']
            if idx > 0:
                hop_dist = MatchingEngine.get_distance(prev_loc, loc)
                # Waypoint addition is incremental hop
                cumulative_distance += (hop_dist * 0.45)  # Regional highway corridor pooling factor
                prev_loc = loc

            stops.append({
                'sequence': idx + 1,
                'stop_type': 'PICKUP',
                'location': loc,
                'farmer_name': p.get('farmer_name', 'Supplier'),
                'load_quantity_kg': p['quantity_kg']
            })

        stops.append({
            'sequence': len(stops) + 1,
            'stop_type': 'FINAL_DELIVERY',
            'location': buyer_location,
            'load_quantity_kg': total_qty
        })

        # Total consolidated freight cost
        consolidated_cost = vehicle['base_fare'] + (cumulative_distance * vehicle['rate_per_km'])
        # Add small per-stop handling fee (₹200 per extra waypoint)
        if len(pickups) > 1:
            consolidated_cost += (len(pickups) - 1) * 200.0

        consolidated_cost = round(consolidated_cost / 10.0) * 10.0
        savings_amount = max(0.0, round(separate_trips_cost - consolidated_cost, 2))
        savings_pct = round((savings_amount / separate_trips_cost) * 100, 1) if separate_trips_cost > 0 else 0.0

        # Transit turnaround
        if cumulative_distance <= 120:
            turnaround = 'Same Day Delivery (5-7 hours total route)'
        elif cumulative_distance <= 250:
            turnaround = 'Next Morning Delivery (Overnight cold-run)'
        else:
            turnaround = '1-2 Business Days'

        return {
            'success': True,
            'buyer_destination': buyer_location,
            'total_quantity_kg': total_qty,
            'recommended_vehicle': vehicle['type'],
            'vehicle_capacity_kg': vehicle['capacity_kg'],
            'vehicle_utilization_pct': round((total_qty / vehicle['capacity_kg']) * 100, 1),
            'stops_sequence': stops,
            'total_route_distance_km': round(cumulative_distance, 1),
            'consolidated_freight_cost': consolidated_cost,
            'separate_trips_total_cost': round(separate_trips_cost, 2),
            'consolidation_savings_inr': savings_amount,
            'consolidation_savings_pct': savings_pct,
            'delivery_turnaround': turnaround,
            'individual_legs': individual_legs,
            'disclaimer': 'Consolidated freight route utilizes multi-stop waypoints and load factor pooling.'
        }
