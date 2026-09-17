from datetime import datetime, date, timedelta
from app import create_app
from database import db
from models import User, FarmerProfile, BuyerProfile, ProduceListing, PurchaseRequest, Negotiation, Order, OrderStatusHistory, PriceReference, Notification

app = create_app()

def seed_database():
    with app.app_context():
        print("Clearing existing tables...")
        db.drop_all()
        db.create_all()

        print("Seeding Users...")
        # 1. Admin
        admin = User(name="System Administrator", email="admin@farmdirect.demo", phone="+91 98765 43210", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)

        # 2. Farmers
        f1 = User(name="Rajesh Patil", email="farmer@farmdirect.demo", phone="+91 98220 11223", role="farmer")
        f1.set_password("password123")
        db.session.add(f1)
        db.session.flush()
        p1 = FarmerProfile(user_id=f1.id, farm_name="Rajesh Farms", location="Pune", latitude=18.5204, longitude=73.8567, farm_size="25 acres", primary_crops="Tomato, Onion, Potato")
        db.session.add(p1)

        f2 = User(name="Suresh Deshmukh", email="greenvalley@farmdirect.demo", phone="+91 98220 22334", role="farmer")
        f2.set_password("password123")
        db.session.add(f2)
        db.session.flush()
        p2 = FarmerProfile(user_id=f2.id, farm_name="Green Valley Farm", location="Nashik", latitude=19.9975, longitude=73.7898, farm_size="40 acres", primary_crops="Onion, Tomato, Grapes")
        db.session.add(p2)

        f3 = User(name="Anand Shinde", email="shivneri@farmdirect.demo", phone="+91 98220 33445", role="farmer")
        f3.set_password("password123")
        db.session.add(f3)
        db.session.flush()
        p3 = FarmerProfile(user_id=f3.id, farm_name="Shivneri Agro", location="Satara", latitude=17.6805, longitude=74.0183, farm_size="30 acres", primary_crops="Potato, Carrot, Cabbage")
        db.session.add(p3)

        f4 = User(name="Vikram Jadhav", email="sahyadri@farmdirect.demo", phone="+91 98220 44556", role="farmer")
        f4.set_password("password123")
        db.session.add(f4)
        db.session.flush()
        p4 = FarmerProfile(user_id=f4.id, farm_name="Sahyadri Organics", location="Ahmednagar", latitude=19.0952, longitude=74.7496, farm_size="50 acres", primary_crops="Wheat, Maize, Organic Capsicum")
        db.session.add(p4)

        f5 = User(name="Ramesh Kadam", email="maharashtra@farmdirect.demo", phone="+91 98220 55667", role="farmer")
        f5.set_password("password123")
        db.session.add(f5)
        db.session.flush()
        p5 = FarmerProfile(user_id=f5.id, farm_name="Maharashtra Fresh", location="Sangli", latitude=16.8524, longitude=74.5815, farm_size="35 acres", primary_crops="Rice, Wheat, Cauliflower")
        db.session.add(p5)

        # 3. Buyers
        b1 = User(name="ABC Procurement Team", email="buyer@farmdirect.demo", phone="+91 98330 11223", role="buyer")
        b1.set_password("password123")
        db.session.add(b1)
        db.session.flush()
        bp1 = BuyerProfile(user_id=b1.id, business_name="ABC Restaurant", buyer_type="Restaurant", location="Pune", latitude=18.5204, longitude=73.8567)
        db.session.add(bp1)

        b2 = User(name="Pooja Sharma", email="freshmart@farmdirect.demo", phone="+91 98330 22334", role="buyer")
        b2.set_password("password123")
        db.session.add(b2)
        db.session.flush()
        bp2 = BuyerProfile(user_id=b2.id, business_name="FreshMart Retail", buyer_type="Retailer", location="Mumbai", latitude=19.0760, longitude=72.8777)
        db.session.add(bp2)

        b3 = User(name="Nitin Kulkarni", email="processors@farmdirect.demo", phone="+91 98330 33445", role="buyer")
        b3.set_password("password123")
        db.session.add(b3)
        db.session.flush()
        bp3 = BuyerProfile(user_id=b3.id, business_name="Pune Food Processors", buyer_type="Food Processor", location="Pune", latitude=18.5204, longitude=73.8567)
        db.session.add(bp3)

        b4 = User(name="Manoj Agarwal", email="greenbasket@farmdirect.demo", phone="+91 98330 44556", role="buyer")
        b4.set_password("password123")
        db.session.add(b4)
        db.session.flush()
        bp4 = BuyerProfile(user_id=b4.id, business_name="Green Basket Wholesale", buyer_type="Wholesaler", location="Nashik", latitude=19.9975, longitude=73.7898)
        db.session.add(bp4)

        b5 = User(name="Sunil More", email="cityfresh@farmdirect.demo", phone="+91 98330 55667", role="buyer")
        b5.set_password("password123")
        db.session.add(b5)
        db.session.flush()
        bp5 = BuyerProfile(user_id=b5.id, business_name="CityFresh Market", buyer_type="Retailer", location="Satara", latitude=17.6805, longitude=74.0183)
        db.session.add(bp5)

        db.session.commit()
        print("Users and Profiles seeded.")

        print("Seeding Price Reference Benchmarks...")
        prices = [
            # Tomato
            PriceReference(crop="Tomato", region="Pune", min_price=25.0, max_price=30.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Tomato", region="Nashik", min_price=22.0, max_price=28.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Tomato", region="Mumbai", min_price=28.0, max_price=34.0, reference_date=date(2026, 9, 15), source_type="HISTORICAL"),
            # Onion
            PriceReference(crop="Onion", region="Nashik", min_price=18.0, max_price=24.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Onion", region="Pune", min_price=20.0, max_price=26.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            # Potato
            PriceReference(crop="Potato", region="Satara", min_price=16.0, max_price=22.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Potato", region="Pune", min_price=18.0, max_price=24.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            # Wheat
            PriceReference(crop="Wheat", region="Ahmednagar", min_price=28.0, max_price=35.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Wheat", region="Pune", min_price=30.0, max_price=38.0, reference_date=date(2026, 9, 15), source_type="HISTORICAL"),
            # Rice
            PriceReference(crop="Rice", region="Sangli", min_price=45.0, max_price=58.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Rice", region="Pune", min_price=48.0, max_price=62.0, reference_date=date(2026, 9, 15), source_type="HISTORICAL"),
            # Cabbage
            PriceReference(crop="Cabbage", region="Satara", min_price=12.0, max_price=18.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Cabbage", region="Pune", min_price=14.0, max_price=20.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            # Capsicum
            PriceReference(crop="Capsicum", region="Ahmednagar", min_price=35.0, max_price=45.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Capsicum", region="Pune", min_price=38.0, max_price=48.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            # Carrot
            PriceReference(crop="Carrot", region="Satara", min_price=22.0, max_price=30.0, reference_date=date(2026, 9, 15), source_type="DEMO"),
            PriceReference(crop="Carrot", region="Pune", min_price=24.0, max_price=32.0, reference_date=date(2026, 9, 15), source_type="DEMO")
        ]
        db.session.add_all(prices)
        db.session.commit()
        print("Price benchmarks seeded.")

        print("Seeding Produce Listings...")
        # CRITICAL DEMO LISTING
        demo_tomato = ProduceListing(
            farmer_id=f1.id,
            crop="Tomato",
            quantity=2000.0,
            available_quantity=2000.0,
            unit="kg",
            expected_price=28.0,
            location="Pune",
            quality_grade="Grade A",
            availability_date=date(2026, 9, 20),
            description="Fresh farm-grown tomatoes suitable for restaurants and retailers. Uniform size, firm texture, deep red color, picked at peak freshness.",
            image_url="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
            status="ACTIVE"
        )
        db.session.add(demo_tomato)

        # Other listings
        other_listings = [
            ProduceListing(
                farmer_id=f1.id,
                crop="Onion",
                quantity=3000.0,
                available_quantity=3000.0,
                unit="kg",
                expected_price=22.0,
                location="Pune",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 25),
                description="Red Nashik-hybrid onions, well-cured and dry. Excellent shelf life.",
                image_url="https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f1.id,
                crop="Potato",
                quantity=4000.0,
                available_quantity=4000.0,
                unit="kg",
                expected_price=20.0,
                location="Pune",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 18),
                description="Jyoti variety table potatoes. Washed, disease-free, high starch content.",
                image_url="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f2.id,
                crop="Tomato",
                quantity=1200.0,
                available_quantity=1200.0,
                unit="kg",
                expected_price=25.0,
                location="Nashik",
                quality_grade="Grade B",
                availability_date=date(2026, 9, 21),
                description="Processing-grade ripe tomatoes. Best suited for puree, sauce, or curry bases.",
                image_url="https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f2.id,
                crop="Onion",
                quantity=5000.0,
                available_quantity=5000.0,
                unit="kg",
                expected_price=21.0,
                location="Nashik",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 19),
                description="Famous Lasalgaon/Nashik medium pink onions. Sorted and graded.",
                image_url="https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f3.id,
                crop="Potato",
                quantity=3500.0,
                available_quantity=3500.0,
                unit="kg",
                expected_price=18.0,
                location="Satara",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 22),
                description="Premium Satara plateau red soil potatoes. Crisp frying quality.",
                image_url="https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f3.id,
                crop="Carrot",
                quantity=1800.0,
                available_quantity=1800.0,
                unit="kg",
                expected_price=26.0,
                location="Satara",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 20),
                description="Crunchy, sweet orange carrots. Freshly harvested and trimmed.",
                image_url="https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f3.id,
                crop="Cabbage",
                quantity=2200.0,
                available_quantity=2200.0,
                unit="kg",
                expected_price=15.0,
                location="Satara",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 23),
                description="Firm green cabbage heads, 1.2kg to 1.8kg average size. Clean outer leaves.",
                image_url="https://images.unsplash.com/photo-1604544203292-0ec5a0248bf8?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f4.id,
                crop="Wheat",
                quantity=8000.0,
                available_quantity=8000.0,
                unit="kg",
                expected_price=32.0,
                location="Ahmednagar",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 15),
                description="Sharbati wheat grains, golden lustrous kernels, high protein content for baking.",
                image_url="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f4.id,
                crop="Capsicum",
                quantity=1500.0,
                available_quantity=1500.0,
                unit="kg",
                expected_price=40.0,
                location="Ahmednagar",
                quality_grade="Organic",
                availability_date=date(2026, 9, 24),
                description="Certified organic green bell peppers. Polyhouse cultivated, zero pesticide residue.",
                image_url="https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f4.id,
                crop="Maize",
                quantity=6000.0,
                available_quantity=6000.0,
                unit="kg",
                expected_price=23.0,
                location="Ahmednagar",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 28),
                description="Yellow feed and industrial grade maize grain. Low moisture under 12%.",
                image_url="https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f5.id,
                crop="Rice",
                quantity=5000.0,
                available_quantity=5000.0,
                unit="kg",
                expected_price=52.0,
                location="Sangli",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 16),
                description="Indrayani fragrant non-sticky rice. Traditional Krishna valley harvest.",
                image_url="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            ),
            ProduceListing(
                farmer_id=f5.id,
                crop="Cauliflower",
                quantity=2000.0,
                available_quantity=2000.0,
                unit="kg",
                expected_price=24.0,
                location="Sangli",
                quality_grade="Grade A",
                availability_date=date(2026, 9, 22),
                description="Compact snowy white curds with fresh green leaves. Harvested at sunrise.",
                image_url="https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80",
                status="ACTIVE"
            )
        ]
        db.session.add_all(other_listings)
        db.session.commit()
        print("Listings seeded.")

        print("Seeding Baseline Historical Orders & Dashboard Records...")
        # Create 2 completed past orders for Rajesh Farms so his charts look great from the start
        past_order1 = Order(
            order_number="FD-2026-00000",
            purchase_request_id=None,
            farmer_id=f1.id,
            buyer_id=b3.id,  # Pune Food Processors
            listing_id=demo_tomato.id,
            crop="Tomato",
            quantity=1000.0,
            agreed_price=27.0,
            total_amount=27000.0,
            status="DELIVERED",
            pickup_date=date.today() - timedelta(days=5),
            estimated_delivery_date=date.today() - timedelta(days=4),
            actual_delivery_date=date.today() - timedelta(days=4),
            distance_km=25.0,
            estimated_transport_cost=1275.0,
            created_at=datetime.utcnow() - timedelta(days=5)
        )
        db.session.add(past_order1)
        db.session.flush()

        h1 = OrderStatusHistory(order_id=past_order1.id, status="CONFIRMED", note="Initial order confirmed", updated_by=f1.id, created_at=datetime.utcnow() - timedelta(days=5))
        h2 = OrderStatusHistory(order_id=past_order1.id, status="DELIVERED", note="Delivered to factory warehouse", updated_by=f1.id, created_at=datetime.utcnow() - timedelta(days=4))
        db.session.add_all([h1, h2])

        # Another order for Green Valley Farm
        past_order2 = Order(
            order_number="FD-2026-00002",
            purchase_request_id=None,
            farmer_id=f2.id,
            buyer_id=b2.id,  # FreshMart
            listing_id=other_listings[1].id,  # Onion
            crop="Onion",
            quantity=2000.0,
            agreed_price=20.5,
            total_amount=41000.0,
            status="DELIVERED",
            pickup_date=date.today() - timedelta(days=3),
            estimated_delivery_date=date.today() - timedelta(days=2),
            actual_delivery_date=date.today() - timedelta(days=2),
            distance_km=165.0,
            estimated_transport_cost=6175.0,
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        db.session.add(past_order2)
        db.session.flush()

        h3 = OrderStatusHistory(order_id=past_order2.id, status="CONFIRMED", note="Bulk order confirmed", updated_by=f2.id, created_at=datetime.utcnow() - timedelta(days=3))
        h4 = OrderStatusHistory(order_id=past_order2.id, status="DELIVERED", note="Unloaded at Mumbai distribution center", updated_by=f2.id, created_at=datetime.utcnow() - timedelta(days=2))
        db.session.add_all([h3, h4])

        # Notifications
        n1 = Notification(
            user_id=f1.id,
            title="Welcome to FarmDirect!",
            message="Your farm profile is verified. Your Tomato listing (2,000 kg) is live on the marketplace.",
            type="welcome",
            link="/farmer/listings"
        )
        n2 = Notification(
            user_id=b1.id,
            title="Welcome to FarmDirect!",
            message="Discover fresh produce directly from farmers with our AI Smart Matching tool.",
            type="welcome",
            link="/buyer/smart-match"
        )
        db.session.add_all([n1, n2])

        db.session.commit()
        print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
