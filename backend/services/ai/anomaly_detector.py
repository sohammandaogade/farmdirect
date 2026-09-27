"""
Anomaly & Fraud Detection and Duplicate Listing Detection Service.
Detects price outliers, quantity spikes, and duplicate submissions.
Ensures transparent auditing with 'Needs Review' workflows without accusatory language.
"""

from models import ProduceListing, PriceReference, AnomalyEvent, Order, db

class AnomalyDetector:

    @staticmethod
    def check_duplicate_listing(farmer_id, crop, quantity, price, location, description=None):
        """
        Calculates similarity percentage against farmer's existing active listings.
        """
        active_listings = ProduceListing.query.filter_by(farmer_id=farmer_id, status='ACTIVE').all()
        if not active_listings:
            return {'is_suspected_duplicate': False, 'similarity_score': 0.0}

        highest_sim = 0.0
        most_similar_listing = None
        reasons = []

        crop_norm = crop.strip().lower()
        qty = float(quantity)
        p = float(price)

        for l in active_listings:
            sim = 0.0
            match_reasons = []

            # Crop match (40%)
            if l.crop.strip().lower() == crop_norm:
                sim += 40.0
                match_reasons.append("Exact same crop")

            # Location match (15%)
            if l.location.strip().lower() == location.strip().lower():
                sim += 15.0
                match_reasons.append("Same harvest location")

            # Quantity match (20%)
            qty_diff = abs(l.quantity - qty) / max(l.quantity, qty)
            if qty_diff <= 0.05:
                sim += 20.0
                match_reasons.append("Identical quantity (within 5%)")
            elif qty_diff <= 0.15:
                sim += 12.0
                match_reasons.append("Similar quantity (within 15%)")

            # Price match (15%)
            price_diff = abs(l.expected_price - p) / max(l.expected_price, p)
            if price_diff <= 0.05:
                sim += 15.0
                match_reasons.append("Identical price point")
            elif price_diff <= 0.15:
                sim += 8.0

            # Description similarity (10%)
            if description and l.description and l.description.strip().lower() == description.strip().lower():
                sim += 10.0
                match_reasons.append("Identical description text")

            if sim > highest_sim:
                highest_sim = sim
                most_similar_listing = l
                reasons = match_reasons

        is_duplicate = highest_sim >= 75.0

        return {
            'is_suspected_duplicate': is_duplicate,
            'similarity_score': round(highest_sim, 1),
            'matched_listing_id': most_similar_listing.id if most_similar_listing else None,
            'matched_listing_crop': most_similar_listing.crop if most_similar_listing else None,
            'matched_listing_price': most_similar_listing.expected_price if most_similar_listing else None,
            'matched_listing_qty': most_similar_listing.quantity if most_similar_listing else None,
            'reasons': reasons,
            'warning_message': (
                f"Possible duplicate detected ({highest_sim:.0f}% similarity with your active listing #{most_similar_listing.id} "
                f"for {most_similar_listing.crop})." if is_duplicate else None
            )
        }

    @staticmethod
    def audit_listing_price(listing_id, crop, region, price):
        ref = PriceReference.query.filter(PriceReference.crop.ilike(crop.strip())).first()
        if not ref:
            return {'status': 'PASS', 'severity': 'LOW'}

        min_p = ref.min_price
        max_p = ref.max_price
        p = float(price)

        if p > (max_p * 1.40):
            # Price exceeds 40% above maximum benchmark
            anomaly = AnomalyEvent(
                entity_type='LISTING',
                entity_id=listing_id,
                anomaly_type='PRICE_OUTLIER',
                severity='HIGH',
                title=f'Price Outlier: High Quote for {crop}',
                details=f"Listed at ₹{p:.2f}/kg, which is {((p - max_p)/max_p * 100):.1f}% above historical reference ceiling (₹{max_p:.2f}/kg).",
                status='NEEDS_REVIEW'
            )
            db.session.add(anomaly)
            db.session.commit()
            return {'status': 'FLAGGED', 'severity': 'HIGH', 'reason': 'High price deviation'}

        elif p < (min_p * 0.60):
            # Price is suspiciously low (possible dumping or data entry typo)
            anomaly = AnomalyEvent(
                entity_type='LISTING',
                entity_id=listing_id,
                anomaly_type='PRICE_OUTLIER',
                severity='MEDIUM',
                title=f'Price Outlier: Unusually Low Quote for {crop}',
                details=f"Listed at ₹{p:.2f}/kg, which is {((min_p - p)/min_p * 100):.1f}% below minimum market floor (₹{min_p:.2f}/kg). Check for typo.",
                status='NEEDS_REVIEW'
            )
            db.session.add(anomaly)
            db.session.commit()
            return {'status': 'FLAGGED', 'severity': 'MEDIUM', 'reason': 'Unusually low price'}

        return {'status': 'PASS', 'severity': 'LOW'}

    @staticmethod
    def get_all_anomalies(status_filter=None):
        query = AnomalyEvent.query.order_by(AnomalyEvent.created_at.desc())
        if status_filter:
            query = query.filter_by(status=status_filter)
        return [a.to_dict() for a in query.all()]
