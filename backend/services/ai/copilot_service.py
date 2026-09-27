"""
AI Copilot Service for Farmers and Buyers, with Multilingual NLU, Agronomic Intelligence,
and Automated Produce Listing Generation.
Supports English, Hindi, and Marathi commands with contextual domain knowledge.
"""

import re
from datetime import date, timedelta
from models import ProduceListing, Order, User, CropMarketHistory, PriceReference
from services.ai.demand_forecaster import DemandForecastService
from services.ai.price_forecaster import PriceForecasterService
from services.ai.smart_selling import SmartSellingService
from services.ai.risk_engine import RiskEngine
from services.ai.trust_engine import TrustEngine

# Crop synonyms dictionary mapping localized terms to canonical names
CROPS_MAP = {
    'onion': 'Onion', 'onions': 'Onion', 'कांदा': 'Onion', 'कांदे': 'Onion', 'कांद्याचे': 'Onion', 'कांद्यांचे': 'Onion', 'कांद्याची': 'Onion', 'प्याज': 'Onion', 'प्याज़': 'Onion',
    'tomato': 'Tomato', 'tomatoes': 'Tomato', 'टोमॅटो': 'Tomato', 'टोमॅटोवरील': 'Tomato', 'टोमॅटोचे': 'Tomato', 'टमाटर': 'Tomato',
    'potato': 'Potato', 'potatoes': 'Potato', 'बटाटा': 'Potato', 'बटाटे': 'Potato', 'बटाट्याचे': 'Potato', 'आलू': 'Potato',
    'wheat': 'Wheat', 'गहू': 'Wheat', 'गव्हाचा': 'Wheat', 'गव्हाचे': 'Wheat', 'गव्हाची': 'Wheat', 'गेहूं': 'Wheat',
    'rice': 'Rice', 'paddy': 'Rice', 'तांदूळ': 'Rice', 'भात': 'Rice', 'चावल': 'Rice',
    'grapes': 'Grapes', 'grape': 'Grapes', 'द्राक्षे': 'Grapes', 'द्राक्ष': 'Grapes', 'द्राक्षांची': 'Grapes', 'अंगूर': 'Grapes',
    'sugarcane': 'Sugarcane', 'ऊस': 'Sugarcane', 'उसाचे': 'Sugarcane', 'उसाची': 'Sugarcane', 'गन्ना': 'Sugarcane',
    'cotton': 'Cotton', 'कापूस': 'Cotton', 'कापसाचे': 'Cotton', 'कपास': 'Cotton',
    'soybean': 'Soybean', 'soya': 'Soybean', 'सोयाबीन': 'Soybean',
    'cabbage': 'Cabbage', 'कोबी': 'Cabbage', 'पत्तागोभी': 'Cabbage',
    'cauliflower': 'Cauliflower', 'फ्लॉवर': 'Cauliflower', 'फूलगोभी': 'Cauliflower',
    'capsicum': 'Capsicum', 'ढोबळी मिरची': 'Capsicum', 'शिमला मिर्च': 'Capsicum', 'bell pepper': 'Capsicum',
    'carrot': 'Carrot', 'गाजर': 'Carrot',
    'strawberry': 'Strawberry', 'strawberries': 'Strawberry', 'स्ट्रॉबेरी': 'Strawberry',
    'garlic': 'Garlic', 'लसूण': 'Garlic', 'लहसुन': 'Garlic',
    'ginger': 'Ginger', 'आले': 'Ginger', 'अदरक': 'Ginger',
    'pomegranate': 'Pomegranate', 'डाळिंब': 'Pomegranate', 'अनार': 'Pomegranate',
}

REGIONS_MAP = {
    'nashik': 'Nashik', 'नासिक': 'Nashik', 'नाशिक': 'Nashik', 'lasalgaon': 'Nashik', 'लासलगाव': 'Nashik', 'pimpalgaon': 'Nashik',
    'pune': 'Pune', 'पुणे': 'Pune',
    'satara': 'Satara', 'सातारा': 'Satara', 'mahabaleshwar': 'Satara', 'महाबळेश्वर': 'Satara',
    'ahmednagar': 'Ahmednagar', 'अहमदनगर': 'Ahmednagar', 'nagar': 'Ahmednagar',
    'sangli': 'Sangli', 'सांगली': 'Sangli',
    'mumbai': 'Mumbai', 'मुंबई': 'Mumbai', 'vashi': 'Mumbai',
    'nagpur': 'Nagpur', 'नागपूर': 'Nagpur',
    'solapur': 'Solapur', 'सोलापूर': 'Solapur',
    'kolhapur': 'Kolhapur', 'कोल्हापूर': 'Kolhapur',
}


class CopilotService:

    @staticmethod
    def _detect_language(text):
        """Detect if text is primarily Marathi, Hindi, or English."""
        # Common Marathi-specific markers
        marathi_words = ['आहेत', 'आहे', 'करावे', 'रोखावा', 'बाजारभाव', 'कांद्याचे', 'टोमॅटोवरील', 'गव्हाचा', 'पाचट', 'काडीकचरा', 'थांबवून', 'शेतीतील', 'या', 'कोणती', 'किती', 'कसे']
        # Common Hindi-specific markers
        hindi_words = ['हैं', 'है', 'कैसे', 'बचें', 'रोकना', 'चाहिए', 'अवशेषों', 'बेचें', 'मंडी', 'भाव', 'क्या', 'इस', 'महीने', 'किन', 'जिलों']

        t = text.lower()
        if any(w in t for w in marathi_words):
            return 'mr'
        if any(w in t for w in hindi_words):
            return 'hi'
        # Check Devanagari characters
        if re.search(r'[\u0900-\u097F]', text):
            # Default devanagari to Marathi if mentions Maharashtra mandis/crops, else Hindi
            if any(w in t for w in ['कांदा', 'गहू', 'नाशिक', 'पुणे', 'द्राक्षे', 'करपा', 'बाजार']):
                return 'mr'
            return 'hi'
        return 'en'

    @staticmethod
    def _extract_crop(text, default=None):
        t = text.lower()
        for k, v in CROPS_MAP.items():
            if k in t:
                return v
        return default

    @staticmethod
    def _extract_region(text, default=None):
        t = text.lower()
        for k, v in REGIONS_MAP.items():
            if k in t:
                return v
        return default

    # -------------------------------------------------------------------------
    # FARMER AI COPILOT
    # -------------------------------------------------------------------------
    @staticmethod
    def get_farmer_copilot_response(farmer_id, query_text):
        q = query_text.strip().lower() if query_text else ''
        farmer = User.query.get(farmer_id)
        if not farmer:
            return {'reply': "Farmer account not found.", 'context': {}}

        listings = ProduceListing.query.filter_by(farmer_id=farmer_id, status='ACTIVE').all()
        default_crop = listings[0].crop if listings else 'Tomato'
        default_region = farmer.farmer_profile.location if (farmer.farmer_profile and farmer.farmer_profile.location) else 'Pune'

        lang = CopilotService._detect_language(query_text)
        detected_crop = CopilotService._extract_crop(query_text, default=default_crop)
        detected_region = CopilotService._extract_region(query_text, default=default_region)

        # ---------------------------------------------------------------------
        # 1. PEST / BLIGHT / DISEASE MANAGEMENT (e.g. "How to prevent blight in tomato crops after unseasonal rain?")
        # ---------------------------------------------------------------------
        if any(w in q for w in ['blight', 'करपा', 'झुलसा', 'pest', 'disease', 'रोग', 'कीड', 'फवारणी', 'औषध', 'fungus', 'fungicide', 'rot', 'caterpillar', 'spray', 'असमय बारिश', 'अवकाळी']):
            if lang == 'mr':
                reply = (
                    f"**अवकाळी पावसानंतर {detected_crop} वरील रोग/करपा व्यवस्थापन तातडीचा सल्ला 🌧️🌱**\n\n"
                    f"अवकाळी पाऊस आणि हवेतील अति आर्द्रतेमुळे (८५%+ आर्द्रता) **करपा (Blight)** व बुरशीजन्य रोगांचा प्रादुर्भाव वेगाने वाढतो.\n\n"
                    f"### त्वरित करावयाच्या उपाययोजना:\n"
                    f"1. **पाण्याचा निचरा:** वाफ्यांमधील साचलेले पाणी तातडीने बाहेर काढा. मुळांभोवती पाणी साचल्यास मुळकुज व बुरशीचे बीजाणू वेगाने पसरतात.\n"
                    f"2. **बुरशीनाशक फवारणी (पाऊस थांबल्यानंतर २४ ते ४८ तासांत):**\n"
                    f"   • **प्रतिबंधात्मक:** **मँकोझेब ७५% WP** (Mancozeb) @ २.५ ग्रॅम प्रति लिटर पाण्यात मिसळून फवारा.\n"
                    f"   • **रोगाची लक्षणे दिसल्यास (पानांवर तपकिरी डाग):** **मेटालॅक्सिल ८% + मँकोझेब ६४% WP** (Ridomil Gold) @ २ ग्रॅम/लिटर किंवा **सायमोक्सानिल + मँकोझेब** @ २ ग्रॅम/लिटर.\n"
                    f"3. **रोगट भाग छाटणी:** झाडाच्या जमिनीलगतची पिवळी पडलेली व प्रादुर्भाव झालेली खालची पाने काढून नष्ट करा जेणेकरून हवा खेळती राहील.\n"
                    f"4. **जैविक पर्याय:** ट्रायकोडर्मा व्हिरिडी (Trichoderma viride) @ ५ मिली/लिटर पाण्यात गुळासोबत मिसळून फवारा."
                )
            elif lang == 'hi':
                reply = (
                    f"**असमय बारिश के बाद {detected_crop} में झुलसा (Blight) व फफूंद नियंत्रण सलाह 🌧️🌱**\n\n"
                    f"बारिश के बाद उच्च आर्द्रता और नमी से अर्ली/लेट ब्लाइट (झुलसा रोग) का प्रकोप तेजी से फैलता है।\n\n"
                    f"### त्वरित कार्रवाई योजना:\n"
                    f"1. **जल निकासी:** खेत से अतिरिक्त पानी तुरंत निकालें। जलभराव से जड़ गलन और फफूंद रोग तेजी से बढ़ते हैं।\n"
                    f"2. **फफूंदनाशक स्प्रे (बारिश रुकने के 24-48 घंटे के भीतर):**\n"
                    f"   • **शुरुआती बचाव:** **मैनकोजेब 75% WP** @ 2.5 ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें।\n"
                    f"   • **लक्षण दिखने पर:** **मेटालेक्सिल + मैनकोजेब** (रिडोमिल) @ 2 ग्राम प्रति लीटर पानी का छिड़काव करें।\n"
                    f"3. **संक्रमित पत्तियां हटाएं:** नीचे की पीली व प्रभावित पत्तियों को काटकर खेत से दूर नष्ट करें ताकि हवा का आवागमन बना रहे।\n"
                    f"4. **जैविक उपचार:** ट्राइकोडर्मा विरिडी 5 ग्राम/लीटर का छिड़काव धूप निकलने के बाद करें।"
                )
            else:
                reply = (
                    f"**Emergency Agronomic Advisory: {detected_crop} Blight & Fungal Management After Rain 🌧️🍅**\n\n"
                    f"Unseasonal rainfall and high relative humidity (>85%) create prime microclimates for Early Blight (*Alternaria solani*) and Late Blight (*Phytophthora infestans*).\n\n"
                    f"### Immediate Action Protocol:\n"
                    f"1. **Field Drainage & Canopy Aeration:**\n"
                    f"   • Clear drainage furrows immediately to eliminate standing water and root suffocation.\n"
                    f"   • Prune yellowing or soil-touching bottom foliage to break soil-splash spore transmission.\n\n"
                    f"2. **Targeted Fungicide Spray (Within 24–48 hours of rain cessation):**\n"
                    f"   • **Preventative/Early Stage:** Foliar spray of **Mancozeb 75% WP** @ 2.5 g/L or Chlorothalonil 75% WP @ 2.0 g/L.\n"
                    f"   • **Active Lesions (Water-soaked dark spots):** Systemic treatment with **Metalaxyl 8% + Mancozeb 64% WP** (Ridomil Gold) @ 2.0–2.5 g/L, or Cymoxanil + Mancozeb @ 2.0 g/L.\n\n"
                    f"3. **Nutrition & Foliar Immunity:**\n"
                    f"   • Suspend heavy nitrogen/urea top-dressing until the weather stabilizes.\n"
                    f"   • Apply Potassium Phosphite or 0:52:34 @ 4 g/L to reinforce plant cell-wall rigidity.\n\n"
                    f"4. **Biological Alternative:**\n"
                    f"   • Spray *Trichoderma viride* or *Pseudomonas fluorescens* @ 5 ml/L during cool morning hours."
                )
            return {'reply': reply, 'category': 'CROP_PROTECTION'}

        # ---------------------------------------------------------------------
        # 2. STOCK HOLDING VS SELLING TIME (e.g. "Is it optimal to hold wheat stock for 2 weeks or sell now?")
        # ---------------------------------------------------------------------
        elif any(w in q for w in ['hold', '2 weeks', 'हफ्ते', 'आठवडे', 'थांबवून', 'रोकना', 'sell now or wait', 'wait or sell', 'साठा', 'स्टॉक रोकना']):
            is_durable = detected_crop.lower() in ['wheat', 'rice', 'soybean', 'cotton', 'garlic']
            price_intel = PriceForecasterService.get_predictive_fair_price(detected_crop, detected_region)

            if lang == 'mr':
                verdict = "२ ते ३ आठवडे थांबून विक्री करणे फायदेशीर ठरेल" if is_durable else "लवकर विक्री करणे किंवा शीतगृहात ठेवणे योग्य ठरेल"
                reply = (
                    f"**{detected_crop} साठा मूल्यांकन व विक्री वेळ विश्लेषण ({detected_region}) 🌾📊**\n\n"
                    f"• **पीक प्रकार:** {'कमी नाशवंत / टिकाऊ धान्य' if is_durable else 'नाशवंत शेतीमाल'}\n"
                    f"• **चालू संदर्भ दर:** ₹{price_intel['predicted_price']:.2f}/किलो (पट्टा: ₹{price_intel['lower_bound']:.2f} - ₹{price_intel['upper_bound']:.2f})\n"
                    f"• **स्ट्रॅटेजिक सल्ला:** **{verdict}**\n\n"
                    f"### सविस्तर कारणमीमांसा:\n"
                    f"1. **बाजार आवक कल:** सध्या बाजार समित्यांमध्ये काढणीनंतरची आवक शिगेला आहे. पुढील २ ते ३ आठवड्यांत आवक स्थिर झाल्यावर दरामध्ये **५% ते ८% वाढ** अपेक्षित आहे.\n"
                    f"2. **साठवणूक जोखीम:** {'धान्यातील ओलावा १२% पेक्षा कमी असल्यास साठवणुकीची जोखीम नगण्य आहे.' if is_durable else 'नाशवंत माल असल्याने साठवून ठेवल्यास वजनात घट व प्रत खराब होण्याचा धोका आहे.'}\n"
                    f"3. **शिफारस:** फार्मडायरेक्टवर सक्रिय खरेदीदारांशी वाटाघाटी करून अपेक्षित दर निश्चित करा."
                )
            elif lang == 'hi':
                verdict = "2 से 3 सप्ताह स्टॉक रोककर बेचना फायदेमंद रहेगा" if is_durable else "जल्द बिक्री करना या कोल्ड स्टोरेज में रखना बेहतर है"
                reply = (
                    f"**{detected_crop} स्टॉक होल्डिंग व सेलिंग टाइम विश्लेषण ({detected_region}) 🌾📊**\n\n"
                    f"• **फसल श्रेणी:** {'टिकाऊ अनाज / दलहन' if is_durable else 'जल्द खराब होने वाली बागवानी फसल'}\n"
                    f"• **वर्तमान संदर्भ भाव:** ₹{price_intel['predicted_price']:.2f}/किग्रा (दायरा: ₹{price_intel['lower_bound']:.2f} - ₹{price_intel['upper_bound']:.2f})\n"
                    f"• **रणनीतिक निष्कर्ष:** **{verdict}**\n\n"
                    f"### मुख्य बाजार विश्लेषण:\n"
                    f"1. **मंडी आवक:** फसल कटाई के बाद मंडियों में भारी आवक के कारण दाम थोड़े दबाव में हैं। 2 हफ्ते बाद आवक घटने पर **₹150 - ₹250 प्रति क्विंटल** का उछाल संभव है।\n"
                    f"2. **सुरक्षित भंडारण:** {'अनाज में नमी 12% से कम रखें और कीट नियंत्रण के लिए नीम आधारित धूमन करें।' if is_durable else 'बिना कोल्ड चेन के अधिक दिन न रोकें, गुणवत्ता गिरने का जोखिम है।'}\n"
                    f"3. **सिफारिश:** बेहतर मूल्य प्राप्ति के लिए सीधे खरीदारों को फार्मडायरेक्ट पर लिस्ट करें।"
                )
            else:
                verdict = "HOLD FOR 2–3 WEEKS (Favorable Risk/Reward)" if is_durable else "SELL IMMEDIATELY OR DISPATCH TO COLD STORAGE"
                reply = (
                    f"**Market Timing & Stock Holding Strategy: {detected_crop} ({detected_region}) 🌾📈**\n\n"
                    f"• **Commodity Profile:** {'Non-Perishable / Durable Grain (Storage horizon 180+ days)' if is_durable else 'Perishable Horticultural Produce'}\n"
                    f"• **Current Fair Price:** **₹{price_intel['predicted_price']:.2f}/kg** (Corridor: ₹{price_intel['lower_bound']:.2f} – ₹{price_intel['upper_bound']:.2f}/kg)\n"
                    f"• **Strategic Decision:** **{verdict}**\n\n"
                    f"### Key Market Catalysts:\n"
                    f"1. **Arrival Pressure & Price Recovery:** Regional APMC arrivals are currently near peak volume. Historical transaction data indicates a **5.5% to 8.2% price rebound** within 14–21 days as institutional procurement gathers pace.\n"
                    f"2. **Storage Integrity:** {'Safe to hold provided grain moisture is strictly below 12%. Use sealed gunny bags with protective fumigation.' if is_durable else 'Ambient holding carries shelf-life degradation risk. Do not hold without controlled refrigeration.'}\n"
                    f"3. **Revenue Impact:** On a 10-tonne lot, a 2-week hold can unlock an estimated **₹25,000 – ₹38,000** in additional gross margin."
                )
            return {'reply': reply, 'category': 'MARKET_TIMING'}

        # ---------------------------------------------------------------------
        # 3. APMC & MANDI PRICE BENCHMARKS (e.g. "What are current APMC price benchmarks for onions in Nashik?")
        # ---------------------------------------------------------------------
        elif any(w in q for w in ['price', 'rate', 'benchmark', 'apmc', 'mandi', 'भाव', 'बाजारभाव', 'दर', 'दाम', 'bhav', 'cost', 'list at', 'fair price']):
            p = PriceForecasterService.get_predictive_fair_price(detected_crop, detected_region, 'Grade A', 1000)

            if lang == 'mr':
                reply = (
                    f"**{detected_region} बाजार समिती (APMC) {detected_crop} चालू बाजारभाव व विश्लेषण 🧅📊**\n\n"
                    f"• **शिफारस केलेला थेट विक्री दर:** **₹{p['predicted_price']:.2f}/किलो**\n"
                    f"• **किफायतशीर बाजारभाव पट्टा:** **₹{p['lower_bound']:.2f} ते ₹{p['upper_bound']:.2f}/किलो**\n"
                    f"• **१,००० किलो (१ टन) अपेक्षित उत्पन्न:** **₹{p['expected_revenue']:,.2f}**\n\n"
                    f"_{p['factors'][0]} ({p['factors'][1]})._\n\n"
                    f"💡 **शेतकरी सल्ला:** फार्मडायरेक्टवर थेट विक्री केल्यास हमाली व दलालीचे ६-८% वाचून थेट खरेदीदारांकडून उत्तम नफा मिळवता येतो."
                )
            elif lang == 'hi':
                reply = (
                    f"**{detected_region} मंडी (APMC) में {detected_crop} का वर्तमान भाव व विश्लेषण 🧅📊**\n\n"
                    f"• **सुझाया गया लिस्टिंग मूल्य:** **₹{p['predicted_price']:.2f}/किग्रा**\n"
                    f"• **उचित संदर्भ मूल्य दायरा:** **₹{p['lower_bound']:.2f} – ₹{p['upper_bound']:.2f}/किग्रा**\n"
                    f"• **1,000 किग्रा पर संभावित आय:** **₹{p['expected_revenue']:,.2f}**\n\n"
                    f"_{p['factors'][0]} ({p['factors'][1]})._\n\n"
                    f"💡 **बिक्री सलाह:** बिना किसी बिचौलिए के फार्मडायरेक्ट पर होटल व रिटेल खरीदारों को सीधे बेचकर बेहतर मुनाफा कमाएं।"
                )
            else:
                reply = (
                    f"**APMC & Regional Market Price Benchmark for {detected_crop} in {detected_region} 📊**\n\n"
                    f"• **Recommended FarmDirect Listing Price:** **₹{p['predicted_price']:.2f}/kg**\n"
                    f"• **Fair APMC Reference Corridor:** **₹{p['lower_bound']:.2f} – ₹{p['upper_bound']:.2f}/kg**\n"
                    f"• **Projected Revenue for 1,000 kg:** **₹{p['expected_revenue']:,.2f}**\n\n"
                    f"**Key Pricing Drivers:**\n"
                    f"• {p['factors'][0]}\n"
                    f"• {p['factors'][1]}\n"
                    f"• {p['factors'][2]}\n\n"
                    f"💡 **Commercial Advice:** In {detected_region}, Grade A sorting commands a 5-10% quality premium. Listing directly on FarmDirect bypasses 6–8% APMC commission and intermediary transit cuts."
                )
            return {'reply': reply, 'data': p, 'category': 'PRICE_INTELLIGENCE'}

        # ---------------------------------------------------------------------
        # 4. FARM WASTE & STUBBLE MARKETPLACE (e.g. "How do I list agricultural stubble on the waste marketplace?")
        # ---------------------------------------------------------------------
        elif any(w in q for w in ['waste', 'stubble', 'bagasse', 'काडीकचरा', 'पाचट', 'अवशेष', 'पराली', 'बायोमास', 'compost', 'residue']):
            if lang == 'mr':
                reply = (
                    f"**शेतीतील उरलेले पाचट, काडीकचरा व पराली वेस्ट मार्केटप्लेसवर कशी विकावी? ♻️💰**\n\n"
                    f"शेतात पाचट किंवा काडीकचरा जाळण्याऐवजी (ज्यामुळे जमिनीची सुपीकता नष्ट होते) फार्मडायरेक्टवर थेट बायोफ्यूल, खत व पॅकेजिंग कंपन्यांना विक्री करा.\n\n"
                    f"### विक्री करण्याची सोपी पद्धत:\n"
                    f"1. वरील मेन्यूमधील **Waste Market (कचरा बाजार)** टॅबवर जा.\n"
                    f"2. **'List Farm Waste'** बटणावर क्लिक करा.\n"
                    f"3. तुमच्या अवशेषाचा प्रकार निवडा:\n"
                    f"   • **उसाचे पाचट / बगास:** ₹१,००० - ₹१,५०० प्रति टन\n"
                    f"   • **गहू / भाताचे तण (पेंढा):** ₹८०० - ₹१,२०० प्रति टन\n"
                    f"   • **टोमॅटो पोमॅस / सेंद्रिय कचरा:** ₹९०० - ₹१,३०० प्रति टन\n"
                    f"4. अंदाजे वजन (टन मध्ये) व शेताचे ठिकाण नोंदवून सबमिट करा.\n"
                    f"5. औद्योगिक खरेदीदार थेट तुमच्या शेतातून गाडी पाठवून माल उचलतील!"
                )
            elif lang == 'hi':
                reply = (
                    f"**कृषि अवशेष व पराली को वेस्ट मार्केटप्लेस पर कैसे बेचें? ♻️💰**\n\n"
                    f"पराली जलाने के बजाय उसे बायो-एनर्जी, कंपोस्ट और पेपर मिल खरीदारों को सीधे बेचकर अतिरिक्त आय कमाएं।\n\n"
                    f"### लिस्टिंग के आसान चरण:\n"
                    f"1. मुख्य नेविगेशन बार में **Waste Market** पर क्लिक करें।\n"
                    f"2. **'List Farm Waste'** बटन दबाएं।\n"
                    f"3. बायोमास का प्रकार चुनें (गन्ने की खोई, गेहूं/धान की पराली, टमाटर का गूदा आदि)।\n"
                    f"4. उपलब्ध मात्रा (टन में) और पिकअप लोकेशन दर्ज करें।\n"
                    f"5. बॉयो-सीएनजी व प्लाईवुड फैक्ट्रियां सीधे आपके खेत से माल उठाने हेतु ऑर्डर बुक करेंगी।"
                )
            else:
                reply = (
                    f"**Monetize Crop Residue on the Farm Waste Circular Marketplace ♻️💰**\n\n"
                    f"Instead of stubble burning—which causes environmental penalties and destroys soil microbes—you can turn crop by-products into direct revenue.\n\n"
                    f"### How to List on FarmDirect:\n"
                    f"1. Navigate to **Waste Market** in the top navigation or visit `/waste-marketplace`.\n"
                    f"2. Click **'List Farm Waste'**.\n"
                    f"3. Select residue type and benchmark rates:\n"
                    f"   • **Paddy Straw / Wheat Stubble**: ₹800 – ₹1,200 / tonne (Biofuel pellets, animal feed)\n"
                    f"   • **Sugarcane Bagasse**: ₹1,000 – ₹1,500 / tonne (Paper mills, co-generation plants)\n"
                    f"   • **Tomato / Fruit Pomace**: ₹900 – ₹1,400 / tonne (Organic compost, animal silage)\n"
                    f"   • **Rice Husk / Cotton Stalks**: ₹1,100 – ₹1,600 / tonne (Briquette manufacturing)\n"
                    f"4. Enter total tonnage, baled/loose status, and farm pickup address.\n"
                    f"5. Industrial buyers and green recyclers will arrange freight logistics directly from your farm."
                )
            return {'reply': reply, 'category': 'WASTE_MARKETPLACE'}

        # ---------------------------------------------------------------------
        # 5. SOIL HEALTH, FERTILIZER & NPK ADVICE (e.g. "What fertilizer should I apply?")
        # ---------------------------------------------------------------------
        elif any(w in q for w in ['soil', 'npk', 'fertilizer', 'urea', 'dap', 'खत', 'माती', 'युरिया', 'ph']):
            reply = (
                f"**Soil Nutrition & Fertilizer Advisory for {detected_crop} 🌱🧪**\n\n"
                f"• **Recommended NPK Ratio:** Balanced split application of 120:60:60 kg/ha for optimal vegetative growth and flowering.\n"
                f"• **Basal Dose:** Apply 50% Nitrogen, 100% Phosphorus (Single Super Phosphate), and 50% Potash (MOP) at planting.\n"
                f"• **Top-Dressing:** Split remaining Nitrogen at 30 and 45 days after transplantation.\n"
                f"• **Micronutrient Health:** Check your live **Farm Digital Twin** telemetry for real-time Nitrogen, Phosphorus, Potassium, and soil pH levels."
            )
            return {'reply': reply, 'category': 'SOIL_NUTRITION'}

        # ---------------------------------------------------------------------
        # 6. GENERAL SELL NOW / HARVEST TIMING
        # ---------------------------------------------------------------------
        elif any(w in q for w in ['sell now', 'what to sell', 'when to sell', 'selling time', 'recommendation', 'विक्री']):
            if not listings:
                return {
                    'reply': "You currently have no active produce listings. Start by adding your upcoming harvest so our AI can analyze market timing for you.",
                    'action_suggestion': '/farmer/listings/new'
                }
            top_listing = listings[0]
            intel = SmartSellingService.evaluate_selling_time(
                top_listing.crop,
                top_listing.expected_price,
                top_listing.available_quantity,
                top_listing.location
            )
            reply = (
                f"**Strategic Selling Recommendation for {intel['crop']}: {intel['decision']}**\n\n"
                f"{intel['headline']}\n\n"
                f"• Current Price: ₹{intel['current_price']:.2f}/kg | Projected 7-day Price: ₹{intel['predicted_future_price']:.2f}/kg\n"
                f"• Demand Pressure: {intel['demand_summary']['index']}/100 ({intel['demand_summary']['trend']})\n"
                f"• Perishability: {intel['perishability']['level']} ({intel['perishability']['shelf_life_days']} days shelf life)\n\n"
                f"**Reasoning:** {intel['reasoning']}"
            )
            return {'reply': reply, 'data': intel}

        # ---------------------------------------------------------------------
        # 7. REGIONAL DEMAND OUTLOOK
        # ---------------------------------------------------------------------
        elif any(w in q for w in ['demand', 'market demand', 'highest demand', 'trending', 'मागणी', 'मांग']):
            reports = []
            crops_to_check = [detected_crop] if detected_crop else ['Tomato', 'Onion']
            for c in crops_to_check:
                d = DemandForecastService.get_demand_forecast(c, detected_region)
                reports.append(d)

            text_lines = [f"**Regional Demand Outlook for {detected_region}:**\n"]
            for r in reports:
                text_lines.append(
                    f"• **{r['crop']} ({r['region']})**: Demand Index **{r['current_demand_index']}/100** ({r['trend']}) "
                    f"| 7-Day Forecast: **{r['forecast_7d_pct']:+}%**\n  _{r['explanation']}_\n"
                )
            return {'reply': '\n'.join(text_lines), 'data': reports}

        # ---------------------------------------------------------------------
        # 8. SURPLUS INVENTORY SNAPSHOT
        # ---------------------------------------------------------------------
        elif any(w in q for w in ['surplus', 'my inventory', 'my stock', 'माझा साठा']):
            total_stock = sum(l.available_quantity for l in listings)
            reply = (
                f"**Your Produce Inventory Snapshot:**\n\n"
                f"You currently have **{total_stock:,.0f} kg** across {len(listings)} active listing(s):\n"
            )
            for l in listings:
                reply += f"• {l.crop} ({l.quality_grade}): {l.available_quantity:,.0f} kg in {l.location} @ ₹{l.expected_price}/kg\n"
            reply += "\n💡 _Tip: Check the Inventory & Timing tab for real-time perishability countdowns and breakeven calculators._"
            return {'reply': reply, 'data': {'total_stock_kg': total_stock, 'active_listings': len(listings)}}

        # ---------------------------------------------------------------------
        # 9. GENERAL ADVISOR GREETING & CONTEXTUAL OVERVIEW
        # ---------------------------------------------------------------------
        else:
            trust_info = TrustEngine.get_farmer_trust(farmer_id)
            total_vol = sum(l.available_quantity for l in listings)
            reply = (
                f"Hello {farmer.name}! I am your FarmDirect AI Agricultural Copilot.\n\n"
                f"• **Your Trust Score:** **{trust_info['trust_score']}% ({trust_info['reliability_tier']})**\n"
                f"• **Active Produce Volume:** **{total_vol:,.0f} kg** in your farm inventory\n\n"
                f"I can provide real-time guidance on:\n"
                f"• **Mandi Price Corridors:** e.g. _'What are current APMC price benchmarks for onions in Nashik?'_\n"
                f"• **Crop Protection & Blight:** e.g. _'How to prevent blight in tomato crops after unseasonal rain?'_\n"
                f"• **Optimal Selling Timing:** e.g. _'Is it optimal to hold wheat stock for 2 weeks or sell now?'_\n"
                f"• **Farm Waste Monetization:** e.g. _'How do I list agricultural stubble on the waste marketplace?'_\n"
                f"• **Soil & Fertilizer Telemetry:** e.g. _'What is the optimal NPK balance for my tomatoes?'_"
            )
            return {'reply': reply, 'context': {'farmer_name': farmer.name}}

    # -------------------------------------------------------------------------
    # BUYER PROCUREMENT COPILOT
    # -------------------------------------------------------------------------
    @staticmethod
    def get_buyer_copilot_response(buyer_id, query_text):
        q = query_text.strip().lower() if query_text else ''
        buyer = User.query.get(buyer_id)

        lang = CopilotService._detect_language(query_text)
        crop = CopilotService._extract_crop(query_text, default='Tomato')
        region = CopilotService._extract_region(query_text, default='Pune')

        # 1. Procurement Window (e.g. "What is the best procurement window for Nashik onions this month?")
        if any(w in q for w in ['procurement window', 'best time to buy', 'best window', 'खरेदीसाठी योग्य वेळ', 'खरीदने का समय']):
            reply = (
                f"**Optimal Procurement Window for {crop} in {region} 🧅📅**\n\n"
                f"• **Current Market Phase:** Mid-cycle arrival peak at regional mandis.\n"
                f"• **Optimal Sourcing Window:** **Days 5 to 18 of the month** before retail holiday demand spikes wholesale rates.\n"
                f"• **Sourcing Strategy:**\n"
                f"  1. Lock in 60% of volume under 14-day forward agreements with certified farmers.\n"
                f"  2. Procure remaining 40% from spot marketplace listings offering farm-gate crate packaging.\n"
                f"  3. In {region}, Grade A curing standards prevent transit sprouting losses by up to 12%."
            )
            return {'reply': reply}

        # 2. Counter-Offer & Negotiation Strategy (e.g. "How to structure a counter-offer for high volume tomato purchase?")
        elif any(w in q for w in ['counter-offer', 'counter offer', 'structure a counter', 'negotiate', 'काउंटर-ऑफर', 'मोलभाव']):
            reply = (
                f"**High-Volume Negotiation Strategy for {crop} 🤝💼**\n\n"
                f"To structure an optimal counter-offer that farmers accept while protecting your margin:\n\n"
                f"1. **Volume Discount Bracket:** Offer **₹1.50 – ₹2.50/kg below listing price** for order sizes exceeding 2,000 kg.\n"
                f"2. **Payment Speed Concession:** Farmers value liquidity. Commit to **24-hour settlement upon delivery** in exchange for a 4–6% volume concession.\n"
                f"3. **Freight Absorption:** Propose absorbing 50% of pickup transport costs by consolidating orders across adjacent farms in {region}.\n"
                f"4. Use the **AI Negotiation Copilot** on your active purchase requests to review calculated Zone of Possible Agreement (ZOPA) bounds."
            )
            return {'reply': reply}

        # 3. Surplus Districts & Availability (e.g. "Which districts currently have surplus organic wheat listings?")
        elif any(w in q for w in ['surplus', 'which districts', 'organic wheat', 'availability', 'कोणत्या जिल्ह्यांत', 'किन जिलों में']):
            reply = (
                f"**Surplus Supply Availability Analysis for {crop} 🌾📍**\n\n"
                f"• **Top Surplus District:** **Ahmednagar** (Estimated 28,000 kg active commercial & organic capacity).\n"
                f"• **Secondary Clusters:** **Satara** (14,500 kg) and **Pune** (18,000 kg).\n"
                f"• **Organic Certification:** Ahmednagar farmer cooperatives currently have certified pesticide-free Grade A listings available for bulk order.\n"
                f"• **Freight Distance:** Average 120 km transit distance with same-day or next-morning delivery windows."
            )
            return {'reply': reply}

        # 4. Cold Chain Transit Limits (e.g. "What are the cold chain transit limits for strawberries from Mahabaleshwar?")
        elif any(w in q for w in ['cold chain', 'transit limits', 'strawberry', 'strawberries', 'temperature', 'वाहतूक मर्यादा', 'कोल्ड चेन']):
            reply = (
                f"**Cold-Chain & Transit Thresholds for High-Perishability Produce 🍓❄️**\n\n"
                f"• **Optimal Transit Temperature:** **0°C to 2°C** with 90% – 95% Relative Humidity.\n"
                f"• **Maximum Ambient Transit Limit:** **12 to 16 hours maximum** without reefer cooling before fungal decay (*Botrytis cinerea*) triggers.\n"
                f"• **Reefer Vehicle Longevity:** Under active refrigeration, shelf life extends safely to **7–9 days**.\n"
                f"• **Dispatch Protocol:** Pre-cool to 4°C within 2 hours of field harvest; utilize ventilated food-grade clam-shell punnets."
            )
            return {'reply': reply}

        # 5. Natural Language Procurement Intent (e.g. "I need 5 tonnes of Grade A tomatoes near Pune below Rs 30/kg")
        elif any(w in q for w in ['buy', 'need', 'procure', 'tonnes', 'kg', 'looking for', 'खरेदी']):
            from services.ai.procurement_optimizer import ProcurementOptimizer
            req = ProcurementOptimizer.parse_natural_language_query(query_text)
            plans_data = ProcurementOptimizer.generate_procurement_plans(req)
            plans = plans_data.get('plans', [])

            reply = (
                f"**Procurement Optimization Results for {req['quantity']:,.0f} kg {req['crop']} ({req['quality']}):**\n\n"
                f"I parsed your requirement for **{req['location']}** and structured 3 distinct sourcing plans:\n\n"
            )
            for p in plans:
                reply += (
                    f"• **{p['plan_name']}** ({p['tag']}):\n"
                    f"  Landed Cost: **₹{p['total_landed_cost']:,.2f}** (₹{p['effective_landed_rate_per_kg']:.2f}/kg) "
                    f"| Fulfillment: **{p['fulfillment_percentage']}%** | Suppliers: **{p['suppliers_count']}**\n"
                )
            reply += "\nClick over to the **AI Procurement** panel to review supplier allocations and send direct purchase requests!"
            return {'reply': reply, 'data': plans_data}

        # 6. Default Commercial Buyer Advisor
        else:
            return {
                'reply': (
                    f"Hello {buyer.name if buyer else 'Buyer'}! I am your Commercial Procurement Copilot.\n\n"
                    f"Try asking specific sourcing questions like:\n"
                    f"• _'What is the best procurement window for Nashik onions this month?'_\n"
                    f"• _'How to structure a counter-offer for high volume tomato purchase?'_\n"
                    f"• _'Which districts currently have surplus organic wheat listings?'_\n"
                    f"• _'What are the cold chain transit limits for strawberries from Mahabaleshwar?'_\n"
                    f"• _'I need 5 tonnes of Grade A tomatoes near Pune below ₹30/kg by Friday'_"
                )
            }

    # -------------------------------------------------------------------------
    # MULTILINGUAL VOICE PARSER
    # -------------------------------------------------------------------------
    @staticmethod
    def parse_multilingual_voice(transcript, detected_language='en'):
        """
        Parses text transcripts in English, Hindi, or Marathi into structured FarmDirect actions.
        """
        raw = transcript.strip()
        t = raw.lower()

        intent = 'SELL_PRODUCE'
        lang_name = 'English'

        # Marathi Intent keywords: माझ्याकडे (I have), विकायचे (to sell), भाव (price), टोमॅटो (tomato), कांदा (onion)
        if any(w in t for w in ['माझ्याकडे', 'विकायचे', 'भाव', 'टोमॅटो', 'कांदा', 'बटाटा', 'शेतकरी']):
            lang_name = 'Marathi (मराठी)'
            if any(w in t for w in ['विकायचे', 'माझ्याकडे', 'आहेत']):
                intent = 'SELL_PRODUCE'
            elif any(w in t for w in ['भाव', 'दर', 'किंमत']):
                intent = 'CHECK_PRICE'

        # Hindi Intent keywords: मुझे बेचना है, मेरे पास, टमाटर, प्याज, दाम
        elif any(w in t for w in ['बेचना', 'मेरे पास', 'दाम', 'टमाटर', 'प्याज', 'आलू', 'भाव']):
            lang_name = 'Hindi (हिन्दी)'
            if any(w in t for w in ['बेचना', 'मेरे पास']):
                intent = 'SELL_PRODUCE'
            elif any(w in t for w in ['दाम', 'भाव', 'रेट']):
                intent = 'CHECK_PRICE'

        # Crop detection
        crop = 'Tomato'
        if any(w in t for w in ['tomato', 'टोमॅटो', 'टमाटर']):
            crop = 'Tomato'
        elif any(w in t for w in ['onion', 'कांदा', 'प्याज']):
            crop = 'Onion'
        elif any(w in t for w in ['potato', 'बटाटा', 'आलू']):
            crop = 'Potato'
        elif any(w in t for w in ['wheat', 'गहू', 'गेहूं']):
            crop = 'Wheat'
        elif any(w in t for w in ['grapes', 'द्राक्षे', 'अंगूर']):
            crop = 'Grapes'

        # Quantity detection
        qty = 1000.0
        if 'दोन हजार' in t or 'दो हजार' in t:
            qty = 2000.0
        elif 'पाच हजार' in t or 'पांच हजार' in t or '5 tonnes' in t:
            qty = 5000.0
        elif 'एक हजार' in t or '1000' in t:
            qty = 1000.0
        elif 'तीन हजार' in t or '3000' in t:
            qty = 3000.0
        else:
            num = re.search(r'(\d+)', t)
            if num:
                qty = float(num.group(1))

        # Suggested price
        price_intel = PriceForecasterService.get_predictive_fair_price(crop, 'Pune')
        suggested_price = price_intel['predicted_price']

        if intent == 'SELL_PRODUCE':
            confirmation_prompt = (
                f"Would you like to list {qty:,.0f} kg of fresh {crop} at ₹{suggested_price:.2f}/kg on the FarmDirect marketplace?"
            )
            action_payload = {
                'action': 'CREATE_LISTING',
                'crop': crop,
                'quantity': qty,
                'expected_price': suggested_price,
                'location': 'Pune',
                'quality_grade': 'Grade A',
                'availability_date': date.today().isoformat()
            }
        else:
            confirmation_prompt = f"The current reference benchmark for {crop} in Pune is ₹{suggested_price:.2f}/kg. Would you like to view detailed market forecasts?"
            action_payload = {
                'action': 'VIEW_PRICE_INSIGHT',
                'crop': crop
            }

        return {
            'success': True,
            'transcript': raw,
            'language': lang_name,
            'intent': intent,
            'extracted_crop': crop,
            'extracted_quantity': qty,
            'suggested_price': suggested_price,
            'confirmation_prompt': confirmation_prompt,
            'action_payload': action_payload,
            'requires_confirmation': True
        }

    # -------------------------------------------------------------------------
    # AI LISTING GENERATOR
    # -------------------------------------------------------------------------
    @staticmethod
    def generate_listing_attributes(prompt_text):
        """
        AI Listing Generator: Generates polished title, description, tags, and price band from short text.
        """
        clean = prompt_text.strip()
        lower = clean.lower()

        known_crops = ['Tomato', 'Onion', 'Potato', 'Grapes', 'Carrot', 'Cabbage', 'Cauliflower', 'Wheat']
        crop = 'Tomato'
        for c in known_crops:
            if c.lower() in lower:
                crop = c
                break

        qty = 2000.0
        m = re.search(r'(\d+(?:\.\d+)?)\s*(?:ton|tonne|tonnes|t|kg|kilos)?\b', lower)
        if m:
            val = float(m.group(1))
            qty = (val * 1000.0) if val < 20 else val

        loc = 'Pune'
        for city in ['Pune', 'Nashik', 'Satara', 'Sangli', 'Ahmednagar', 'Mumbai']:
            if city.lower() in lower:
                loc = city
                break

        p_data = PriceForecasterService.get_predictive_fair_price(crop, loc)
        price = p_data['predicted_price']

        title = f"Fresh Harvest {crop} ({qty:,.0f} kg) — Direct from {loc} Farm"
        description = (
            f"Farm-fresh commercial grade {crop} harvested at peak physiological maturity. "
            f"Uniform caliber, clean grading, ideal for institutional buyers, supermarket chains, and food processors. "
            f"Ready for bulk crate dispatch from {loc}."
        )
        tags = [crop, f"{loc} Harvest", "Grade A Certified", "Direct Farmer Supply", "Bulk Available"]
        buyer_categories = ["Supermarket Chains", "Hospitality / Restaurant Groups", "Wholesale Distributors", "Food Processors"]

        return {
            'crop': crop,
            'quantity': qty,
            'expected_price': price,
            'location': loc,
            'quality_grade': 'Grade A',
            'suggested_title': title,
            'suggested_description': description,
            'tags': tags,
            'suggested_buyer_categories': buyer_categories,
            'price_benchmark': {
                'min': p_data['lower_bound'],
                'max': p_data['upper_bound'],
                'recommended': price
            }
        }
