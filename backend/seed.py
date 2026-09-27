from datetime import datetime, date, timedelta
from flask import current_app
from database import db
from models import (
    User, FarmerProfile, BuyerProfile, ProduceListing, PurchaseRequest, Negotiation,
    Order, OrderStatusHistory, PriceReference, Notification,
    SoilProfile, CropHistory, FarmExpense, FarmerPerformance, BuyerPerformance,
    QualityInspection, WasteListing, WasteOrder, AnomalyEvent, CropMarketHistory
)

from sqlalchemy import text, inspect

def ensure_schema_columns():
    try:
        inspector = inspect(db.engine)
        if 'quality_inspections' in inspector.get_table_names():
            existing_cols = {c['name'] for c in inspector.get_columns('quality_inspections')}
            new_cols = [
                ('expected_crop', 'VARCHAR(100)'),
                ('detected_crop', 'VARCHAR(100)'),
                ('crop_confidence', 'FLOAT DEFAULT 0.0'),
                ('image_quality_status', "VARCHAR(50) DEFAULT 'VALID'"),
                ('visible_defect_level', "VARCHAR(50) DEFAULT 'LOW'"),
                ('defect_confidence', 'FLOAT DEFAULT 0.0'),
                ('model_name', "VARCHAR(100) DEFAULT 'FarmDirect-AgriVision-ColorTextureEngine'"),
                ('model_version', "VARCHAR(50) DEFAULT '2.0.0'")
            ]
            with db.engine.connect() as conn:
                for col_name, col_type in new_cols:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE quality_inspections ADD COLUMN {col_name} {col_type}"))
                conn.commit()
    except Exception as e:
        print(f"Schema verification note: {e}")

def _execute_seed_logic():
    with db.session.no_autoflush:
        print("Ensuring database tables exist (idempotent seed)...")
        # NEVER call db.drop_all() in production or idempotent seeding!
        db.create_all()
        ensure_schema_columns()

        print("Checking & seeding baseline users...")
        # Helper to get or create demo user
        def get_or_create_user(name, email, phone, role, password):
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(name=name, email=email, phone=phone, role=role)
                user.set_password(password)
                db.session.add(user)
                db.session.flush()
                print(f"Created demo user: {email} ({role})")
            return user

        # 1. Admin
        admin = get_or_create_user("System Administrator", "admin@farmdirect.demo", "+91 98765 43210", "admin", "admin123")

        # 2. Farmers
        f1 = get_or_create_user("Rajesh Patil", "farmer@farmdirect.demo", "+91 98220 11223", "farmer", "password123")
        if not FarmerProfile.query.filter_by(user_id=f1.id).first():
            db.session.add(FarmerProfile(user_id=f1.id, farm_name="Rajesh Farms", location="Pune", latitude=18.5204, longitude=73.8567, farm_size="25 acres", primary_crops="Tomato, Onion, Potato"))

        f2 = get_or_create_user("Suresh Deshmukh", "greenvalley@farmdirect.demo", "+91 98220 22334", "farmer", "password123")
        if not FarmerProfile.query.filter_by(user_id=f2.id).first():
            db.session.add(FarmerProfile(user_id=f2.id, farm_name="Green Valley Farm", location="Nashik", latitude=19.9975, longitude=73.7898, farm_size="40 acres", primary_crops="Onion, Tomato, Grapes"))

        f3 = get_or_create_user("Anand Shinde", "shivneri@farmdirect.demo", "+91 98220 33445", "farmer", "password123")
        if not FarmerProfile.query.filter_by(user_id=f3.id).first():
            db.session.add(FarmerProfile(user_id=f3.id, farm_name="Shivneri Agro", location="Satara", latitude=17.6805, longitude=74.0183, farm_size="30 acres", primary_crops="Potato, Carrot, Cabbage"))

        f4 = get_or_create_user("Vikram Jadhav", "sahyadri@farmdirect.demo", "+91 98220 44556", "farmer", "password123")
        if not FarmerProfile.query.filter_by(user_id=f4.id).first():
            db.session.add(FarmerProfile(user_id=f4.id, farm_name="Sahyadri Organics", location="Ahmednagar", latitude=19.0952, longitude=74.7496, farm_size="50 acres", primary_crops="Wheat, Maize, Organic Capsicum"))

        f5 = get_or_create_user("Ramesh Kadam", "maharashtra@farmdirect.demo", "+91 98220 55667", "farmer", "password123")
        if not FarmerProfile.query.filter_by(user_id=f5.id).first():
            db.session.add(FarmerProfile(user_id=f5.id, farm_name="Maharashtra Fresh", location="Sangli", latitude=16.8524, longitude=74.5815, farm_size="35 acres", primary_crops="Rice, Wheat, Cauliflower"))

        # 3. Buyers
        b1 = get_or_create_user("ABC Procurement Team", "buyer@farmdirect.demo", "+91 98330 11223", "buyer", "password123")
        if not BuyerProfile.query.filter_by(user_id=b1.id).first():
            db.session.add(BuyerProfile(user_id=b1.id, business_name="ABC Restaurant", buyer_type="Restaurant", location="Pune", latitude=18.5204, longitude=73.8567))

        b2 = get_or_create_user("Pooja Sharma", "freshmart@farmdirect.demo", "+91 98330 22334", "buyer", "password123")
        if not BuyerProfile.query.filter_by(user_id=b2.id).first():
            db.session.add(BuyerProfile(user_id=b2.id, business_name="FreshMart Retail", buyer_type="Retailer", location="Mumbai", latitude=19.0760, longitude=72.8777))

        b3 = get_or_create_user("Nitin Kulkarni", "processors@farmdirect.demo", "+91 98330 33445", "buyer", "password123")
        if not BuyerProfile.query.filter_by(user_id=b3.id).first():
            db.session.add(BuyerProfile(user_id=b3.id, business_name="Pune Food Processors", buyer_type="Food Processor", location="Pune", latitude=18.5204, longitude=73.8567))

        b4 = get_or_create_user("Manoj Agarwal", "greenbasket@farmdirect.demo", "+91 98330 44556", "buyer", "password123")
        if not BuyerProfile.query.filter_by(user_id=b4.id).first():
            db.session.add(BuyerProfile(user_id=b4.id, business_name="Green Basket Wholesale", buyer_type="Wholesaler", location="Nashik", latitude=19.9975, longitude=73.7898))

        b5 = get_or_create_user("Sunil More", "cityfresh@farmdirect.demo", "+91 98330 55667", "buyer", "password123")
        if not BuyerProfile.query.filter_by(user_id=b5.id).first():
            db.session.add(BuyerProfile(user_id=b5.id, business_name="CityFresh Market", buyer_type="Retailer", location="Satara", latitude=17.6805, longitude=74.0183))

        db.session.commit()
        print("Users and Profiles verified/seeded.")

        # Price Reference Benchmarks
        if PriceReference.query.count() == 0:
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

        # Produce Listings
        demo_tomato = ProduceListing.query.filter_by(farmer_id=f1.id, crop="Tomato").first()
        if not demo_tomato:
            print("Seeding Produce Listings...")
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

        # Baseline Historical Orders
        if Order.query.filter_by(order_number="FD-2026-00000").first() is None:
            print("Seeding Baseline Historical Orders & Dashboard Records...")
            demo_tomato = ProduceListing.query.filter_by(farmer_id=f1.id, crop="Tomato").first()
            onion_listing = ProduceListing.query.filter_by(farmer_id=f2.id, crop="Onion").first()
            past_order1 = Order(
                order_number="FD-2026-00000",
                purchase_request_id=None,
                farmer_id=f1.id,
                buyer_id=b3.id,  # Pune Food Processors
                listing_id=demo_tomato.id if demo_tomato else None,
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

            if onion_listing:
                past_order2 = Order(
                    order_number="FD-2026-00002",
                    purchase_request_id=None,
                    farmer_id=f2.id,
                    buyer_id=b2.id,  # FreshMart
                    listing_id=onion_listing.id,
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

        # Soil Profiles
        if SoilProfile.query.filter_by(farmer_id=f1.id).first() is None:
            print("Seeding Farm Digital Twin: Soil Profiles & Crop Histories...")
            sp1 = SoilProfile(farmer_id=f1.id, soil_type="Black Regur Soil (Vertisol)", ph_level=7.2, organic_carbon_pct=0.74, nitrogen_kg_ha=250.0, phosphorus_kg_ha=24.0, potassium_kg_ha=330.0, moisture_pct=26.0, last_tested_date=date.today() - timedelta(days=45))
            sp2 = SoilProfile(farmer_id=f2.id, soil_type="Fertile Alluvial Clay Loam", ph_level=6.9, organic_carbon_pct=0.81, nitrogen_kg_ha=270.0, phosphorus_kg_ha=28.0, potassium_kg_ha=350.0, moisture_pct=28.0, last_tested_date=date.today() - timedelta(days=60))
            sp3 = SoilProfile(farmer_id=f3.id, soil_type="Mountainous Red Loam", ph_level=6.6, organic_carbon_pct=0.65, nitrogen_kg_ha=220.0, phosphorus_kg_ha=19.0, potassium_kg_ha=290.0, moisture_pct=24.0, last_tested_date=date.today() - timedelta(days=30))
            sp4 = SoilProfile(farmer_id=f4.id, soil_type="Semi-Arid Sandy Clay Loam", ph_level=7.4, organic_carbon_pct=0.60, nitrogen_kg_ha=210.0, phosphorus_kg_ha=20.0, potassium_kg_ha=310.0, moisture_pct=22.0, last_tested_date=date.today() - timedelta(days=75))
            sp5 = SoilProfile(farmer_id=f5.id, soil_type="Krishna River Alluvial Basin", ph_level=7.0, organic_carbon_pct=0.78, nitrogen_kg_ha=260.0, phosphorus_kg_ha=26.0, potassium_kg_ha=340.0, moisture_pct=30.0, last_tested_date=date.today() - timedelta(days=20))
            db.session.add_all([sp1, sp2, sp3, sp4, sp5])

            ch1 = CropHistory(farmer_id=f1.id, crop="Tomato", season="Kharif 2025", year=2025, planted_area_acres=4.0, yield_kg=16000.0, selling_price_avg=26.50, gross_revenue=424000.0, cultivation_cost=168000.0)
            ch2 = CropHistory(farmer_id=f1.id, crop="Onion", season="Rabi 2024-25", year=2024, planted_area_acres=6.0, yield_kg=21000.0, selling_price_avg=22.00, gross_revenue=462000.0, cultivation_cost=190000.0)
            ch3 = CropHistory(farmer_id=f2.id, crop="Grapes", season="Rabi 2024-25", year=2024, planted_area_acres=8.0, yield_kg=32000.0, selling_price_avg=65.00, gross_revenue=2080000.0, cultivation_cost=840000.0)
            ch4 = CropHistory(farmer_id=f2.id, crop="Onion", season="Kharif 2025", year=2025, planted_area_acres=5.0, yield_kg=18000.0, selling_price_avg=24.00, gross_revenue=432000.0, cultivation_cost=160000.0)
            ch5 = CropHistory(farmer_id=f3.id, crop="Potato", season="Rabi 2024-25", year=2024, planted_area_acres=5.0, yield_kg=25000.0, selling_price_avg=19.50, gross_revenue=487500.0, cultivation_cost=195000.0)
            ch6 = CropHistory(farmer_id=f4.id, crop="Wheat", season="Rabi 2024-25", year=2024, planted_area_acres=10.0, yield_kg=35000.0, selling_price_avg=28.00, gross_revenue=980000.0, cultivation_cost=380000.0)
            ch7 = CropHistory(farmer_id=f5.id, crop="Cauliflower", season="Kharif 2025", year=2025, planted_area_acres=4.0, yield_kg=14000.0, selling_price_avg=21.00, gross_revenue=294000.0, cultivation_cost=120000.0)
            db.session.add_all([ch1, ch2, ch3, ch4, ch5, ch6, ch7])

            exp1 = FarmExpense(farmer_id=f1.id, category="Seeds & Saplings", amount=24000.0, expense_date=date.today() - timedelta(days=90), description="Certified hybrid tomato seeds (Abhinav variety)")
            exp2 = FarmExpense(farmer_id=f1.id, category="Organic Fertilizers & Bio-inputs", amount=38000.0, expense_date=date.today() - timedelta(days=60), description="Enriched vermicompost and neem cake bio-manure")
            exp3 = FarmExpense(farmer_id=f1.id, category="Micro-irrigation & Power", amount=16500.0, expense_date=date.today() - timedelta(days=40), description="Drip line lateral replacement and pump maintenance")
            exp4 = FarmExpense(farmer_id=f1.id, category="Harvesting Labor", amount=42000.0, expense_date=date.today() - timedelta(days=10), description="Manual early-morning harvesting and crate sorting")
            db.session.add_all([exp1, exp2, exp3, exp4])
            db.session.commit()

        # Performance & Trust Records
        if FarmerPerformance.query.filter_by(farmer_id=f1.id).first() is None:
            print("Seeding Trust & Performance Benchmarks...")
            tp1 = FarmerPerformance(farmer_id=f1.id, order_completion_rate=98.5, on_time_delivery_rate=96.0, quantity_accuracy_score=98.0, quality_consistency_score=95.0, cancellation_rate=1.5, dispute_count=0, avg_response_hours=1.4, reliability_tier="Elite 5-Star Pro")
            tp2 = FarmerPerformance(farmer_id=f2.id, order_completion_rate=97.0, on_time_delivery_rate=94.0, quantity_accuracy_score=96.0, quality_consistency_score=93.0, cancellation_rate=2.0, dispute_count=0, avg_response_hours=2.1, reliability_tier="Verified Pro")
            tp3 = FarmerPerformance(farmer_id=f3.id, order_completion_rate=96.0, on_time_delivery_rate=92.0, quantity_accuracy_score=95.0, quality_consistency_score=91.0, cancellation_rate=3.0, dispute_count=0, avg_response_hours=2.8, reliability_tier="Standard Reliable")
            tp4 = FarmerPerformance(farmer_id=f4.id, order_completion_rate=99.0, on_time_delivery_rate=98.0, quantity_accuracy_score=99.0, quality_consistency_score=97.0, cancellation_rate=0.5, dispute_count=0, avg_response_hours=1.1, reliability_tier="Elite 5-Star Pro")
            tp5 = FarmerPerformance(farmer_id=f5.id, order_completion_rate=95.0, on_time_delivery_rate=93.0, quantity_accuracy_score=94.0, quality_consistency_score=90.0, cancellation_rate=3.5, dispute_count=0, avg_response_hours=3.2, reliability_tier="Standard Reliable")
            db.session.add_all([tp1, tp2, tp3, tp4, tp5])

            bp1 = BuyerPerformance(buyer_id=b1.id, order_completion_rate=99.2, cancellation_rate=0.8, avg_response_hours=1.5, dispute_count=0, reliability_tier="Verified Prime Commercial Buyer")
            bp2 = BuyerPerformance(buyer_id=b2.id, order_completion_rate=98.0, cancellation_rate=1.8, avg_response_hours=2.2, dispute_count=0, reliability_tier="Verified Commercial Buyer")
            db.session.add_all([bp1, bp2])
            db.session.commit()

        # Quality Inspections
        if QualityInspection.query.count() == 0:
            print("Seeding Computer-Vision Quality Assessments...")
            demo_tomato = ProduceListing.query.filter_by(farmer_id=f1.id, crop="Tomato").first()
            onion_listing = ProduceListing.query.filter_by(farmer_id=f1.id, crop="Onion").first()
            f2_tomato = ProduceListing.query.filter_by(farmer_id=f2.id, crop="Tomato").first()

            qi1 = QualityInspection(
                listing_id=demo_tomato.id if demo_tomato else None,
                farmer_id=f1.id,
                image_url="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600",
                declared_grade="Grade A",
                ai_assessed_grade="Grade A",
                expected_crop="Tomato",
                detected_crop="Tomato",
                crop_confidence=98.5,
                image_quality_status="VALID",
                visible_defect_level="LOW",
                defect_confidence=95.0,
                model_name="FarmDirect-AgriVision-ColorTextureEngine",
                model_version="2.0.0",
                ripeness_pct=89.5,
                uniformity_score=94.0,
                defect_detected_pct=2.5,
                confidence_score=96.2,
                verification_status="VERIFIED_ALIGNED",
                assessment_notes="Uniform vibrant red skin, solid firmness, zero visible blemishes or pest indentations. Caliber 65-70mm consistent.",
                disclaimer="AI-assisted visual quality assessment. Not certified laboratory inspection."
            )
            qi2 = QualityInspection(
                listing_id=onion_listing.id if onion_listing else None,
                farmer_id=f1.id,
                image_url="https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600",
                declared_grade="Grade A",
                ai_assessed_grade="Grade A-",
                expected_crop="Onion",
                detected_crop="Onion",
                crop_confidence=97.0,
                image_quality_status="VALID",
                visible_defect_level="LOW",
                defect_confidence=94.0,
                model_name="FarmDirect-AgriVision-ColorTextureEngine",
                model_version="2.0.0",
                ripeness_pct=92.0,
                uniformity_score=88.0,
                defect_detected_pct=4.1,
                confidence_score=91.8,
                verification_status="VERIFIED_ALIGNED",
                assessment_notes="Dry tight outer skin, uniform red globes. Slight size dispersion (+/- 8mm) but well within commercial Grade A norms.",
                disclaimer="AI-assisted visual quality assessment. Not certified laboratory inspection."
            )
            qi3 = QualityInspection(
                listing_id=f2_tomato.id if f2_tomato else None,
                farmer_id=f2.id,
                image_url="https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600",
                declared_grade="Grade B",
                ai_assessed_grade="Grade B",
                expected_crop="Tomato",
                detected_crop="Tomato",
                crop_confidence=96.0,
                image_quality_status="VALID",
                visible_defect_level="MODERATE",
                defect_confidence=92.0,
                model_name="FarmDirect-AgriVision-ColorTextureEngine",
                model_version="2.0.0",
                ripeness_pct=95.0,
                uniformity_score=82.0,
                defect_detected_pct=7.8,
                confidence_score=93.5,
                verification_status="VERIFIED_ALIGNED",
                assessment_notes="Deep red processing-stage maturity. Minor skin scars not affecting pulp or brix content. Excellent for sauce processing.",
                disclaimer="AI-assisted visual quality assessment. Not certified laboratory inspection."
            )
            db.session.add_all([qi1, qi2, qi3])
            db.session.commit()

        # Waste Listings
        if WasteListing.query.count() == 0:
            print("Seeding Farm Waste Marketplace...")
            wl1 = WasteListing(
                farmer_id=f1.id,
                waste_type="Sugarcane Bagasse & Dry Biomass",
                quantity=15.0,
                unit="tonnes",
                asking_price=1400.0,
                location="Pune",
                latitude=18.5204,
                longitude=73.8567,
                description="Sun-dried fibrous sugarcane residue from organic farm crusher. High calorific density, clean and dry for biomass briquetting, boiler fuel, or particle board manufacturing.",
                suggested_uses="Biomass Briquettes, Boiler Fuel, Paper Pulp, Composting",
                image_url="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=600",
                status="ACTIVE"
            )
            wl2 = WasteListing(
                farmer_id=f4.id,
                waste_type="Golden Wheat Straw Bales",
                quantity=25.0,
                unit="tonnes",
                asking_price=1850.0,
                location="Ahmednagar",
                latitude=19.0952,
                longitude=74.7496,
                description="Machine-baled golden wheat straw with <12% moisture. Ideal for dairy farm fodder mixing, mushroom cultivation substrate, or ecological mulching.",
                suggested_uses="Cattle Fodder, Mushroom Cultivation, Mulch, Packaging",
                image_url="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
                status="ACTIVE"
            )
            wl3 = WasteListing(
                farmer_id=f2.id,
                waste_type="Tomato Pomace & Organic Seeds",
                quantity=8.0,
                unit="tonnes",
                asking_price=950.0,
                location="Nashik",
                latitude=19.9975,
                longitude=73.7898,
                description="Freshly separated tomato skins and seeds from food processing sorting. Rich in crude protein and lycopene for livestock feed supplementation.",
                suggested_uses="Livestock Feed, Vermicompost Booster, Soil Conditioning",
                image_url="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600",
                status="ACTIVE"
            )
            wl4 = WasteListing(
                farmer_id=f5.id,
                waste_type="Organic Rice Husk & Ash Precursor",
                quantity=30.0,
                unit="tonnes",
                asking_price=1200.0,
                location="Sangli",
                latitude=16.8524,
                longitude=74.5815,
                description="Clean de-husked golden paddy husks from Krishna river rice mills. Uniform consistency suitable for insulation, silica synthesis, or nursery bedding.",
                suggested_uses="Thermal Insulation, Industrial Silica, Nursery Pot Bedding",
                image_url="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
                status="ACTIVE"
            )
            db.session.add_all([wl1, wl2, wl3, wl4])
            db.session.commit()

        # Regional Demand Intelligence
        if CropMarketHistory.query.count() == 0:
            print("Seeding Regional Demand Intelligence & Anomalies...")
            cmh1 = CropMarketHistory(crop="Tomato", region="Pune", demand_index=88.0, trend="INCREASING", forecast_7d_pct=12.5, forecast_14d_pct=18.0, avg_price=27.80, volume_traded_kg=45000.0, snapshot_date=date.today(), explanation="Buyer procurement request volume increased by 22% over past 10 days driven by hospitality corridor demand.")
            cmh2 = CropMarketHistory(crop="Tomato", region="Nashik", demand_index=82.0, trend="INCREASING", forecast_7d_pct=9.0, forecast_14d_pct=14.5, avg_price=25.20, volume_traded_kg=38000.0, snapshot_date=date.today(), explanation="Processing-grade tomato demand solid from Mumbai puree manufacturers.")
            cmh3 = CropMarketHistory(crop="Onion", region="Nashik", demand_index=94.0, trend="INCREASING", forecast_7d_pct=15.0, forecast_14d_pct=22.0, avg_price=24.50, volume_traded_kg=82000.0, snapshot_date=date.today(), explanation="Export procurement channels active; mandi arrivals tightening post-monsoon.")
            cmh4 = CropMarketHistory(crop="Potato", region="Satara", demand_index=72.0, trend="STABLE", forecast_7d_pct=3.0, forecast_14d_pct=5.0, avg_price=20.00, volume_traded_kg=29000.0, snapshot_date=date.today(), explanation="Balanced local demand and stable cold-storage inventory releases.")
            cmh5 = CropMarketHistory(crop="Wheat", region="Ahmednagar", demand_index=78.0, trend="STABLE", forecast_7d_pct=2.0, forecast_14d_pct=4.0, avg_price=28.50, volume_traded_kg=54000.0, snapshot_date=date.today(), explanation="Steady flour mill off-take maintaining equilibrium.")
            cmh6 = CropMarketHistory(crop="Cauliflower", region="Sangli", demand_index=65.0, trend="DECREASING", forecast_7d_pct=-4.0, forecast_14d_pct=-7.5, avg_price=23.00, volume_traded_kg=19000.0, snapshot_date=date.today(), explanation="Seasonal harvest peaks across adjacent talukas expanding immediate wholesale supply.")
            db.session.add_all([cmh1, cmh2, cmh3, cmh4, cmh5, cmh6])

        # Anomaly Events
        if AnomalyEvent.query.count() == 0:
            ae1 = AnomalyEvent(entity_type="LISTING", entity_id=1, anomaly_type="PRICE_OUTLIER", severity="LOW", title="Minor Price Premium on Organic Produce", details="Listing price is ₹28/kg while historical baseline is ₹27.50/kg. Within standard acceptable variance for certified quality.", status="RESOLVED", resolution_note="Verified as normal premium for certified organic produce.")
            ae2 = AnomalyEvent(entity_type="LISTING", entity_id=999, anomaly_type="PRICE_OUTLIER", severity="HIGH", title="Potential Price Outlier: Bell Pepper Offer", details="Observed quote ₹85/kg exceeds benchmark range (₹42–₹48/kg) by 81%. Flags automated caution before contract creation.", status="NEEDS_REVIEW")
            ae3 = AnomalyEvent(entity_type="ORDER", entity_id=101, anomaly_type="QUANTITY_SPIKE", severity="MEDIUM", title="Large Bulk Procurement Request", details="Single purchase request for 12,000 kg exceeds average buyer order size (1,800 kg) by 6.6x.", status="NEEDS_REVIEW")
            db.session.add_all([ae1, ae2, ae3])

        db.session.commit()
        print("Database seeding completed successfully (idempotent, safe for restarts)!")

def seed_database():
    if current_app:
        _execute_seed_logic()
    else:
        from app import create_app
        local_app = create_app()
        with local_app.app_context():
            _execute_seed_logic()

if __name__ == '__main__':
    seed_database()
