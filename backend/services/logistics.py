from services.matching_engine import MatchingEngine

class LogisticsService:
    """
    Lightweight logistics and freight cost estimator for FarmDirect.
    Calculates approximate transit distance, freight charges, and delivery time.
    """

    BASE_FARE = 400.0   # Base pickup & loading fare in INR
    RATE_PER_KM = 35.0  # INR per km for agricultural tempo / truck

    @staticmethod
    def estimate_logistics(farmer_loc, buyer_loc, quantity_kg=1000):
        distance_km = MatchingEngine.get_distance(farmer_loc, buyer_loc)
        
        # Scale freight cost slightly based on tonnage
        tonnage = max(0.5, quantity_kg / 1000.0)
        weight_multiplier = 1.0 + (tonnage - 1.0) * 0.15 if tonnage > 1 else 1.0

        estimated_cost = LogisticsService.BASE_FARE + (distance_km * LogisticsService.RATE_PER_KM * weight_multiplier)
        # Round to neat 10s
        estimated_cost = round(estimated_cost / 10.0) * 10.0

        # Delivery turnaround estimate
        if distance_km <= 35:
            delivery_time = 'Same day (3-5 hours)'
            vehicle_type = 'Mini Truck / 1.5T Pickup'
        elif distance_km <= 100:
            delivery_time = 'Same day (6-8 hours)'
            vehicle_type = '3.5T Agricultural LCV'
        elif distance_km <= 200:
            delivery_time = 'Next morning delivery'
            vehicle_type = 'Intermediate Commercial Truck'
        else:
            delivery_time = '1-2 business days'
            vehicle_type = 'Long-haul Freight Carrier'

        return {
            'farmer_location': farmer_loc,
            'buyer_location': buyer_loc,
            'distance_km': distance_km,
            'estimated_transport_cost': estimated_cost,
            'estimated_delivery_time': delivery_time,
            'suggested_vehicle': vehicle_type,
            'rate_per_km': LogisticsService.RATE_PER_KM,
            'is_estimated': True,
            'disclaimer': 'Estimated freight based on regional transit distance and standard carrier tariffs.'
        }
