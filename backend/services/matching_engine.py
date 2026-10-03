from datetime import datetime, date
import math

class MatchingEngine:
    """
    Explainable AI Matching Engine for FarmDirect.
    Calculates weighted suitability score between buyer requirements and produce listings.
    Modular design allows future plug-and-play machine learning models.
    """

    WEIGHT_CROP = 0.30
    WEIGHT_QUANTITY = 0.20
    WEIGHT_PRICE = 0.20
    WEIGHT_LOCATION = 0.15
    WEIGHT_QUALITY = 0.10
    WEIGHT_AVAILABILITY = 0.05

    # City distance lookup matrix (approximate km in Maharashtra/Western India agricultural belt)
    DISTANCES = {
        ('pune', 'pune'): 15,
        ('pune', 'nashik'): 210,
        ('pune', 'satara'): 115,
        ('pune', 'mumbai'): 150,
        ('pune', 'ahmednagar'): 120,
        ('pune', 'sangli'): 235,
        ('nashik', 'nashik'): 15,
        ('nashik', 'mumbai'): 165,
        ('nashik', 'ahmednagar'): 155,
        ('nashik', 'satara'): 325,
        ('satara', 'satara'): 15,
        ('satara', 'sangli'): 125,
        ('satara', 'mumbai'): 260,
        ('ahmednagar', 'ahmednagar'): 15,
        ('sangli', 'sangli'): 15,
    }

    @staticmethod
    def get_distance(loc1, loc2):
        if not loc1 or not loc2:
            return 100.0
        l1 = loc1.strip().lower()
        l2 = loc2.strip().lower()
        if l1 == l2:
            return 25.0
        dist = MatchingEngine.DISTANCES.get((l1, l2)) or MatchingEngine.DISTANCES.get((l2, l1))
        return float(dist) if dist is not None else 180.0

    def calculate_crop_score(self, listing_crop, req_crop):
        if not req_crop:
            return 100.0, "Any crop selected"

        l_raw = (listing_crop or '').strip()
        r_raw = (req_crop or '').strip()

        if l_raw.lower() == r_raw.lower():
            return 100.0, f"Exact crop match ({listing_crop})"

        try:
            from services.ai.validators import normalize_crop_name, SYNONYM_MAP
            l_norm = normalize_crop_name(l_raw)
            r_norm = normalize_crop_name(r_raw)

            if l_norm == r_norm:
                return 100.0, f"Exact normalized crop match ({listing_crop})"

            # Substring matching (e.g., 'Dragon Fruit' in 'Red Dragon Fruit' or 'Wheat' in 'Sharbati Wheat')
            if r_norm in l_norm or l_norm in r_norm:
                return 95.0, f"Close crop match ({listing_crop} matches {req_crop})"

            # Token overlap check (e.g., 'Shimla Green Capsicum' vs 'Capsicum')
            l_tokens = set(l_norm.split())
            r_tokens = set(r_norm.split())
            if l_tokens.intersection(r_tokens):
                return 85.0, f"Related crop match ({listing_crop} matches {req_crop})"

            # Synonym dictionary check
            for canonical, syns in SYNONYM_MAP.items():
                if (any(s in l_norm for s in syns)) and (any(s in r_norm for s in syns)):
                    return 80.0, f"Crop synonym match under {canonical} ({listing_crop} matches {req_crop})"
        except Exception:
            pass

        return 0.0, f"Crop mismatch ({listing_crop} vs {req_crop})"

    def calculate_quantity_score(self, available_qty, req_qty):
        if not req_qty or req_qty <= 0:
            return 100.0, "Sufficient quantity available"
        if available_qty >= req_qty:
            diff = available_qty - req_qty
            if diff > 0:
                note = f"Sufficient quantity ({available_qty:,.0f} kg available vs {req_qty:,.0f} kg needed, surplus {diff:,.0f} kg)"
            else:
                note = f"Exact quantity match ({available_qty:,.0f} kg)"
            return 100.0, note
        
        ratio = (available_qty / req_qty) * 100.0
        score = max(0.0, min(100.0, ratio))
        return round(score, 1), f"Partial quantity available ({available_qty:,.0f} kg of {req_qty:,.0f} kg requested, {score:.0f}%)"

    def calculate_price_score(self, listing_price, max_price):
        if not max_price or max_price <= 0:
            return 100.0, f"Listed at ₹{listing_price}/kg"
        if listing_price <= max_price:
            savings = max_price - listing_price
            if savings > 0:
                note = f"Within budget (₹{listing_price}/kg is ₹{savings:.2f} below your max ₹{max_price}/kg)"
            else:
                note = f"Matches maximum budget (₹{listing_price}/kg)"
            return 100.0, note
        
        # Above budget penalty
        over_percent = ((listing_price - max_price) / max_price) * 100.0
        if over_percent <= 10.0:
            score = 100.0 - (over_percent * 3.0)  # slightly above
        elif over_percent <= 25.0:
            score = 70.0 - ((over_percent - 10.0) * 2.5)
        else:
            score = max(5.0, 32.5 - ((over_percent - 25.0) * 1.0))
        
        return round(max(0.0, score), 1), f"₹{listing_price}/kg exceeds max budget of ₹{max_price}/kg by {over_percent:.1f}%"

    def calculate_location_score(self, listing_loc, buyer_loc):
        if not buyer_loc:
            return 85.0, f"Located in {listing_loc}"
        dist = self.get_distance(listing_loc, buyer_loc)
        l1 = listing_loc.strip().lower()
        l2 = buyer_loc.strip().lower()
        if l1 == l2:
            return 100.0, f"Same location ({listing_loc}, ~{dist:.0f} km)"
        elif dist <= 50:
            return 90.0, f"Nearby location ({listing_loc}, ~{dist:.0f} km away)"
        elif dist <= 120:
            return 75.0, f"Regional location ({listing_loc}, ~{dist:.0f} km away)"
        elif dist <= 200:
            return 55.0, f"Moderate distance ({listing_loc}, ~{dist:.0f} km away)"
        else:
            return 35.0, f"Longer transit distance ({listing_loc}, ~{dist:.0f} km away)"

    def calculate_quality_score(self, listing_quality, req_quality):
        if not req_quality:
            return 100.0, f"Produce quality: {listing_quality}"
        l_q = listing_quality.strip().lower()
        r_q = req_quality.strip().lower()
        if l_q == r_q:
            return 100.0, f"Required quality matched ({listing_quality})"
        
        # Quality hierarchy
        if 'organic' in l_q and 'grade a' in r_q:
            return 95.0, f"Premium Organic produce exceeds Grade A request"
        if 'grade a' in l_q and 'grade b' in r_q:
            return 100.0, f"Superior Grade A quality offered for Grade B request"
        if 'grade b' in l_q and 'grade a' in r_q:
            return 60.0, f"Listing is Grade B (Grade A requested)"
        return 70.0, f"Quality grade: {listing_quality} vs requested {req_quality}"

    def calculate_availability_score(self, listing_date, req_date):
        if not req_date:
            return 100.0, "Immediate availability"
        
        if isinstance(listing_date, str):
            listing_date = datetime.strptime(listing_date, '%Y-%m-%d').date()
        if isinstance(req_date, str):
            req_date = datetime.strptime(req_date, '%Y-%m-%d').date()

        diff_days = (listing_date - req_date).days
        if diff_days <= 0:
            days_early = abs(diff_days)
            if days_early == 0:
                note = f"Ready precisely on required date ({listing_date.strftime('%d %b %Y')})"
            else:
                note = f"Available {days_early} day(s) before required date ({listing_date.strftime('%d %b %Y')})"
            return 100.0, note
        elif diff_days <= 2:
            return 65.0, f"Available {diff_days} day(s) after required date ({listing_date.strftime('%d %b %Y')})"
        elif diff_days <= 5:
            return 30.0, f"Available {diff_days} days after required date ({listing_date.strftime('%d %b %Y')})"
        else:
            return 10.0, f"Available {diff_days} days late ({listing_date.strftime('%d %b %Y')})"

    def score_listing(self, listing, req):
        """
        Calculates the total match score and generates an explainable breakdown.
        req dict: { crop, quantity, max_price, location, quality, required_by_date }
        """
        crop_score, crop_exp = self.calculate_crop_score(listing.crop, req.get('crop'))
        
        # Hard filter: if specific crop requested and mismatch, overall score is 0
        if req.get('crop') and crop_score == 0:
            return {
                'match_score': 0.0,
                'tier': 'Incompatible',
                'explanation': {
                    'crop': crop_exp,
                    'quantity': 'N/A',
                    'price': 'N/A',
                    'location': 'N/A',
                    'quality': 'N/A',
                    'availability': 'N/A'
                },
                'breakdown': {
                    'crop': 0,
                    'quantity': 0,
                    'price': 0,
                    'location': 0,
                    'quality': 0,
                    'availability': 0
                }
            }

        qty_score, qty_exp = self.calculate_quantity_score(listing.available_quantity, req.get('quantity'))
        price_score, price_exp = self.calculate_price_score(listing.expected_price, req.get('max_price'))
        loc_score, loc_exp = self.calculate_location_score(listing.location, req.get('location'))
        qual_score, qual_exp = self.calculate_quality_score(listing.quality_grade, req.get('quality'))
        avail_score, avail_exp = self.calculate_availability_score(listing.availability_date, req.get('required_by_date'))

        total_score = (
            crop_score * self.WEIGHT_CROP +
            qty_score * self.WEIGHT_QUANTITY +
            price_score * self.WEIGHT_PRICE +
            loc_score * self.WEIGHT_LOCATION +
            qual_score * self.WEIGHT_QUALITY +
            avail_score * self.WEIGHT_AVAILABILITY
        )
        total_score = round(max(0.0, min(100.0, total_score)), 1)

        if total_score >= 85:
            tier = 'Strong Match'
        elif total_score >= 70:
            tier = 'Good Match'
        elif total_score >= 50:
            tier = 'Moderate Match'
        else:
            tier = 'Low Match'

        # Key considerations / surplus or notes
        considerations = []
        if req.get('quantity') and listing.available_quantity > req.get('quantity'):
            surplus = listing.available_quantity - req.get('quantity')
            considerations.append(f"Farmer has {surplus:,.0f} kg more than requested.")
        if req.get('max_price') and listing.expected_price < req.get('max_price'):
            savings = req.get('max_price') - listing.expected_price
            considerations.append(f"Farmer's price is ₹{savings:.2f}/kg lower than your ceiling.")

        return {
            'match_score': total_score,
            'tier': tier,
            'explanation': {
                'crop': crop_exp,
                'quantity': qty_exp,
                'price': price_exp,
                'location': loc_exp,
                'quality': qual_exp,
                'availability': avail_exp,
                'considerations': considerations
            },
            'breakdown': {
                'crop': crop_score,
                'quantity': qty_score,
                'price': price_score,
                'location': loc_score,
                'quality': qual_score,
                'availability': avail_score
            }
        }

    def rank_listings(self, listings, req):
        ranked = []
        for listing in listings:
            result = self.score_listing(listing, req)
            if result['match_score'] > 0:
                ranked.append({
                    'listing': listing.to_dict(),
                    'match': result
                })
        # Sort descending by match_score
        ranked.sort(key=lambda x: x['match']['match_score'], reverse=True)
        return ranked
