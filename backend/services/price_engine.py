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

    @staticmethod
    def generate_ai_price_insight(crop, region, listing_price):
        """
        Enriches deterministic price references with Gemini pricing intelligence.
        Advisory only: does NOT modify transaction or listing prices.
        """
        base_insight = PriceEngine.get_price_insight(crop, region, listing_price)
        if not base_insight or not base_insight.get('has_reference'):
            return {
                'has_reference': False,
                'disclaimer': 'Insufficient historical reference data available for this crop/region.'
            }

        from services.ai.gemini_client import gemini_client
        from services.ai.schemas import PRICING_INSIGHT_SCHEMA
        from services.ai.prompts import SYSTEM_PRICING_INTELLIGENCE

        if gemini_client.is_available():
            facts = {
                "crop": crop,
                "region": region,
                "listing_price_inr": listing_price,
                "reference_min": base_insight['min_price'],
                "reference_max": base_insight['max_price'],
                "reference_status": base_insight['status']
            }
            res = gemini_client.generate_structured(
                prompt=f"Generate fair pricing advisory insight for this produce quote:\n{facts}",
                schema=PRICING_INSIGHT_SCHEMA,
                system_instruction=SYSTEM_PRICING_INTELLIGENCE
            )
            if res.get('success') and res.get('data'):
                base_insight['ai_pricing_intelligence'] = res['data']

        return base_insight

