from datetime import datetime, date
from database import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'farmer', 'buyer', 'admin'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    farmer_profile = db.relationship('FarmerProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    buyer_profile = db.relationship('BuyerProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    listings = db.relationship('ProduceListing', back_populates='farmer', cascade='all, delete-orphan')
    purchase_requests = db.relationship('PurchaseRequest', back_populates='buyer', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', back_populates='user', cascade='all, delete-orphan', order_by='Notification.created_at.desc()')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if self.role == 'farmer' and self.farmer_profile:
            data['farmer_profile'] = self.farmer_profile.to_dict()
        elif self.role == 'buyer' and self.buyer_profile:
            data['buyer_profile'] = self.buyer_profile.to_dict()
        return data


class FarmerProfile(db.Model):
    __tablename__ = 'farmer_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    farm_name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    farm_size = db.Column(db.String(50), nullable=True)
    primary_crops = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='farmer_profile')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'farm_name': self.farm_name,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'farm_size': self.farm_size,
            'primary_crops': self.primary_crops,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BuyerProfile(db.Model):
    __tablename__ = 'buyer_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    business_name = db.Column(db.String(150), nullable=False)
    buyer_type = db.Column(db.String(50), nullable=False)  # Restaurant, Retailer, Wholesaler, Food Processor
    location = db.Column(db.String(150), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='buyer_profile')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_name': self.business_name,
            'buyer_type': self.buyer_type,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProduceListing(db.Model):
    __tablename__ = 'produce_listings'

    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    crop = db.Column(db.String(100), nullable=False, index=True)
    quantity = db.Column(db.Float, nullable=False)
    available_quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='kg', nullable=False)
    expected_price = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(150), nullable=False, index=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    availability_date = db.Column(db.Date, nullable=False)
    quality_grade = db.Column(db.String(50), nullable=False)  # Grade A, Grade B, Organic, etc.
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default='ACTIVE', nullable=False)  # ACTIVE, PAUSED, SOLD, EXPIRED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farmer = db.relationship('User', back_populates='listings')
    purchase_requests = db.relationship('PurchaseRequest', back_populates='listing', cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='listing')

    def to_dict(self, include_farmer=True):
        data = {
            'id': self.id,
            'farmer_id': self.farmer_id,
            'crop': self.crop,
            'quantity': self.quantity,
            'available_quantity': self.available_quantity,
            'unit': self.unit,
            'expected_price': self.expected_price,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'availability_date': self.availability_date.isoformat() if isinstance(self.availability_date, (date, datetime)) else str(self.availability_date),
            'quality_grade': self.quality_grade,
            'description': self.description,
            'image_url': self.image_url,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_farmer and self.farmer:
            data['farmer_name'] = self.farmer.name
            data['farm_name'] = self.farmer.farmer_profile.farm_name if self.farmer.farmer_profile else self.farmer.name
            data['farmer_phone'] = self.farmer.phone
        return data


class PurchaseRequest(db.Model):
    __tablename__ = 'purchase_requests'

    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('produce_listings.id'), nullable=False)
    requested_quantity = db.Column(db.Float, nullable=False)
    offered_price = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='PENDING', nullable=False)  # PENDING, ACCEPTED, REJECTED, NEGOTIATING, CANCELLED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    buyer = db.relationship('User', back_populates='purchase_requests')
    listing = db.relationship('ProduceListing', back_populates='purchase_requests')
    negotiations = db.relationship('Negotiation', back_populates='request', cascade='all, delete-orphan', order_by='Negotiation.created_at.asc()')
    order = db.relationship('Order', back_populates='purchase_request', uselist=False)

    def to_dict(self, include_details=True):
        data = {
            'id': self.id,
            'buyer_id': self.buyer_id,
            'listing_id': self.listing_id,
            'requested_quantity': self.requested_quantity,
            'offered_price': self.offered_price,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_details:
            if self.buyer:
                data['buyer_name'] = self.buyer.name
                data['buyer_business'] = self.buyer.buyer_profile.business_name if self.buyer.buyer_profile else self.buyer.name
                data['buyer_type'] = self.buyer.buyer_profile.buyer_type if self.buyer.buyer_profile else None
                data['buyer_location'] = self.buyer.buyer_profile.location if self.buyer.buyer_profile else None
            if self.listing:
                data['crop'] = self.listing.crop
                data['unit'] = self.listing.unit
                data['farmer_id'] = self.listing.farmer_id
                data['farmer_listed_price'] = self.listing.expected_price
                data['listing_available_quantity'] = self.listing.available_quantity
                data['listing_location'] = self.listing.location
                if self.listing.farmer:
                    data['farmer_name'] = self.listing.farmer.name
                    data['farm_name'] = self.listing.farmer.farmer_profile.farm_name if self.listing.farmer.farmer_profile else self.listing.farmer.name
            data['negotiation_count'] = len(self.negotiations)
            if self.order:
                data['order_id'] = self.order.id
                data['order_number'] = self.order.order_number
        return data


class Negotiation(db.Model):
    __tablename__ = 'negotiations'

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('purchase_requests.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender_role = db.Column(db.String(20), nullable=False)  # 'buyer', 'farmer'
    offered_price = db.Column(db.Float, nullable=False)
    offered_quantity = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='PENDING', nullable=False)  # PENDING, ACCEPTED, REJECTED, COUNTERED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    request = db.relationship('PurchaseRequest', back_populates='negotiations')
    sender = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else None,
            'sender_role': self.sender_role,
            'offered_price': self.offered_price,
            'offered_quantity': self.offered_quantity,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    purchase_request_id = db.Column(db.Integer, db.ForeignKey('purchase_requests.id'), nullable=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('produce_listings.id'), nullable=False)
    crop = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    agreed_price = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), default='CONFIRMED', nullable=False)  # CONFIRMED, PICKUP_SCHEDULED, IN_TRANSIT, DELIVERED, CANCELLED
    pickup_date = db.Column(db.Date, nullable=True)
    estimated_delivery_date = db.Column(db.Date, nullable=True)
    actual_delivery_date = db.Column(db.Date, nullable=True)
    distance_km = db.Column(db.Float, nullable=True)
    estimated_transport_cost = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    purchase_request = db.relationship('PurchaseRequest', back_populates='order')
    farmer = db.relationship('User', foreign_keys=[farmer_id])
    buyer = db.relationship('User', foreign_keys=[buyer_id])
    listing = db.relationship('ProduceListing', back_populates='orders')
    status_history = db.relationship('OrderStatusHistory', back_populates='order', cascade='all, delete-orphan', order_by='OrderStatusHistory.created_at.asc()')

    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'purchase_request_id': self.purchase_request_id,
            'farmer_id': self.farmer_id,
            'farmer_name': self.farmer.name if self.farmer else None,
            'farm_name': self.farmer.farmer_profile.farm_name if self.farmer and self.farmer.farmer_profile else (self.farmer.name if self.farmer else None),
            'farmer_location': self.farmer.farmer_profile.location if self.farmer and self.farmer.farmer_profile else None,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer.name if self.buyer else None,
            'buyer_business': self.buyer.buyer_profile.business_name if self.buyer and self.buyer.buyer_profile else (self.buyer.name if self.buyer else None),
            'buyer_location': self.buyer.buyer_profile.location if self.buyer and self.buyer.buyer_profile else None,
            'listing_id': self.listing_id,
            'crop': self.crop,
            'quantity': self.quantity,
            'agreed_price': self.agreed_price,
            'total_amount': self.total_amount,
            'status': self.status,
            'pickup_date': self.pickup_date.isoformat() if isinstance(self.pickup_date, (date, datetime)) else str(self.pickup_date) if self.pickup_date else None,
            'estimated_delivery_date': self.estimated_delivery_date.isoformat() if isinstance(self.estimated_delivery_date, (date, datetime)) else str(self.estimated_delivery_date) if self.estimated_delivery_date else None,
            'actual_delivery_date': self.actual_delivery_date.isoformat() if isinstance(self.actual_delivery_date, (date, datetime)) else str(self.actual_delivery_date) if self.actual_delivery_date else None,
            'distance_km': self.distance_km,
            'estimated_transport_cost': self.estimated_transport_cost,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'history': [h.to_dict() for h in self.status_history] if self.status_history else []
        }


class OrderStatusHistory(db.Model):
    __tablename__ = 'order_status_history'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    status = db.Column(db.String(30), nullable=False)
    note = db.Column(db.Text, nullable=True)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order = db.relationship('Order', back_populates='status_history')
    updater = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'status': self.status,
            'note': self.note,
            'updated_by': self.updated_by,
            'updated_by_name': self.updater.name if self.updater else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PriceReference(db.Model):
    __tablename__ = 'price_reference'

    id = db.Column(db.Integer, primary_key=True)
    crop = db.Column(db.String(100), nullable=False, index=True)
    region = db.Column(db.String(100), nullable=False, index=True)
    min_price = db.Column(db.Float, nullable=False)
    max_price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='kg', nullable=False)
    reference_date = db.Column(db.Date, nullable=False)
    source_type = db.Column(db.String(20), default='DEMO', nullable=False)  # DEMO, HISTORICAL

    def to_dict(self):
        return {
            'id': self.id,
            'crop': self.crop,
            'region': self.region,
            'min_price': self.min_price,
            'max_price': self.max_price,
            'unit': self.unit,
            'reference_date': self.reference_date.isoformat() if isinstance(self.reference_date, (date, datetime)) else str(self.reference_date),
            'source_type': self.source_type
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'link': self.link,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
