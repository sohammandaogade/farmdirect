from sqlalchemy import func
from database import db
from models import User, ProduceListing, PurchaseRequest, Order, OrderStatusHistory

class AnalyticsService:
    """
    Real-time database analytics service for Farmer, Buyer, and Admin dashboards.
    Calculates aggregated SQL metrics dynamically without hardcoded values.
    """

    @staticmethod
    def get_farmer_analytics(farmer_id):
        # Active listings count
        active_listings = ProduceListing.query.filter_by(farmer_id=farmer_id, status='ACTIVE').count()
        total_listings = ProduceListing.query.filter_by(farmer_id=farmer_id).count()

        # Orders for this farmer (exclude CANCELLED)
        farmer_orders = Order.query.filter(Order.farmer_id == farmer_id, Order.status != 'CANCELLED').all()
        
        active_orders = len([o for o in farmer_orders if o.status in ['CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT']])
        delivered_orders = [o for o in farmer_orders if o.status == 'DELIVERED']
        
        # Revenue & quantity sold: count confirmed and delivered orders
        total_revenue = sum(o.total_amount for o in farmer_orders)
        quantity_sold = sum(o.quantity for o in farmer_orders)

        # Sales by crop
        sales_by_crop = {}
        for o in farmer_orders:
            if o.crop not in sales_by_crop:
                sales_by_crop[o.crop] = {'crop': o.crop, 'revenue': 0.0, 'quantity': 0.0, 'orders': 0}
            sales_by_crop[o.crop]['revenue'] += o.total_amount
            sales_by_crop[o.crop]['quantity'] += o.quantity
            sales_by_crop[o.crop]['orders'] += 1

        # Revenue timeline (by date or month)
        revenue_timeline = {}
        for o in sorted(farmer_orders, key=lambda x: x.created_at):
            date_key = o.created_at.strftime('%d %b') if o.created_at else 'Recent'
            revenue_timeline[date_key] = revenue_timeline.get(date_key, 0.0) + o.total_amount

        timeline_data = [{'date': k, 'revenue': round(v, 2)} for k, v in revenue_timeline.items()]

        # Order status distribution
        all_orders_count = Order.query.filter_by(farmer_id=farmer_id).all()
        status_counts = {}
        for o in all_orders_count:
            status_counts[o.status] = status_counts.get(o.status, 0) + 1

        # Pending purchase requests
        pending_requests = PurchaseRequest.query.join(ProduceListing).filter(
            ProduceListing.farmer_id == farmer_id,
            PurchaseRequest.status.in_(['PENDING', 'NEGOTIATING'])
        ).count()

        return {
            'active_listings': active_listings,
            'total_listings': total_listings,
            'active_orders': active_orders,
            'total_orders': len(farmer_orders),
            'quantity_sold': round(quantity_sold, 1),
            'total_revenue': round(total_revenue, 2),
            'pending_requests': pending_requests,
            'sales_by_crop': list(sales_by_crop.values()),
            'revenue_timeline': timeline_data,
            'status_distribution': [{'status': k, 'count': v} for k, v in status_counts.items()]
        }

    @staticmethod
    def get_buyer_analytics(buyer_id):
        # Active requests
        active_requests = PurchaseRequest.query.filter(
            PurchaseRequest.buyer_id == buyer_id,
            PurchaseRequest.status.in_(['PENDING', 'NEGOTIATING'])
        ).count()

        # Buyer orders
        buyer_orders = Order.query.filter(Order.buyer_id == buyer_id, Order.status != 'CANCELLED').all()
        
        current_orders = len([o for o in buyer_orders if o.status in ['CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT']])
        total_spending = sum(o.total_amount for o in buyer_orders)
        total_quantity = sum(o.quantity for o in buyer_orders)

        # Spending by crop
        spending_by_crop = {}
        for o in buyer_orders:
            if o.crop not in spending_by_crop:
                spending_by_crop[o.crop] = {'crop': o.crop, 'spending': 0.0, 'quantity': 0.0, 'orders': 0}
            spending_by_crop[o.crop]['spending'] += o.total_amount
            spending_by_crop[o.crop]['quantity'] += o.quantity
            spending_by_crop[o.crop]['orders'] += 1

        # Calculate average purchase price by crop
        avg_prices = []
        for crop_data in spending_by_crop.values():
            avg_price = (crop_data['spending'] / crop_data['quantity']) if crop_data['quantity'] > 0 else 0
            avg_prices.append({
                'crop': crop_data['crop'],
                'avg_price': round(avg_price, 2),
                'quantity': crop_data['quantity']
            })

        # Spending timeline
        spending_timeline = {}
        for o in sorted(buyer_orders, key=lambda x: x.created_at):
            date_key = o.created_at.strftime('%d %b') if o.created_at else 'Recent'
            spending_timeline[date_key] = spending_timeline.get(date_key, 0.0) + o.total_amount

        timeline_data = [{'date': k, 'spending': round(v, 2)} for k, v in spending_timeline.items()]

        return {
            'active_requests': active_requests,
            'current_orders': current_orders,
            'total_orders': len(buyer_orders),
            'total_spending': round(total_spending, 2),
            'total_quantity': round(total_quantity, 1),
            'spending_by_crop': list(spending_by_crop.values()),
            'avg_prices_by_crop': avg_prices,
            'spending_timeline': timeline_data
        }

    @staticmethod
    def get_admin_analytics():
        total_farmers = User.query.filter_by(role='farmer').count()
        total_buyers = User.query.filter_by(role='buyer').count()
        total_users = total_farmers + total_buyers

        total_listings = ProduceListing.query.count()
        active_listings = ProduceListing.query.filter_by(status='ACTIVE').count()

        all_orders = Order.query.filter(Order.status != 'CANCELLED').all()
        total_orders = len(all_orders)
        total_traded_kg = sum(o.quantity for o in all_orders)
        total_gmv = sum(o.total_amount for o in all_orders)

        # Crop demand & trade volume
        crop_stats = {}
        for o in all_orders:
            if o.crop not in crop_stats:
                crop_stats[o.crop] = {'crop': o.crop, 'volume_kg': 0.0, 'gmv': 0.0, 'orders': 0}
            crop_stats[o.crop]['volume_kg'] += o.quantity
            crop_stats[o.crop]['gmv'] += o.total_amount
            crop_stats[o.crop]['orders'] += 1

        # Status counts
        status_counts = {}
        for o in Order.query.all():
            status_counts[o.status] = status_counts.get(o.status, 0) + 1

        # Regional trading distribution
        regions = {}
        for o in all_orders:
            loc = o.farmer.farmer_profile.location if o.farmer and o.farmer.farmer_profile else 'Other'
            regions[loc] = regions.get(loc, 0.0) + o.quantity

        regional_distribution = [{'region': k, 'volume_kg': round(v, 1)} for k, v in regions.items()]

        return {
            'total_farmers': total_farmers,
            'total_buyers': total_buyers,
            'total_users': total_users,
            'total_listings': total_listings,
            'active_listings': active_listings,
            'total_orders': total_orders,
            'total_quantity_traded': round(total_traded_kg, 1),
            'total_transaction_value': round(total_gmv, 2),
            'crop_stats': list(crop_stats.values()),
            'status_distribution': [{'status': k, 'count': v} for k, v in status_counts.items()],
            'regional_distribution': regional_distribution
        }

    @staticmethod
    def generate_executive_marketplace_summary():
        """
        Synthesizes raw database metrics into natural-language executive insights
        using Gemini, strictly grounded in actual database aggregations.
        """
        metrics = AnalyticsService.get_admin_analytics()

        from services.ai.gemini_client import gemini_client
        from services.ai.schemas import MARKETPLACE_ANALYTICS_SCHEMA
        from services.ai.prompts import SYSTEM_ANALYTICS_SUMMARIZER

        if gemini_client.is_available():
            facts = {
                "active_listings": metrics['active_listings'],
                "total_orders": metrics['total_orders'],
                "total_traded_kg": metrics['total_quantity_traded'],
                "total_gmv_inr": metrics['total_transaction_value'],
                "top_traded_crops": sorted(metrics['crop_stats'], key=lambda x: x['volume_kg'], reverse=True)[:4],
                "top_regions": sorted(metrics['regional_distribution'], key=lambda x: x['volume_kg'], reverse=True)[:4]
            }
            res = gemini_client.generate_structured(
                prompt=f"Generate executive agricultural marketplace insights from these real platform numbers:\n{facts}",
                schema=MARKETPLACE_ANALYTICS_SCHEMA,
                system_instruction=SYSTEM_ANALYTICS_SUMMARIZER
            )
            if res.get('success') and res.get('data'):
                metrics['ai_executive_summary'] = res['data']
                metrics['ai_executive_summary']['source'] = 'gemini_grounded'
                return metrics

        # Deterministic Ground-Truth Fallback
        top_crops = [c['crop'] for c in sorted(metrics['crop_stats'], key=lambda x: x['volume_kg'], reverse=True)[:3]]
        crop_text = ", ".join(top_crops) if top_crops else "commercial staples"
        summary_text = (
            f"The marketplace currently hosts {metrics['active_listings']} active harvest listings with {metrics['total_orders']} "
            f"confirmed transactions totaling {metrics['total_quantity_traded']:,.0f} kg and ₹{metrics['total_transaction_value']:,.2f} GMV. "
            f"Trading activity is predominantly centered around {crop_text}."
        )

        metrics['ai_executive_summary'] = {
            'executive_summary': summary_text,
            'key_demand_trends': [
                f"Total cumulative trade volume reached {metrics['total_quantity_traded']:,.0f} kg across {metrics['total_orders']} orders.",
                f"Active marketplace listings stand at {metrics['active_listings']} direct farm offers."
            ],
            'regional_observations': [
                f"Order fulfillment activity spans {len(metrics['regional_distribution'])} regional districts in Maharashtra."
            ],
            'actionable_recommendations': [
                "Encourage pre-harvest forward contracts for high-velocity crops.",
                "Promote quality inspection uploads to accelerate buyer checkout velocity."
            ],
            'source': 'deterministic_metrics'
        }
        return metrics

