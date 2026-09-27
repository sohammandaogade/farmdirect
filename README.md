# FarmDirect 🌾
### AI-Powered Agricultural Commerce & Supply Chain Intelligence Platform
**Hackathon Problem Statement: AG-03** — *Create a digital marketplace connecting farmers directly with buyers to reduce dependency on intermediaries.*

> 🚀 **FINAL PHASE COMPLETE**: FarmDirect has been upgraded with **23 integrated AI capabilities**, including Hybrid Matching, Farm Digital Twin, Computer-Vision Quality Assessment, Circular Farm Waste Marketplace, Multilingual Voice Assistant (English, Hindi, Marathi), Market Command Center, and What-If Simulator.
> 
> Detailed documentation is available in [FINAL_PHASE.md](FINAL_PHASE.md).

---

## 🌟 Overview & Core Idea

**FarmDirect** eliminates traditional agricultural middlemen by connecting farmers directly with commercial buyers (restaurants, retail supermarkets, wholesalers, and food processors). 

Through explainable AI recommendation scoring, direct multi-round price negotiations, fair regional price reference corridors, and built-in freight logistics estimation, FarmDirect ensures farmers receive fair compensation while businesses secure fresh, graded harvest with transparent provenance.

---

## 🚀 Key Features

1. **Role-Based Portals**: Tailored interfaces and authorized workflows for **Farmers**, **Commercial Buyers**, and **Platform Administrators**.
2. **Farmer Inventory & Listing Management**: Full CRUD controls with crop details, harvest dates, quality grades, stock tracking, and status toggles (`ACTIVE`, `PAUSED`, `SOLD`).
3. **Multi-Faceted Marketplace**: Filter by crop, price ceiling, volume, quality grade (`Grade A`, `Grade B`, `Organic`), and geographic region.
4. **Explainable AI Matching Engine**:
   - Scores compatibility from 0 to 100% across 6 deterministic dimensions:
     - **Crop Match (30%)**
     - **Quantity Fulfillment (20%)**
     - **Budget Alignment (20%)**
     - **Geographic Proximity (15%)**
     - **Quality & Grade (10%)**
     - **Harvest Timing (5%)**
   - Transparent, human-readable explanations with itemized checklists and consideration alerts.
5. **Fair Price Insight**: Regional benchmark comparisons using demo/historical market corridors (`min_price` to `max_price`), clearly disclaimed as reference data rather than live ticker claims.
6. **Direct Purchase Requests & Negotiations**:
   - Buyers submit customized price offers and requested volumes.
   - Farmers can **Accept**, **Decline**, or submit **Counter-Offers** in an auditable chronological timeline.
7. **Automated Order Contract Generation**:
   - Instant transition from accepted negotiation to confirmed order (`FD-2026-XXXXX`).
   - Atomic database inventory decrement (`available_quantity` reduced; listing marked `SOLD` if depleted).
8. **4-Stage Delivery Tracking Stepper**:
   - `CONFIRMED` ➔ `PICKUP_SCHEDULED` ➔ `IN_TRANSIT` ➔ `DELIVERED`.
   - Immutable operational history log with notes, timestamps, and operator IDs.
9. **Logistics & Freight Assistance**:
   - Automated transit distance lookup across agricultural clusters (e.g. Pune, Nashik, Satara, Mumbai).
   - Upfront freight cost calculation and vehicle type recommendations.
10. **Dynamic SQL Analytics**:
    - Real-time revenue curves, crop volume distributions, and spending timelines generated from SQL aggregations and displayed using **Recharts**.

---

## 🏗️ Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │          FarmDirect React Frontend           │
                       │   (Vite, Tailwind CSS, Recharts, Lucide)     │
                       └──────────────────────┬───────────────────────┘
                                              │ Axios REST APIs (Port 5173 / 5000)
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │             Flask Backend Server             │
                       │                  (Port 5000)                 │
                       ├──────────────────────┬───────────────────────┤
                       │  • Auth (JWT + Hash) │  • Matching Engine    │
                       │  • Farmer APIs       │  • Price Ref Service  │
                       │  • Buyer APIs        │  • Logistics Estimator│
                       │  • Marketplace APIs  │  • Analytics Engine   │
                       │  • Negotiation APIs  │  • Admin Oversight    │
                       │  • Order Management  │  • Notifications      │
                       └──────────────────────┬───────────────────────┘
                                              │ SQLAlchemy ORM
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │             SQLite Database                  │
                       │               (farmdirect.db)                │
                       └──────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

- **Frontend**:
  - React 18 / 19
  - Vite
  - Tailwind CSS
  - React Router DOM v6/v7
  - Axios (with JWT interceptors)
  - Recharts (dynamic SQL-backed charts)
  - Lucide React (modern agricultural & UI icons)
- **Backend**:
  - Python 3.10+
  - Flask & Flask-CORS
  - SQLAlchemy ORM
  - PyJWT (stateless token authentication)
  - Werkzeug (secure password hashing)
- **Database**:
  - SQLite (`farmdirect.db`)

---

## 🗄️ Database Schema

| Table Name | Primary Key | Foreign Keys / Relationships | Purpose |
|---|---|---|---|
| `users` | `id` | - | Accounts with role (`farmer`, `buyer`, `admin`), email, password hash |
| `farmer_profiles` | `id` | `user_id` ➔ `users.id` | Farm name, location, acreage, primary crops |
| `buyer_profiles` | `id` | `user_id` ➔ `users.id` | Business name, buyer type (Restaurant, Retailer, etc.), location |
| `produce_listings` | `id` | `farmer_id` ➔ `users.id` | Crop, available & total quantity, price, grade, status |
| `purchase_requests` | `id` | `buyer_id`, `listing_id` | Inbound commercial procurement proposals |
| `negotiations` | `id` | `request_id`, `sender_id` | Threaded offer & counter-offer timeline records |
| `orders` | `id` | `farmer_id`, `buyer_id`, `listing_id`, `purchase_request_id` | Finalized contracts with agreed prices and totals |
| `order_status_history` | `id` | `order_id`, `updated_by` | Audit trail of lifecycle milestone changes |
| `price_reference` | `id` | - | Demo/historical crop reference price ranges by region |
| `notifications` | `id` | `user_id` ➔ `users.id` | In-app alerts for offers, counters, and order transitions |

---

## 🔑 Demo Accounts

The database comes pre-seeded with verified test accounts. All passwords are set for easy evaluation:

| Role | Account / Entity | Email | Password | Details |
|---|---|---|---|---|
| **Farmer** | Rajesh Farms (Pune) | `farmer@farmdirect.demo` | `password123` | Tomato (2,000 kg @ ₹28/kg, Grade A) |
| **Farmer** | Green Valley Farm (Nashik) | `greenvalley@farmdirect.demo` | `password123` | Onions, Grapes, Tomatoes |
| **Buyer** | ABC Restaurant (Pune) | `buyer@farmdirect.demo` | `password123` | Commercial Restaurant Buyer |
| **Buyer** | FreshMart Retail (Mumbai) | `freshmart@farmdirect.demo` | `password123` | Retail Supermarket Buyer |
| **Admin** | System Administrator | `admin@farmdirect.demo` | `admin123` | Full Platform Governance |

> 💡 *Tip: On the Login screen, click any of the **1-Click Hackathon Demo Buttons** for instant evaluation without typing!*

---

## 🎬 Critical Hackathon Presentation Scenario

Follow this exact step-by-step path to demonstrate the full end-to-end workflow:

1. **Open the Application**:
   Navigate to [http://localhost:5173](http://localhost:5173).
2. **Login as Farmer (Rajesh Farms)**:
   - Click **Sign In** ➔ Click **Farmer: Rajesh Farms**.
   - Review the **Farmer Dashboard**: see initial listings and metrics.
   - Go to **My Listings**: verify Tomato harvest (2,000 kg @ ₹28/kg in Pune, Grade A).
   - Click **Sign Out**.
3. **Login as Buyer (ABC Restaurant)**:
   - Click **Sign In** ➔ Click **Buyer: ABC Restaurant**.
   - Review **Buyer Dashboard**.
   - Go to **AI Smart Match** from the sidebar.
   - Click **⚡ Load Critical Demo Scenario**:
     - Crop: `Tomato`
     - Quantity: `1500 kg`
     - Maximum Price: `₹30/kg`
     - Location: `Pune`
     - Quality: `Grade A`
     - Required By Date: `2026-09-22`
   - Click **Find Matches via AI**.
4. **Inspect the AI Match**:
   - **Rajesh Farms** appears ranked #1 with **Strong Match (100% / 94%)**.
   - Expand the **Explainable AI Checklist**: verify all green checkmarks (Crop, Quantity, Budget, Location, Quality, Timing).
5. **Send Purchase Request**:
   - Click **Request Purchase**.
   - Enter Requested Quantity: `1500 kg`.
   - Enter Offer Price: `₹27/kg`.
   - Note: *"I would like to purchase 1500 kg. Can you offer ₹27/kg?"*
   - Click **Send Purchase Request**.
   - Sign Out.
6. **Farmer Counter-Offer**:
   - Login as **Rajesh Farms** (`farmer@farmdirect.demo`).
   - Go to **Purchase Requests**: see ABC Restaurant's request for 1,500 kg @ ₹27/kg.
   - Click **Counter** (or open the **Timeline**).
   - Enter Counter Price: `₹27.50/kg`.
   - Note: *"Best we can do is ₹27.50/kg for this Grade A harvest."*
   - Click **Send Counter Offer**.
   - Sign Out.
7. **Buyer Acceptance & Automatic Order Creation**:
   - Login as **ABC Restaurant** (`buyer@farmdirect.demo`).
   - Go to **My Requests** ➔ Click **Negotiate**.
   - Review the chronological timeline showing the buyer offer and the farmer's ₹27.50 counter.
   - Click **Accept Offer (₹27.50/kg)**.
   - 🎉 **Order Confirmed!** An order number like `FD-2026-00003` is created for **₹41,250.00** (`1500 kg × ₹27.50`).
8. **Inventory Consistency Verification**:
   - Go to **Marketplace** or Farmer's **My Listings**:
   - The Tomato listing's available quantity has decreased from **2,000 kg ➔ 500 kg**!
9. **Delivery Progression & Tracking**:
   - Login as **Rajesh Farms**.
   - Open **Orders & Shipments**.
   - Select the order. Advance the operational stepper:
     - `CONFIRMED` ➔ `PICKUP_SCHEDULED`
     - `PICKUP_SCHEDULED` ➔ `IN_TRANSIT`
     - `IN_TRANSIT` ➔ `DELIVERED`
   - Note that all status changes are permanently logged in the **Operational History Log**.
10. **Analytics Verification**:
    - **Farmer Dashboard**: Revenue automatically increased by **+₹41,250**, and quantity sold by **+1,500 kg**.
    - **Buyer Dashboard**: Procurement spending increased by **+₹41,250**.
    - **Admin Dashboard**: Total Traded Volume and GMV reflect the finalized transaction.

---

## 🛠️ Installation & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend folder
cd scratch/farmdirect/backend

# Install Python dependencies
python -m pip install -r requirements.txt

# Initialize database and seed demo data
python seed.py

# Run backend API server (runs on http://127.0.0.1:5000)
python app.py
```

### 2. Frontend Setup
```bash
# In a second terminal, navigate to frontend folder
cd scratch/farmdirect/frontend

# Install node dependencies
npm.cmd install

# Start Vite development server (runs on http://localhost:5173)
npm.cmd run dev
```

### 3. Automated Verification Test
Run the end-to-end backend test suite anytime to verify all 14 API scenarios and database calculations:
```bash
cd scratch/farmdirect/backend
python test_backend.py
```

---

## 🌐 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new farmer or commercial buyer |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated profile and notifications |
| `GET` | `/api/marketplace` | Search listings with query filters |
| `GET` | `/api/marketplace/:id` | Get listing details with price and logistics estimates |
| `POST` | `/api/matching` | Execute explainable AI recommendation engine |
| `POST` | `/api/requests` | Create purchase request |
| `GET` | `/api/requests` | Fetch user's inbound or outbound requests |
| `GET` | `/api/negotiations/:requestId` | Fetch chronological offer timeline |
| `POST` | `/api/negotiations/:requestId/counter` | Submit counter-offer |
| `POST` | `/api/negotiations/:requestId/accept` | Accept offer & auto-generate order |
| `GET` | `/api/orders` | List user orders |
| `PUT` | `/api/orders/:id/status` | Advance delivery status (Farmer/Admin) |
| `GET` | `/api/price-reference/:crop` | Compare price against demo benchmark |
| `POST` | `/api/logistics/estimate` | Calculate distance, freight, and turnaround |
| `GET` | `/api/analytics/farmer` | SQL aggregations for farmer dashboard |
| `GET` | `/api/analytics/buyer` | SQL aggregations for buyer dashboard |
| `GET` | `/api/analytics/admin` | Global platform macro trading analytics |

---

## 📋 Hackathon Evaluation Checklist

- [x] Backend running on Flask & SQLite with SQLAlchemy ORM
- [x] Frontend running on React + Vite + Tailwind CSS
- [x] Seed database with 5 farmers, 5 buyers, 1 admin, 10+ listings, price benchmarks
- [x] Real authentication with secure password hashing & role-based routing
- [x] Explainable AI matching engine with weighted scoring and factors breakdown
- [x] Direct purchase request workflow
- [x] Multi-round counter-offer negotiation timeline
- [x] Automatic contract creation and stock subtraction on agreement
- [x] 4-stage delivery timeline with status history
- [x] Approximate logistics distance and freight estimator
- [x] Fair price reference corridor comparison
- [x] Live Recharts dashboards dynamically calculating SQL database stats
- [x] 1-Click quick demo logins for rapid hackathon presentation
