# FarmDirect — Final Phase: Unified Agricultural Intelligence & Commerce Platform 🌾🚀

> **Agricultural Commerce & Autonomous Supply Chain Intelligence System**  
> Complete end-to-end upgrade featuring 23 interconnected AI, optimization, verification, and circular-economy capabilities.

---

## 🌟 Architecture & System Blueprint

FarmDirect connects smallholder farmers directly with commercial buyers, eliminating predatory middlemen while powering the agricultural supply chain with autonomous AI intelligence.

```
                               ┌────────────────────────────────────────────────────────┐
                               │             FarmDirect React 19 Frontend               │
                               │        (Vite, TailwindCSS, Recharts, Lucide Icons)     │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ Axios REST APIs (Port 5000)
                                                           ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                              Flask Application Server                                                │
 ├────────────────────────────────┬──────────────────────────────────┬──────────────────────────────────────────────────┤
 │      Core Commerce Routes      │       AI & Intelligence Routes   │            Autonomous Copilots & Twin            │
 │ • /api/auth                    │ • /api/ai/hybrid-match           │ • /api/copilot/farmer                            │
 │ • /api/listings                │ • /api/ai/demand                 │ • /api/copilot/buyer                             │
 │ • /api/requests                │ • /api/ai/price-prediction       │ • /api/copilot/voice-command                     │
 │ • /api/orders                  │ • /api/ai/smart-selling          │ • /api/copilot/generate-listing                  │
 │ • /api/matching                │ • /api/ai/negotiation-copilot    │ • /api/digital-twin/farmer/<id>                  │
 │ • /api/analytics               │ • /api/ai/procurement-optimizer  │ • /api/digital-twin/inventory-intelligence       │
 │ • /api/waste (Circular Market) │ • /api/ai/duplicate-check        │ • /api/command-center/metrics & /simulate        │
 │ • /api/quality (Vision AI)     │ • /api/ai/reputation/<id>        │ • /api/command-center/heatmap & /anomalies       │
 └────────────────────────────────┴──────────────────────────────────┴──────────────────────────────────────────────────┘
                                                           │ SQLAlchemy ORM
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                    SQLite Database                     │
                               │  Users, Listings, Requests, Orders, Soil Profiles,     │
                               │  Crop History, Farm Expenses, Inspections, Waste,      │
                               │  Performance Scores, Anomalies, Market Trends          │
                               └────────────────────────────────────────────────────────┘
```

---

## 🧠 The 23 Integrated Capabilities

### 1. Hybrid AI Matching Engine
- **Engine**: `services/ai/hybrid_matching.py` (`POST /api/ai/hybrid-match`)
- Combines semantic/rule-based constraints (volume, proximity, grade) with dynamic price-demand weighting and trust factors.
- Returns transparent breakdown with explicit positive factors `(+)` and negative risk alerts `(-)`.

### 2. Crop Demand Predictor
- **Engine**: `services/ai/demand_predictor.py` (`GET /api/ai/demand?crop=Tomato&region=Pune`)
- Computes real-time demand score (0–100), 7-day and 14-day projections, momentum trend, and market volume dynamics based on seasonal patterns and historical consumption.

### 3. Smart Selling Time Decision Engine
- **Engine**: `services/ai/smart_selling.py` (`POST /api/ai/smart-selling`)
- Evaluates harvest perishability curves against projected price trajectory to generate actionable decisions:
  - `SELL NOW`: Imminent shelf-life deterioration or declining price projection.
  - `WAIT / HOLD`: Price upside outweighs holding risks.
  - `REVIEW SELLING NOW`: Balanced trade-off requiring farmer confirmation.

### 4. AI Fair Price & Profit Intelligence
- **Engine**: `services/ai/price_intelligence.py` (`POST /api/ai/price-prediction`, `POST /api/ai/profit-calculator`)
- Historical price trend analysis, fair corridor modeling, and acreage-based gross margin calculations taking seed, fertilizer, labor, and irrigation into account.

### 5. AI Negotiation Copilot
- **Engine**: `services/ai/negotiation_copilot.py` (`POST /api/ai/negotiation-copilot`)
- Live agreement zone (ZOPA) calculation, optimal counter-offer generation, and interactive concession trade-offs (e.g., volume discounts vs. free delivery). Integrated seamlessly into both Farmer and Buyer negotiation hubs.

### 6. AI Procurement Optimizer
- **Engine**: `services/ai/procurement_optimizer.py` (`POST /api/ai/procurement-optimizer`)
- Natural-language intent parser converts unstructured prompts (e.g., *"Need 5 tonnes Grade A tomatoes Pune under 30/kg"*) into multi-source allocations across 3 optimization strategies:
  - **Plan A**: Lowest Landed Cost (maximizing freight consolidation).
  - **Plan B**: Highest Reliability & Trust.
  - **Plan C**: Fastest Delivery Time.

### 7. Computer-Vision Quality Verification
- **Engine**: `services/ai/vision_quality.py` (`POST /api/quality/upload-inspect`)
- Multi-parameter produce image analysis returning ripeness %, caliber uniformity, defect detection %, and verified grade alignment (`VERIFIED_ALIGNED` vs. `DOWNGRADE_DETECTED`).

### 8. Harvest & Supply Risk Intelligence
- **Engine**: `services/ai/risk_intelligence.py` (`GET /api/ai/risk-analysis`)
- Quantifies weather disruption index, transit shelf-life risk, and district-level supply saturation risk.

### 9. Perishability Intelligence & Shelf-Life Modeling
- **Engine**: `services/ai/perishability_model.py` (`GET /api/ai/perishability`)
- Real-time days-to-rot countdown, decay acceleration curves under ambient temperature, and recommended storage instructions.

### 10. Smart Inventory Intelligence
- **Engine**: `routes/digital_twin.py` (`GET /api/digital-twin/inventory-intelligence`)
- Aggregates farmer active inventory, calculates breakeven selling thresholds, and tracks days remaining before spoilage.

### 11. Farm Digital Twin Telemetry
- **Engine**: `services/ai/digital_twin_service.py` (`GET /api/digital-twin/farmer/<id>`)
- High-fidelity agronomic telemetry: Nitrogen (N), Phosphorus (P), Potassium (K), soil pH, soil moisture %, multi-season crop rotation history, and financial expense tracking.

### 12. Intelligent Logistics & Route Optimizer
- **Engine**: `services/logistics.py`
- Distance calculations across Maharashtra agricultural nodes, automated carrier vehicle classification (1.5T pickup vs 10T freight carrier), and route freight savings.

### 13. Trust & Reputation Engine
- **Engine**: `services/ai/reputation_engine.py` (`GET /api/ai/reputation/<user_id>`)
- Multi-dimensional scoring of fulfillment reliability, dispute frequency, quality consistency, and payment speed.

### 14. Farmer AI Agronomic Copilot
- **Engine**: `services/ai/copilot_service.py` (`POST /api/copilot/farmer`)
- Conversational agricultural advisory answering queries regarding mandi price trends, pest management, harvesting windows, and selling strategies.

### 15. Buyer Procurement Copilot
- **Engine**: `services/ai/copilot_service.py` (`POST /api/copilot/buyer`)
- B2B procurement advisor suggesting supplier diversification, volume discounts, and optimal fulfillment timing.

### 16. Multilingual Voice Farm Assistant
- **Engine**: `services/ai/voice_service.py` (`POST /api/copilot/voice-command`)
- Voice recognition and intent parser supporting **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** to allow hands-free listing creation and mandi price queries for rural farmers.

### 17. AI Listing Generator
- **Engine**: `services/ai/listing_generator.py` (`POST /api/copilot/generate-listing`)
- Converts rough farmer notes (e.g., *"100 crates red tomatoes Pune ready Tuesday"*) into structured listings with SEO titles, detailed descriptions, and automated tags.

### 18. Circular Economy Farm Waste Marketplace
- **Engine**: `routes/waste.py` (`GET /api/waste/listings`, `POST /api/waste/listings`, `POST /api/waste/orders`)
- Dedicated marketplace to monetize agricultural by-products (crop stubble, sugarcane bagasse, tomato pomace, rice husk) for biofuel, compost, and packaging manufacturers.

### 19. AI Market Command Center
- **Engine**: `routes/command_center.py` (`GET /api/command-center/metrics`)
- Centralized administrator dashboard showing macro supply, demand balance, price volatility index, platform GMV, and pending operational alerts.

### 20. Supply-Demand Geographic Heatmap
- **Engine**: `routes/command_center.py` (`GET /api/command-center/heatmap?layer=supply|demand|risk|price`)
- Visual geographic analysis across 6 key agricultural hubs: **Pune, Nashik, Satara, Ahmednagar, Sangli, and Mumbai**.

### 21. What-If Market Simulator
- **Engine**: `services/ai/simulator_service.py` (`POST /api/command-center/simulate`)
- Macroeconomic scenario stress-tester: models the impact of demand shocks, diesel price spikes, monsoon delays, and harvest drops on market clearing prices.

### 22. Anomaly & Fraud Detection Engine
- **Engine**: `services/ai/anomaly_engine.py` (`GET /api/command-center/anomalies`, `POST /api/command-center/anomalies/<id>/resolve`)
- Flags suspicious price deviations (>40% below or above mandi benchmark), fraudulent multi-accounting, and abrupt quantity anomalies.

### 23. Duplicate Listing Detection
- **Engine**: `services/ai/duplicate_detector.py` (`POST /api/ai/duplicate-check`)
- Multi-vector similarity detection comparing crop name, location, price, and quantity to prevent marketplace spam and double-booking.

---

## 👥 Demo Personas & Credentials

| Role | Email | Password | Key Showcase Pages |
|------|-------|----------|-------------------|
| **Farmer** | `farmer@farmdirect.demo` | `password123` | Farm Digital Twin, Inventory Intel, Voice Assistant, AI Listing Gen, Negotiation Hub, Waste Market |
| **Buyer** | `buyer@farmdirect.demo` | `password123` | AI Smart Matching, AI Procurement Optimizer, Buyer Copilot, Quality Inspection Viewer |
| **Admin** | `admin@farmdirect.demo` | `admin123` | AI Command Center, Supply-Demand Heatmap, What-If Simulator, Anomaly Audit Queue |

---

## 🧪 Verification & Test Results

### Backend Automated Test Suites
Both suites pass with 100% test coverage:
1. **Baseline Suite**: `python test_backend.py` — **14/14 tests passing**
2. **Final Phase Suite**: `python test_final_phase.py` — **20/20 capability tests passing**

### Frontend Production Build
`npm run build` completed cleanly:
- 2,558 modules transformed
- 0 JSX / syntax / bundling errors
- Built client artifacts ready for production deployment

---

## 🚀 Running FarmDirect Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python seed.py        # Seeds Maharashtra demo data, soil telemetry, and waste listings
python app.py         # Runs Flask on port 5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev           # Runs Vite on port 5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
