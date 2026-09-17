from models import PriceReference

class PriceEngine:
    """
    Fair/Reference Price Insight Service.
    Compares listing price to historical/demo reference benchmarks.
    Never claims to be 'live market data'.
    """

    @staticmethod
    def get_price_insight(crop, region, listing_price):
        if not crop:
            return None

        # Look for exact crop & region match, else crop match
        ref = PriceReference.query.filter(
            PriceReference.crop.ilike(crop.strip()),
            PriceReference.region.ilike(region.strip())
        ).first()

        if not ref:
            ref = PriceReference.query.filter(
                PriceReference.crop.ilike(crop.strip())
            ).first()

        if not ref:
            # Fallback baseline estimates if no db record exists
            return {
                'has_reference': False,
                'disclaimer': 'Historical/demo reference data currently unavailable for this crop/region.'
            }

        min_p = ref.min_price
        max_p = ref.max_price
        avg_p = round((min_p + max_p) / 2.0, 2)

        if listing_price < min_p:
            diff_pct = round(((min_p - listing_price) / min_p) * 100, 1)
            status = 'Below Reference Range'
            verdict = f'₹{listing_price:.2f}/kg is {diff_pct}% below reference minimum (Attractive buyer price)'
            tag = 'competitive'
        elif listing_price > max_p:
            diff_pct = round(((listing_price - max_p) / max_p) * 100, 1)
            status = 'Above Reference Range'
            verdict = f'₹{listing_price:.2f}/kg is {diff_pct}% above reference ceiling (Premium produce)'
            tag = 'premium'
        else:
            status = 'Within Reference Range'
            verdict = f'₹{listing_price:.2f}/kg is aligned with reference benchmark (Fair Value)'
            tag = 'fair'

        return {
            'has_reference': True,
            'crop': ref.crop,
            'region': ref.region,
            'min_price': min_p,
            'max_price': max_p,
            'avg_price': avg_p,
            'listing_price': listing_price,
            'unit': ref.unit,
            'status': status,
            'verdict': verdict,
            'tag': tag,
            'source_type': ref.source_type,
            'reference_date': ref.reference_date.isoformat() if hasattr(ref.reference_date, 'isoformat') else str(ref.reference_date),
            'disclaimer': 'Based on historical/demo reference data. Not live market prices.'
        }
