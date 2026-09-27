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

CROP_DISPLAY_MR = {
    'Tomato': 'टोमॅटो', 'Onion': 'कांदा', 'Potato': 'बटाटा', 'Wheat': 'गहू', 'Rice': 'तांदूळ',
    'Grapes': 'द्राक्षे', 'Sugarcane': 'ऊस', 'Cotton': 'कापूस', 'Soybean': 'सोयाबीन',
    'Cabbage': 'कोबी', 'Cauliflower': 'फ्लॉवर', 'Capsicum': 'ढोबळी मिरची', 'Carrot': 'गाजर',
    'Strawberry': 'स्ट्रॉबेरी', 'Garlic': 'लसूण', 'Ginger': 'आले', 'Pomegranate': 'डाळिंब'
}

CROP_DISPLAY_HI = {
    'Tomato': 'टमाटर', 'Onion': 'प्याज', 'Potato': 'आलू', 'Wheat': 'गेहूं', 'Rice': 'चावल',
    'Grapes': 'अंगूर', 'Sugarcane': 'गन्ना', 'Cotton': 'कपास', 'Soybean': 'सोयाबीन',
    'Cabbage': 'पत्तागोभी', 'Cauliflower': 'फूलगोभी', 'Capsicum': 'शिमला मिर्च', 'Carrot': 'गाजर',
    'Strawberry': 'स्ट्रॉबेरी', 'Garlic': 'लहसुन', 'Ginger': 'अदरक', 'Pomegranate': 'अनार'
}

REGION_DISPLAY_MR = {
    'Nashik': 'नाशिक', 'Pune': 'पुणे', 'Satara': 'सातारा', 'Ahmednagar': 'अहमदनगर',
    'Sangli': 'सांगली', 'Mumbai': 'मुंबई', 'Nagpur': 'नागपूर', 'Solapur': 'सोलापूर', 'Kolhapur': 'कोल्हापूर'
}

REGION_DISPLAY_HI = {
    'Nashik': 'नासिक', 'Pune': 'पुणे', 'Satara': 'सातारा', 'Ahmednagar': 'अहमदनगर',
    'Sangli': 'सांगली', 'Mumbai': 'मुंबई', 'Nagpur': 'नागपुर', 'Solapur': 'सोलापुर', 'Kolhapur': 'कोल्हापुर'
}

MARATHI_KEYWORDS = {
    'आहेत', 'आहे', 'करावे', 'रोखावा', 'बाजारभाव', 'कांद्याचे', 'टोमॅटोवरील', 'गव्हाचा',
    'पाचट', 'काडीकचरा', 'थांबवून', 'शेतीतील', 'या', 'कोणती', 'किती', 'कसे', 'नाही',
    'विकायचा', 'काढणी', 'शेतकरी', 'जिल्ह्यांत', 'वाहतूक', 'मर्यादा', 'महिन्यात', 'खरेदीसाठी',
    'योग्य', 'वेळ', 'कशी', 'द्यावी', 'मुबलक', 'आवक', 'सध्या', 'कांदा', 'बटाटा', 'टोमॅटो',
    'गहू', 'द्राक्षे', 'ऊस', 'विकायचे', 'विकणे', 'विकण्याची', 'करावी', 'करावा', 'हवामान',
    'पाऊस', 'कीड', 'खत', 'माती', 'ठिबक', 'सिंचन', 'सांगा', 'पाहिजे', 'होते', 'होती'
}

HINDI_KEYWORDS = {
    'हैं', 'है', 'कैसे', 'बचें', 'रोकना', 'चाहिए', 'अवशेषों', 'बेचें', 'मंडी', 'भाव',
    'क्या', 'इस', 'महीने', 'किन', 'जिलों', 'खरीदने', 'खरीद', 'समय', 'अच्छा', 'सबसे',
    'थोक', 'वर्तमान', 'अधिशेष', 'परिवहन', 'सीमा', 'कहाँ', 'किसे', 'करें', 'तय', 'उपलब्ध',
    'प्याज', 'आलू', 'टमाटर', 'गेहूं', 'अंगूर', 'गन्ना', 'बेचने', 'बेचना', 'रोकें', 'मौसम',
    'बारिश', 'रोग', 'खाद', 'उर्वरक', 'मिट्टी', 'सिंचाई', 'बताएं', 'सकते', 'सकता', 'सकती'
}


class CopilotService:

    @staticmethod
    def _detect_language(text, explicit_lang=None):
        """Accurately detects if text is Hindi, Marathi, or English using tokenized sets."""
        if not text:
            return explicit_lang if explicit_lang in ['hi', 'mr', 'en'] else 'en'

        tokens = set(re.findall(r'[\u0900-\u097F]+', text))
        if tokens:
            hi_hits = len(tokens & HINDI_KEYWORDS)
            mr_hits = len(tokens & MARATHI_KEYWORDS)

            # If user explicitly selected Hindi or Marathi, strongly respect it
            if explicit_lang == 'hi' and mr_hits <= (hi_hits + 1):
                return 'hi'
            if explicit_lang == 'mr' and hi_hits <= (mr_hits + 1):
                return 'mr'

            if hi_hits > mr_hits:
                return 'hi'
            if mr_hits > hi_hits:
                return 'mr'

            if explicit_lang in ['hi', 'mr']:
                return explicit_lang

            # Devanagari default: Marathi if mentions specific MH dialect terms, else Hindi
            t = text.lower()
            if any(w in t for w in ['कांदा', 'गहू', 'द्राक्षे', 'करपा', 'बाजारभाव', 'आहेत', 'करावे']):
                return 'mr'
            return 'hi'

        if explicit_lang in ['hi', 'mr', 'en']:
            return explicit_lang
        return 'en'

    @staticmethod
    def _extract_crop(text, default='Tomato'):
        t = text.lower()
        for k, v in CROPS_MAP.items():
            if k in t:
                return v
        return default

    @staticmethod
    def _extract_region(text, default='Pune'):
        t = text.lower()
        for k, v in REGIONS_MAP.items():
            if k in t:
                return v
        return default

    # -------------------------------------------------------------------------
    # FARMER AI COPILOT
    # -------------------------------------------------------------------------
    @staticmethod
    def get_farmer_copilot_response(farmer_id, query_text, explicit_lang=None):
        q = query_text.strip().lower() if query_text else ''
        farmer = User.query.get(farmer_id)
        if not farmer:
            return {'reply': "Farmer account not found.", 'context': {}}

        listings = ProduceListing.query.filter_by(farmer_id=farmer_id, status='ACTIVE').all()
        default_crop = listings[0].crop if listings else 'Tomato'
        default_region = farmer.farmer_profile.location if (farmer.farmer_profile and farmer.farmer_profile.location) else 'Pune'

        lang = CopilotService._detect_language(query_text, explicit_lang)
        detected_crop = CopilotService._extract_crop(query_text, default=default_crop)
        detected_region = CopilotService._extract_region(query_text, default=default_region)

        crop_mr = CROP_DISPLAY_MR.get(detected_crop, detected_crop)
        crop_hi = CROP_DISPLAY_HI.get(detected_crop, detected_crop)
        region_mr = REGION_DISPLAY_MR.get(detected_region, detected_region)
        region_hi = REGION_DISPLAY_HI.get(detected_region, detected_region)

        # 1. PEST / BLIGHT / DISEASE (e.g. Blight after rain)
        if any(w in q for w in ['blight', 'करपा', 'झुलसा', 'pest', 'disease', 'रोग', 'कीड', 'फवारणी', 'औषध', 'fungus', 'fungicide', 'rot', 'caterpillar', 'spray', 'असमय बारिश', 'अवकाळी']):
            if lang == 'mr':
                reply = (
                    f"**अवकाळी पावसानंतर {crop_mr} वरील रोग/करपा व्यवस्थापन तातडीचा सल्ला 🌧️🌱**\n\n"
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
                    f"**असमय बारिश के बाद {crop_hi} में झुलसा (Blight) व फफूंद नियंत्रण सलाह 🌧️🌱**\n\n"
                    f"बारिश के बाद उच्च आर्द्रता और नमी से अर्ली/लेट ब्लाइट (झुलसा रोग) का प्रकोप तेजी से फैलता है।\n\n"
                    f"### त्वरित कार्रवाई योजना:\n"
                    f"1. **जल निकासी:** खेत से अतिरिक्त पानी तुरंत निकालें। जलभराव से जड़ गलन और फफूंद रोग तेजी से बढ़ते हैं।\n"
                    f"2. **फफूंदनाशक स्प्रे (बारिश रुकने के 24-48 घंटे के भीतर):**\n"
                    f"   • **शुरुआती बचाव:** **मैनकोजेब 75% WP** @ 2.5 ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें।\n"
                    f"   • **लक्षण दिखने पर:** **मेटालेक्सिल + मैनकोजेब** (रिडोमिल गोल्ड) @ 2 ग्राम प्रति लीटर पानी का छिड़काव करें।\n"
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
                    f"   • Suspend heavy nitrogen/urea top-dressing until weather stabilizes.\n"
                    f"   • Apply Potassium Phosphite or 0:52:34 @ 4 g/L to reinforce plant cell-wall rigidity.\n\n"
                    f"4. **Biological Alternative:**\n"
                    f"   • Spray *Trichoderma viride* or *Pseudomonas fluorescens* @ 5 ml/L during cool morning hours."
                )
            return {'reply': reply, 'category': 'CROP_PROTECTION'}

        # 2. STOCK HOLDING VS SELLING TIME (e.g. hold wheat for 2 weeks)
        elif any(w in q for w in ['hold', '2 weeks', 'हफ्ते', 'आठवडे', 'थांबवून', 'रोकना', 'sell now or wait', 'wait or sell', 'साठा', 'स्टॉक रोकना']):
            is_durable = detected_crop.lower() in ['wheat', 'rice', 'soybean', 'cotton', 'garlic']
            price_intel = PriceForecasterService.get_predictive_fair_price(detected_crop, detected_region)

            if lang == 'mr':
                verdict = "२ ते ३ आठवडे थांबून विक्री करणे फायदेशीर ठरेल" if is_durable else "लवकर विक्री करणे किंवा शीतगृहात ठेवणे योग्य ठरेल"
                reply = (
                    f"**{crop_mr} साठा मूल्यांकन व विक्री वेळ विश्लेषण ({region_mr}) 🌾📊**\n\n"
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
                    f"**{crop_hi} स्टॉक होल्डिंग व सेलिंग टाइम विश्लेषण ({region_hi}) 🌾📊**\n\n"
                    f"• **फसल श्रेणी:** {'टिकाऊ अनाज / दलहन' if is_durable else 'जल्द खराब होने वाली बागवानी फसल'}\n"
                    f"• **वर्तमान संदर्भ भाव:** ₹{price_intel['predicted_price']:.2f}/किग्रा (दायरा: ₹{price_intel['lower_bound']:.2f} - ₹{price_intel['upper_bound']:.2f})\n"
                    f"• **रणनीतिक निष्कर्ष:** **{verdict}**\n\n"
                    f"### मुख्य बाजार विश्लेषण:\n"
                    f"1. **मंडी आवक:** फसल कटाई के बाद मंडियों में भारी आवक के कारण दाम थोड़े दबाव में हैं। 2 हफ्ते बाद आवक घटने पर **₹150 - ₹250 प्रति क्विंटल** का उछाल संभव है।\n"
                    f"2. **सुरक्षित भंडारण:** {'अनाज में नमी 12% से कम रखें और कीट नियंत्रण के लिए सुरक्षित भंडारण करें।' if is_durable else 'बिना कोल्ड चेन के अधिक दिन न रोकें, गुणवत्ता गिरने का जोखिम है।'}\n"
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

        # 3. APMC & MANDI PRICE BENCHMARKS (e.g. Onion prices in Nashik)
        elif any(w in q for w in ['price', 'rate', 'benchmark', 'apmc', 'mandi', 'भाव', 'बाजारभाव', 'दर', 'दाम', 'bhav', 'cost', 'list at', 'fair price']):
            p = PriceForecasterService.get_predictive_fair_price(detected_crop, detected_region, 'Grade A', 1000)

            if lang == 'mr':
                reply = (
                    f"**{region_mr} बाजार समिती (APMC) {crop_mr} चालू बाजारभाव व विश्लेषण 🧅📊**\n\n"
                    f"• **शिफारस केलेला थेट विक्री दर:** **₹{p['predicted_price']:.2f}/किलो**\n"
                    f"• **किफायतशीर बाजारभाव पट्टा:** **₹{p['lower_bound']:.2f} ते ₹{p['upper_bound']:.2f}/किलो**\n"
                    f"• **१,००० किलो (१ टन) अपेक्षित उत्पन्न:** **₹{p['expected_revenue']:,.2f}**\n\n"
                    f"_{p['factors'][0]} ({p['factors'][1]})._\n\n"
                    f"💡 **शेतकरी सल्ला:** फार्मडायरेक्टवर थेट विक्री केल्यास हमाली व दलालीचे ६-८% वाचून थेट खरेदीदारांकडून उत्तम नफा मिळवता येतो."
                )
            elif lang == 'hi':
                reply = (
                    f"**{region_hi} मंडी (APMC) में {crop_hi} का वर्तमान भाव व विश्लेषण 🧅📊**\n\n"
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

        # 4. FARM WASTE & STUBBLE MARKETPLACE
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
                    f"1. Navigate to **Waste Market** in top navigation or visit `/waste-marketplace`.\n"
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

        # 5. SOIL HEALTH & FERTILIZERS
        elif any(w in q for w in ['soil', 'npk', 'fertilizer', 'urea', 'dap', 'खत', 'माती', 'युरिया', 'ph']):
            if lang == 'mr':
                reply = (
                    f"**{crop_mr} पिकासाठी खत व्यवस्थापन व माती आरोग्य सल्ला 🌱🧪**\n\n"
                    f"• **संतुलित NPK प्रमाण:** १२०:६०:६० किलो प्रति हेक्टरी प्रमाण उत्तम उत्पादनासाठी आवश्यक आहे.\n"
                    f"• **पायाभूत खत (Basal Dose):** पेरणी/लागवडीवेळी ५०% नत्र, १००% स्फुरद (Single Super Phosphate) व ५०% पालाश द्या.\n"
                    f"• **माती pH व सूक्ष्मअन्नद्रव्ये:** आपल्या शेतातील मातीचे रिअल-टाइम NPK व pH रीडिंग पाहण्यासाठी **Farm Digital Twin** डॅशबोर्ड तपासा."
                )
            elif lang == 'hi':
                reply = (
                    f"**{crop_hi} के लिए संतुलित उर्वरक व मृदा स्वास्थ्य सलाह 🌱🧪**\n\n"
                    f"• **अनुशंसित NPK अनुपात:** 120:60:60 किग्रा/हेक्टेयर का संतुलित प्रयोग अच्छी वृद्धि और फलत के लिए आवश्यक है।\n"
                    f"• **बेसल डोज:** बुवाई/रोपाई के समय 50% नाइट्रोजन, 100% फास्फोरस (SSP) और 50% पोटाश (MOP) का प्रयोग करें।\n"
                    f"• **डिजिटल ट्विन टेलीमेट्री:** अपने खेत की मिट्टी का पीएच (pH), नमी और नाइट्रोजन स्तर जांचने के लिए **Farm Digital Twin** का उपयोग करें।"
                )
            else:
                reply = (
                    f"**Soil Nutrition & Fertilizer Advisory for {detected_crop} 🌱🧪**\n\n"
                    f"• **Recommended NPK Ratio:** Balanced split application of 120:60:60 kg/ha for optimal vegetative growth and flowering.\n"
                    f"• **Basal Dose:** Apply 50% Nitrogen, 100% Phosphorus (Single Super Phosphate), and 50% Potash (MOP) at planting.\n"
                    f"• **Top-Dressing:** Split remaining Nitrogen at 30 and 45 days after transplantation.\n"
                    f"• **Micronutrient Health:** Check your live **Farm Digital Twin** telemetry for real-time Nitrogen, Phosphorus, Potassium, and soil pH levels."
                )
            return {'reply': reply, 'category': 'SOIL_NUTRITION'}

        # 6. WEATHER & HARVEST DISRUPTION RISK
        elif any(w in q for w in ['weather', 'climate', 'rain', 'disruption', 'temperature', 'frost', 'storm', 'मौसम', 'हवामान', 'बारिश', 'पाऊस', 'जोखिम', 'तापमान', 'अवकाळी', 'गारपीट', 'धुके']):
            if lang == 'mr':
                reply = (
                    f"**{region_mr} परिसरात {crop_mr} पिकासाठी हवामान व काढणी जोखीम अहवाल ⛅🌧️**\n\n"
                    f"• **चालू हवामान जोखीम स्तर:** **कमी ते मध्यम (२८/१००)** — आगामी २-३ दिवसांत हलक्या पावसाची शक्यता.\n"
                    f"• **काढणी सुरक्षितता:** काढणीयोग्य {crop_mr} पिकाची तोडणी कोरड्या वेळेत पूर्ण करा आणि मुळाशी पाण्याचा निचरा योग्य ठेवा.\n"
                    f"• **संरक्षण उपाय:** तोडणी केलेला शेतीमाल तात्काळ सुरक्षित शेड किंवा प्लास्टिक ताडपत्री खाली साठवा, जेणेकरून ओलाव्यामुळे बुरशीचा प्रादुर्भाव होणार नाही.\n"
                    f"• आपल्या शेतातील रिअल-टाइम आर्द्रता व पर्जन्यमान तपासण्यासाठी **Farm Digital Twin** डॅशबोर्ड पहा."
                )
            elif lang == 'hi':
                reply = (
                    f"**{region_hi} क्षेत्र में {crop_hi} की फसल हेतु मौसम व कटाई जोखिम विश्लेषण ⛅🌧️**\n\n"
                    f"• **वर्तमान मौसम जोखिम स्तर:** **सामान्य से मध्यम (28/100)** — अगले 72 घंटों में छिटपुट बादलों व हल्की वर्षा का अनुमान।\n"
                    f"• **कटाई व तुड़ाई प्रोटोकॉल:** पकी हुई फसल की तुड़ाई सूखे समय में ही करें ताकि नमी से फफूंद न लगे।\n"
                    f"• **फसल सुरक्षा:** खेत में कटी हुई उपज को तिरपाल से ढकें और जमीन से ऊपर क्रेट्स में रखें। जलभराव रोकने के लिए नालियां साफ रखें।\n"
                    f"• लाइव माइक्रो-क्लाइमेट और मिट्टी की नमी का सटीक डेटा देखने के लिए **Farm Digital Twin** डॅशबोर्ड का उपयोग करें।"
                )
            else:
                reply = (
                    f"**Weather Disruption & Harvest Risk Outlook for {detected_crop} ({detected_region}) ⛅🌧️**\n\n"
                    f"• **Active Risk Score:** **Low to Moderate (28/100)** — Isolated localized precipitation possible over next 48–72 hours.\n"
                    f"• **Harvest Timing:** Accelerate field harvest during dry daylight windows; avoid picking while dew or surface wetness is present.\n"
                    f"• **Post-Harvest Protection:** Store harvested crates under ventilated sheltered sheds to prevent moisture stagnation and microbial rot.\n"
                    f"• Check your farm's live micro-climate and soil moisture levels directly on the **Farm Digital Twin** page."
                )
            return {'reply': reply, 'category': 'WEATHER_RISK', 'action_suggestion': '/farmer/digital-twin'}

        # 7. IRRIGATION & WATER MANAGEMENT
        elif any(w in q for w in ['water', 'irrigation', 'drip', 'पानी', 'सिंचाई', 'ड्रिप', 'ठिबक', 'सिंचन', 'पाणी']):
            if lang == 'mr':
                reply = (
                    f"**{crop_mr} पिकासाठी ठिबक सिंचन व पाणी व्यवस्थापन 💧🌱**\n\n"
                    f"• **पाण्याची गरज:** जमिनीतील वाफसा टिकवून ठेवण्यासाठी दर २ ते ३ दिवसांनी सकाळी ठिबकद्वारे २-३ तास पाणी द्या.\n"
                    f"• **फुलधारणा व फळधारणा टप्पा:** या काळात पाण्याचा ताण पडू देऊ नका; अन्यथा फळगळ किंवा तडकण्याचा धोका असतो.\n"
                    f"• **पाणी बचत:** प्लास्टिक मल्चिंगचा वापर केल्यास पाण्याचे बाष्पीभवन ४०% कमी होते."
                )
            elif lang == 'hi':
                reply = (
                    f"**{crop_hi} के लिए ड्रिप सिंचाई व जल प्रबंधन परामर्श 💧🌱**\n\n"
                    f"• **सिंचाई अंतराल:** खेत में उचित नमी बनाए रखने के लिए ड्रिप द्वारा 2 से 3 दिन के अंतराल पर सुबह के समय पानी दें।\n"
                    f"• **फूल व फल अवस्था:** इस संवेदनशील समय में न तो जलभराव होने दें और न ही सूखा पड़ने दें।\n"
                    f"• **जल संरक्षण:** ड्रिप फर्टिगेशन से 30-40% पानी और उर्वरक दोनों की बचत होती है।"
                )
            else:
                reply = (
                    f"**Precision Water & Drip Irrigation Advisory for {detected_crop} 💧🌱**\n\n"
                    f"• **Optimal Irrigation Cycle:** Deliver scheduled morning drip irrigations every 2–3 days to sustain root-zone aerobic moisture.\n"
                    f"• **Critical Growth Stages:** Maintain steady moisture during flowering and fruit setting; avoid sudden moisture swings.\n"
                    f"• **Telemetry Integration:** Review soil moisture sensors on your **Farm Digital Twin** to automate watering triggers."
                )
            return {'reply': reply, 'category': 'IRRIGATION'}

        # 8. GENERAL SELL NOW / HARVEST TIMING
        elif any(w in q for w in ['sell now', 'what to sell', 'when to sell', 'selling time', 'best time', 'best time to sell', 'timing', 'recommendation', 'विक्री', 'विकण्याची', 'विकायची', 'विकणे', 'केव्हा विकावे', 'बेचना', 'बेचने', 'बेचें', 'सही समय', 'सबसे सही समय', 'कब बेचें', 'समय']):
            p_fair = PriceForecasterService.get_predictive_fair_price(detected_crop, detected_region, 'Grade A', 1000)
            if not listings:
                if lang == 'mr':
                    no_list = (
                        f"**{detected_region} {crop_mr} विक्री वेळ व भाव विश्लेषण 📅📈**\n\n"
                        f"• **चालू संदर्भ भाव:** ₹{p_fair['predicted_price']:.2f}/किलो (अपेक्षित पट्टा: ₹{p_fair['lower_bound']:.2f} ते ₹{p_fair['upper_bound']:.2f}/किलो)\n"
                        f"• **विक्रीसाठी योग्य वेळ:** पुढील १० ते १४ दिवसांत आवक संतुलित झाल्यावर विक्री करणे अधिक फायदेशीर ठरेल.\n"
                        f"• आगामी काढणीची नोंदणी करण्यासाठी **'Add Listing'** वर क्लिक करा."
                    )
                elif lang == 'hi':
                    no_list = (
                        f"**{detected_region} {crop_hi} बेचने का सबसे सही समय व भाव विश्लेषण 📅📈**\n\n"
                        f"• **वर्तमान संदर्भ भाव:** ₹{p_fair['predicted_price']:.2f}/किग्रा (दायरा: ₹{p_fair['lower_bound']:.2f} – ₹{p_fair['upper_bound']:.2f}/किग्रा)\n"
                        f"• **बेचने का सबसे अनुकूल समय:** अगले 10 से 14 दिनों के भीतर जब मंडी आवक स्थिर होगी, बेहतर लाभ मिलेगा।\n"
                        f"• आगामी फसल को सीधे खरीदारों तक पहुंचाने हेतु **'Add Listing'** का उपयोग करें।"
                    )
                else:
                    no_list = (
                        f"**Market Timing & Selling Opportunity for {detected_crop} ({detected_region}) 📅📈**\n\n"
                        f"• **Current Benchmark:** ₹{p_fair['predicted_price']:.2f}/kg (Corridor: ₹{p_fair['lower_bound']:.2f} – ₹{p_fair['upper_bound']:.2f}/kg)\n"
                        f"• **Optimal Selling Window:** Over the next 10–14 days as peak post-harvest arrival pressure stabilizes.\n"
                        f"• Create a new active listing to receive direct buyer offers at zero commission."
                    )
                return {'reply': no_list, 'action_suggestion': '/farmer/listings/new', 'category': 'MARKET_TIMING'}

            top_listing = listings[0]
            intel = SmartSellingService.evaluate_selling_time(
                top_listing.crop,
                top_listing.expected_price,
                top_listing.available_quantity,
                top_listing.location
            )
            if lang == 'mr':
                reply = (
                    f"**{intel['crop']} धोरणात्मक विक्री शिफारस: {intel['decision']} ({top_listing.location}) 🌾📊**\n\n"
                    f"{intel['headline']}\n\n"
                    f"• **चालू दर:** ₹{intel['current_price']:.2f}/किलो | **७ दिवसांचा अंदाजित दर:** ₹{intel['predicted_future_price']:.2f}/किलो\n"
                    f"• **मागणी निर्देशांक:** {intel['demand_summary']['index']}/१०० ({intel['demand_summary']['trend']})\n"
                    f"• **टिकाऊ क्षमता:** {intel['perishability']['level']} ({intel['perishability']['shelf_life_days']} दिवस)\n\n"
                    f"**विश्लेषण:** {intel['reasoning']}"
                )
            elif lang == 'hi':
                reply = (
                    f"**{intel['crop']} रणनीतिक बिक्री सिफारिश: {intel['decision']} ({top_listing.location}) 🌾📊**\n\n"
                    f"{intel['headline']}\n\n"
                    f"• **वर्तमान मूल्य:** ₹{intel['current_price']:.2f}/किग्रा | **7-दिवसीय अनुमानित मूल्य:** ₹{intel['predicted_future_price']:.2f}/किग्रा\n"
                    f"• **डिमांड इंडेक्स:** {intel['demand_summary']['index']}/100 ({intel['demand_summary']['trend']})\n"
                    f"• **शेल्फ लाइफ:** {intel['perishability']['level']} ({intel['perishability']['shelf_life_days']} दिन)\n\n"
                    f"**मुख्य कारण:** {intel['reasoning']}"
                )
            else:
                reply = (
                    f"**Strategic Selling Recommendation for {intel['crop']}: {intel['decision']}**\n\n"
                    f"{intel['headline']}\n\n"
                    f"• Current Price: ₹{intel['current_price']:.2f}/kg | Projected 7-day Price: ₹{intel['predicted_future_price']:.2f}/kg\n"
                    f"• Demand Pressure: {intel['demand_summary']['index']}/100 ({intel['demand_summary']['trend']})\n"
                    f"• Perishability: {intel['perishability']['level']} ({intel['perishability']['shelf_life_days']} days shelf life)\n\n"
                    f"**Reasoning:** {intel['reasoning']}"
                )
            return {'reply': reply, 'data': intel, 'category': 'MARKET_TIMING'}

        # 9. REGIONAL DEMAND
        elif any(w in q for w in ['demand', 'market demand', 'highest demand', 'trending', 'मागणी', 'मांग']):
            d = DemandForecastService.get_demand_forecast(detected_crop, detected_region)
            if lang == 'mr':
                reply = (
                    f"**{region_mr} विभागातील {crop_mr} मागणी अहवाल 📈**\n\n"
                    f"• **चालू मागणी निर्देशांक:** **{d['current_demand_index']:.1f}/१००** ({d['trend']})\n"
                    f"• **७ दिवसांचा अंदाज:** **{d['forecast_7d_pct']:+}%**\n"
                    f"• **बाजार विश्लेषण:** {d['explanation']}"
                )
            elif lang == 'hi':
                reply = (
                    f"**{region_hi} क्षेत्र में {crop_hi} की बाजार मांग का विश्लेषण 📈**\n\n"
                    f"• **वर्तमान डिमांड इंडेक्स:** **{d['current_demand_index']:.1f}/100** ({d['trend']})\n"
                    f"• **7-दिवसीय पूर्वानुमान:** **{d['forecast_7d_pct']:+}%**\n"
                    f"• **बाजार अंतर्दृष्टि:** {d['explanation']}"
                )
            else:
                reply = (
                    f"**Regional Demand Outlook for {detected_crop} ({detected_region}) 📈**\n\n"
                    f"• **Current Demand Index:** **{d['current_demand_index']:.1f}/100** ({d['trend']})\n"
                    f"• **7-Day Demand Forecast:** **{d['forecast_7d_pct']:+}%**\n"
                    f"• **Market Dynamics:** {d['explanation']}"
                )
            return {'reply': reply, 'data': d, 'category': 'DEMAND_OUTLOOK'}

        # 10. INTELLIGENT CONTEXTUAL ADVISORY FALLBACK
        else:
            p_fallback = PriceForecasterService.get_predictive_fair_price(detected_crop, detected_region, 'Grade A', 1000)
            if lang == 'mr':
                reply = (
                    f"**फार्मडायरेक्ट कृषी सल्लागार: {crop_mr} ({region_mr}) 🌾🤖**\n\n"
                    f"आपल्या प्रश्नाबाबत शेती विषयक विश्लेषण:\n\n"
                    f"• **बाजार दर अंदाज:** सध्या {region_mr} मध्ये {crop_mr} चा शिफारस केलेला दर **₹{p_fallback['predicted_price']:.2f}/किलो** आहे.\n"
                    f"• **पीक नियोजन:** योग्य खत व्यवस्थापन, कीड नियंत्रण आणि वेळेवर काढणी करून फार्मडायरेक्टवर थेट खरेदीदारांशी सौदा करा.\n\n"
                    f"💡 _आपण मला हवामान जोखीम, करपा/रोग नियंत्रण, मंडी भाव, किंवा शेती कचरा विक्रीबाबत विचारू शकता._"
                )
            elif lang == 'hi':
                reply = (
                    f"**फार्मडायरेक्ट कृषि सलाहकार: {crop_hi} ({region_hi}) 🌾🤖**\n\n"
                    f"आपकी पूछताछ के संदर्भ में मुख्य कृषि अंतर्दृष्टि:\n\n"
                    f"• **बाजार संदर्भ भाव:** वर्तमान में {region_hi} में {crop_hi} का अनुमानित उचित मूल्य **₹{p_fallback['predicted_price']:.2f}/किग्रा** है।\n"
                    f"• **कृषि कार्य योजना:** संतुलित पोषक तत्व प्रबंधन, नियमित फसल निगरानी तथा सही समय पर तुड़ाई करके फार्मडायरेक्ट पर सीधे खरीदारों से जुड़ें।\n\n"
                    f"💡 _आप मुझसे मौसम का जोखिम, झुलसा/कीट नियंत्रण, मंडी भाव, या पराली/बायोमास बेचने के बारे में भी पूछ सकते हैं।_"
                )
            else:
                reply = (
                    f"**FarmDirect Agronomic AI Advisory: {detected_crop} ({detected_region}) 🌾🤖**\n\n"
                    f"• **Current Market Benchmark:** Fair predictive price in {detected_region} is **₹{p_fallback['predicted_price']:.2f}/kg**.\n"
                    f"• **Field Guidance:** Maintain balanced crop nutrition, monitor canopy health, and leverage FarmDirect for direct buyer sales.\n\n"
                    f"💡 _You can ask specific questions about weather disruption risk, disease/blight prevention, market holding strategy, or farm waste listing._"
                )
            return {'reply': reply, 'category': 'GENERAL_ADVISORY', 'context': {'crop': detected_crop, 'region': detected_region}}

    # -------------------------------------------------------------------------
    # BUYER PROCUREMENT COPILOT
    # -------------------------------------------------------------------------
    @staticmethod
    def get_buyer_copilot_response(buyer_id, query_text, explicit_lang=None):
        q = query_text.strip().lower() if query_text else ''
        buyer = User.query.get(buyer_id)

        lang = CopilotService._detect_language(query_text, explicit_lang)
        crop = CopilotService._extract_crop(query_text, default='Onion')
        region = CopilotService._extract_region(query_text, default='Nashik')

        crop_mr = CROP_DISPLAY_MR.get(crop, crop)
        crop_hi = CROP_DISPLAY_HI.get(crop, crop)
        region_mr = REGION_DISPLAY_MR.get(region, region)
        region_hi = REGION_DISPLAY_HI.get(region, region)

        # 1. Procurement Window (e.g. "What is the best procurement window for Nashik onions this month?")
        # Match flexible combinations of buy/procure/window/timing
        is_timing_q = (
            any(w in q for w in ['procurement window', 'best time to buy', 'best window', 'खरेदीसाठी योग्य वेळ', 'खरीदने का समय', 'सबसे अच्छा समय', 'योग्य वेळ'])
            or (any(w in q for w in ['खरेदी', 'खरीद', 'buy', 'procure']) and any(w in q for w in ['वेळ', 'समय', 'टाइम', 'महिना', 'महीने', 'month']))
        )

        if is_timing_q:
            if lang == 'mr':
                reply = (
                    f"**{region_mr} {crop_mr} खरेदीसाठी योग्य वेळ व खरेदी धोरण 🧅📅**\n\n"
                    f"• **चालू बाजार आवक स्थिती:** बाजार समित्यांमध्ये काढणीनंतरची नियमित आवक सुरू आहे.\n"
                    f"• **खरेदीसाठी सर्वात योग्य कालावधी:** **महिन्याचे ५ ते १८ दिवस** (या काळात सणासुदीच्या घाऊक दरवाढीपूर्वी आवक भरपूर आणि दर स्थिर असतात).\n\n"
                    f"### खरेदीदारांसाठी शिफारसी:\n"
                    f"1. **फॉरवर्ड करार:** लागणाऱ्या एकूण साठ्यापैकी ६०% माल प्रमाणित शेतकऱ्यांकडून १४ दिवसांच्या आगाऊ कराराने बुक करा.\n"
                    f"2. **ग्रेडिंग तपासणी:** {region_mr} परिसरात चांगल्या सुकवलेल्या (Cured) कांद्याची प्रत निवडा, ज्यामुळे वाहतुकीदरम्यान होणारे कोंब फुटण्याचे नुकसान १०-१२% टाळता येते.\n"
                    f"3. **थेट बचत:** फार्मडायरेक्टवरून थेट खरेदी केल्यास अडत व कमिशन वाचून थेट शेतकऱ्यांकडून चांगला माल मिळवता येतो."
                )
            elif lang == 'hi':
                reply = (
                    f"**{region_hi} {crop_hi} खरीद के लिए सर्वोत्तम समय व रणनीति 🧅📅**\n\n"
                    f"• **वर्तमान बाजार चरण:** मंडियों में फसल आवक का स्थिर प्रवाह बना हुआ है।\n"
                    f"• **खरीदने का सबसे अच्छा समय:** **महीने के 5 से 18 तारीख के बीच** (त्योहारी मांग और थोक कीमतों में उछाल से ठीक पहले दरें सबसे अनुकूल रहती हैं)।\n\n"
                    f"### कमर्शियल बायर्स हेतु रणनीतिक सुझाव:\n"
                    f"1. **अग्रिम बुकिंग:** अपनी कुल आवश्यकता का 60% हिस्सा प्रमाणित किसानों से 14-दिन के फॉरवर्ड एग्रीमेंट के तहत फिक्स करें।\n"
                    f"2. **ग्रेड ए गुणवत्ता:** {region_hi} में अच्छी तरह छांटे और सुखाए गए (Cured) प्याज की खरीद करें, जिससे नमी और अंकुरण से होने वाला 10-12% नुकसान रुकता है।\n"
                    f"3. **डायरेक्ट प्रोक्योरमेंट:** फार्मडायरेक्ट प्लेटफॉर्म पर किसानों से सीधे सौदे करके मंडी कमीशन और बिचौलियों के मुनाफे की बचत करें।"
                )
            else:
                reply = (
                    f"**Optimal Procurement Window for {crop} in {region} 🧅📅**\n\n"
                    f"• **Current Market Phase:** Mid-cycle arrival peak across regional mandis.\n"
                    f"• **Optimal Sourcing Window:** **Days 5 to 18 of the month** before holiday institutional demand triggers wholesale spikes.\n\n"
                    f"### Strategic Procurement Playbook:\n"
                    f"1. **Forward Volume Locking:** Lock in 60% of projected volume under 14-day supply agreements with verified farmers.\n"
                    f"2. **Quality Curing:** In {region}, certified well-cured bulbs reduce in-transit sprouting wastage by 10–12%.\n"
                    f"3. **Direct Sourcing:** Procuring directly via FarmDirect eliminates 6–8% APMC intermediary spreads and secures field-gate traceability."
                )
            return {'reply': reply, 'category': 'PROCUREMENT_WINDOW'}

        # 2. Counter-Offer & Negotiation Strategy
        elif any(w in q for w in ['counter-offer', 'counter offer', 'structure a counter', 'negotiate', 'काउंटर-ऑफर', 'काउंटर ऑफर', 'मोलभाव']):
            if lang == 'mr':
                reply = (
                    f"**मोठ्या प्रमाणातील {crop_mr} खरेदीसाठी प्रभावी काउंटर-ऑफर कशी द्यावी? 🤝💼**\n\n"
                    f"शेतकऱ्यांशी यशस्वी वाटाघाटी करून किफायतशीर दर मिळवण्यासाठी खालील पद्धत वापरा:\n\n"
                    f"1. **व्हॉल्यूम डिस्काउंट (घाऊक सवलत):** २,००० किलोपेक्षा जास्त मागणी असल्यास मूळ दरापेक्षा **₹१.५० ते ₹२.५०/किलो कमी** ऑफर करा.\n"
                    f"2. **त्वरित पेमेंटची हमी:** शेतकऱ्यांना खेळत्या भांडवलाची गरज असते. डिलिव्हरी झाल्यावर २४ तासांत खात्यावर पैसे जमा करण्याचे आश्वासन देऊन ४-६% दर कमी करून घ्या.\n"
                    f"3. **वाहतूक खर्चाची विभागणी:** {region_mr} मधील जवळच्या शेतांमधून एकाच ट्रकमध्ये माल गोळा (Consolidation) करून ५०% वाहतूक खर्च उचलण्याची तयारी दर्शवा.\n"
                    f"4. आपल्या सक्रिय खरेदी प्रस्तावांवर **AI Negotiation Copilot** तपासून योग्य तोडगा निश्चित करा."
                )
            elif lang == 'hi':
                reply = (
                    f"**थोक {crop_hi} खरीद के लिए प्रभावी काउंटर-ऑफर रणनीति 🤝💼**\n\n"
                    f"किसानों के साथ उचित और लाभप्रद सौदा तय करने के लिए इन रणनीतियों का उपयोग करें:\n\n"
                    f"1. **मात्रा आधारित छूट:** 2,000 किग्रा से अधिक के ऑर्डर पर लिस्टिंग मूल्य से **₹1.50 - ₹2.50/किग्रा कम** का काउंटर-ऑफर दें।\n"
                    f"2. **त्वरित भुगतान की शर्त:** डिलीवरी के 24 घंटे के भीतर सीधे बैंक ट्रांसफर का भरोसा देकर किसान से 4% से 6% का वॉल्यूम डिस्काउंट प्राप्त करें।\n"
                    f"3. **परिवहन साझीदारी:** {region_hi} के नजदीकी खेतों से एक साथ पिकअप प्लान करके 50% भाड़ा खुद वहन करने का प्रस्ताव दें।\n"
                    f"4. अपने पेंडिंग ऑर्डर्स पर **AI Negotiation Copilot** कार्ड का प्रयोग करें जो दोनों पक्षों के लिए अनुकूल प्राइस रेंज (ZOPA) सुझाता है।"
                )
            else:
                reply = (
                    f"**High-Volume Negotiation Strategy for {crop} 🤝💼**\n\n"
                    f"To structure an optimal counter-offer that farmers accept while protecting your margin:\n\n"
                    f"1. **Volume Discount Bracket:** Offer **₹1.50 – ₹2.50/kg below listing price** for order sizes exceeding 2,000 kg.\n"
                    f"2. **Payment Speed Concession:** Farmers value rapid liquidity. Commit to **24-hour settlement upon delivery** in exchange for a 4–6% volume concession.\n"
                    f"3. **Freight Absorption:** Propose absorbing 50% of pickup transport costs by consolidating orders across adjacent farms in {region}.\n"
                    f"4. Use the **AI Negotiation Copilot** on your active purchase requests to review calculated Zone of Possible Agreement (ZOPA) bounds."
                )
            return {'reply': reply, 'category': 'NEGOTIATION_STRATEGY'}

        # 3. Surplus Districts & Organic Availability
        elif any(w in q for w in ['surplus', 'which districts', 'organic wheat', 'availability', 'कोणत्या जिल्ह्यांत', 'किन जिलों में', 'अधिशेष', 'मुबलक आवक', 'सेंद्रिय', 'जैविक']):
            if lang == 'mr':
                reply = (
                    f"**सेंद्रिय {crop_mr} व शेतीमालाची मुबलक आवक असणारे जिल्हे 🌾📍**\n\n"
                    f"• **प्रथम क्रमांकाचा जिल्हा:** **अहमदनगर (Ahmednagar)** — अंदाजे २८,००० किलो व्यावसायिक व सेंद्रिय गव्हाची सक्रिय उपलब्धता.\n"
                    f"• **दुय्यम केंद्रे:** **सातारा** (१४,५०० किलो) आणि **पुणे** (१८,००० किलो).\n"
                    f"• **सेंद्रिय प्रमाणीकरण:** अहमदनगर येथील शेतकरी उत्पादक कंपन्यांकडे (FPO) कीटकनाशक-मुक्त ग्रेड-ए धान्य उपलब्ध आहे.\n"
                    f"• **वाहतूक अंतर:** सरासरी १२० किमी अंतर असून त्याच दिवशी किंवा दुसऱ्या दिवशी सकाळी डिलिव्हरी शक्य आहे."
                )
            elif lang == 'hi':
                reply = (
                    f"**जैविक {crop_hi} व अधिशेष (Surplus) उत्पादन वाले शीर्ष जिले 🌾📍**\n\n"
                    f"• **शीर्ष उत्पादक जिला:** **अहमदनगर (Ahmednagar)** — लगभग 28,000 किग्रा प्रमाणित जैविक व ग्रेड-ए गेहूं उपलब्ध।\n"
                    f"• **अन्य प्रमुख क्लस्टर:** **सातारा** (14,500 किग्रा) और **पुणे** (18,000 किग्रा)।\n"
                    f"• **गुणवत्ता व प्रमाणन:** स्थानीय किसान समूहों के पास रसायन-मुक्त और सॉर्टेड स्टॉक सीधे थोक ऑर्डर के लिए तैयार है।\n"
                    f"• **लॉजिस्टिक्स डिलीवरी:** 100-150 किमी की दूरी पर 24 घंटे के भीतर सीधी डिलीवरी व्यवस्था उपलब्ध है।"
                )
            else:
                reply = (
                    f"**Surplus Supply Availability Analysis for {crop} 🌾📍**\n\n"
                    f"• **Top Surplus District:** **Ahmednagar** (Estimated 28,000 kg active commercial & organic capacity).\n"
                    f"• **Secondary Clusters:** **Satara** (14,500 kg) and **Pune** (18,000 kg).\n"
                    f"• **Organic Certification:** Ahmednagar farmer cooperatives currently have certified pesticide-free Grade A listings available for bulk order.\n"
                    f"• **Freight Distance:** Average 120 km transit distance with same-day or next-morning delivery windows."
                )
            return {'reply': reply, 'category': 'SURPLUS_AVAILABILITY'}

        # 4. Cold Chain Transit Limits
        elif any(w in q for w in ['cold chain', 'transit limits', 'strawberry', 'strawberries', 'temperature', 'वाहतूक मर्यादा', 'कोल्ड चेन', 'परिवहन सीमा']):
            if lang == 'mr':
                reply = (
                    f"**महाबळेश्वर {crop_mr} व नाशवंत फळांसाठी कोल्ड चेन वाहतूक निकष 🍓❄️**\n\n"
                    f"• **योग्य वाहतूक तापमान:** **०°C ते २°C** आणि ९०% ते ९५% सापेक्ष आर्द्रता.\n"
                    f"• **विना-शीतकरण (Normal) कमाल मर्यादा:** बुरशीचा प्रादुर्भाव टाळण्यासाठी **जास्तीत जास्त १२ ते १६ तास**.\n"
                    f"• **रीफर (Reefer) वाहनात टिकाऊ क्षमता:** नियंत्रित तापमानात **७ ते ९ दिवस** माल ताजा राहतो.\n"
                    f"• **पॅकेजिंग शिफारस:** काढणीनंतर २ तासांत प्री-कूलिंग करावे आणि हवेशीर क्लॅम-शेल पॅकमध्ये वाहतूक करावी."
                )
            elif lang == 'hi':
                reply = (
                    f"**महाबलेश्वर {crop_hi} व जल्द खराब होने वाले फलों हेतु कोल्ड चेन मानक 🍓❄️**\n\n"
                    f"• **अनुकूलतम परिवहन तापमान:** **0°C से 2°C** और 90% - 95% सापेक्ष आर्द्रता।\n"
                    f"• **सामान्य (नॉन-रीफर) परिवहन सीमा:** फफूंद और सड़न से बचने के लिए **अधिकतम 12 से 16 घंटे**।\n"
                    f"• **रेफ्रिजरेटेड वाहन में शेल्फ लाइफ:** सक्रिय कोल्ड चेन के तहत फल **7 से 9 दिन** सुरक्षित रहते हैं।\n"
                    f"• **डिस्पैच प्रोटोकॉल:** खेत से तुड़ाई के 2 घंटे के भीतर प्री-कूलिंग करें तथा हवादार प्लास्टिक पनेट्स में पैक करें।"
                )
            else:
                reply = (
                    f"**Cold-Chain & Transit Thresholds for High-Perishability Produce 🍓❄️**\n\n"
                    f"• **Optimal Transit Temperature:** **0°C to 2°C** with 90% – 95% Relative Humidity.\n"
                    f"• **Maximum Ambient Transit Limit:** **12 to 16 hours maximum** without reefer cooling before fungal decay (*Botrytis cinerea*) triggers.\n"
                    f"• **Reefer Vehicle Longevity:** Under active refrigeration, shelf life extends safely to **7–9 days**.\n"
                    f"• **Dispatch Protocol:** Pre-cool to 4°C within 2 hours of field harvest; utilize ventilated food-grade clam-shell punnets."
                )
            return {'reply': reply, 'category': 'COLD_CHAIN'}

        # 5. Price Benchmarks & Wholesale Mandi Intelligence for Buyers
        elif any(w in q for w in ['price', 'rate', 'benchmark', 'wholesale', 'भाव', 'दर', 'दाम', 'रेट', 'किंमत', 'लागत', 'थोक भाव', 'बाजारभाव', 'cost']):
            p = PriceForecasterService.get_predictive_fair_price(crop, region, 'Grade A', 1000)
            if lang == 'mr':
                reply = (
                    f"**{region_mr} घाऊक {crop_mr} खरेदी दर व बाजार विश्लेषण 📊💼**\n\n"
                    f"• **घाऊक खरेदी संदर्भ दर:** **₹{p['predicted_price']:.2f}/किलो**\n"
                    f"• **वाजवी दर पट्टा (Corridor):** **₹{p['lower_bound']:.2f} ते ₹{p['upper_bound']:.2f}/किलो**\n"
                    f"• **थेट खरेदी बचत:** फार्मडायरेक्टवरून शेतकऱ्यांकडून थेट खरेदी केल्यास APMC अडत, सेस व दलालीचे **६% ते ९%** निव्वळ बचत होते.\n"
                    f"• **घाऊक सवलत शिफारस:** २ टन पेक्षा जास्त खरेदीवर ₹१.५० ते ₹२.००/किलो सवलतीचा प्रस्ताव (Counter-Offer) द्या."
                )
            elif lang == 'hi':
                reply = (
                    f"**{region_hi} थोक {crop_hi} खरीद मूल्य व मंडी विश्लेषण 📊💼**\n\n"
                    f"• **थोक खरीद संदर्भ भाव:** **₹{p['predicted_price']:.2f}/किग्रा**\n"
                    f"• **उचित मूल्य दायरा:** **₹{p['lower_bound']:.2f} – ₹{p['upper_bound']:.2f}/किग्रा**\n"
                    f"• **डायरेक्ट प्रोक्योरमेंट मार्जिन:** फार्मडायरेक्ट पर किसानों से सीधे सौदे करने से मंडी टैक्स व बिचौलियों का 6% से 9% कमीशन बचता है।\n"
                    f"• **वॉल्यूम डिस्काउंट रणनीति:** 2,000 किग्रा से अधिक के ऑर्डर पर लिस्टिंग मूल्य से ₹1.50 - ₹2.50/किग्रा कम का काउंटर-ऑफर दें।"
                )
            else:
                reply = (
                    f"**Wholesale Price Benchmark for {crop} in {region} 📊💼**\n\n"
                    f"• **Predictive Fair Wholesale Price:** **₹{p['predicted_price']:.2f}/kg**\n"
                    f"• **Target Procurement Corridor:** **₹{p['lower_bound']:.2f} – ₹{p['upper_bound']:.2f}/kg**\n"
                    f"• **Direct Sourcing Margin:** Procuring directly via FarmDirect bypasses 6–9% APMC commission and intermediary spreads.\n"
                    f"• **Volume Playbook:** High-volume orders (>2 tonnes) qualify for ₹1.50–₹2.50/kg concessions through our automated negotiation copilot."
                )
            return {'reply': reply, 'category': 'PRICE_INTELLIGENCE', 'data': p}

        # 6. Logistics & Weather Disruption Risk for Supply Chains
        elif any(w in q for w in ['weather', 'climate', 'rain', 'logistics', 'transit', 'delay', 'disruption', 'मौसम', 'हवामान', 'बारिश', 'पाऊस', 'जोखिम', 'वाहतूक', 'परिवहन']):
            if lang == 'mr':
                reply = (
                    f"**{region_mr} कॉरिडॉर {crop_mr} वाहतूक व हवामान जोखीम अहवाल 🚚⛅**\n\n"
                    f"• **वाहतूक जोखीम निर्देशांक:** **कमी ते मध्यम (२६/१००)** — मुख्य राष्ट्रीय महामार्गांवर वाहतूक सुरळीत आहे.\n"
                    f"• **हवामान प्रभाव:** स्थानिक भागात हलक्या सरींचा अंदाज; नाशवंत माल झाकलेल्या वाहनांमधून (Closed Body/Reefer) पाठवावा.\n"
                    f"• **शिफारस:** मालाची प्रत टिकवून ठेवण्यासाठी फार्मडायरेक्टच्या सत्यापित कोल्ड-चेन वाहतूकदारांची निवड करा."
                )
            elif lang == 'hi':
                reply = (
                    f"**{region_hi} लॉजिस्टिक्स व मौसम व्यवधान जोखिम मूल्यांकन 🚚⛅**\n\n"
                    f"• **ट्रांजिट रिस्क स्कोर:** **निम्न से मध्यम (26/100)** — मुख्य कृषि परिवहन कॉरिडोर पर आवागमन सामान्य।\n"
                    f"• **मौसम प्रभाव:** अगले 48 घंटों में हल्की वर्षा का अनुमान; फल व सब्जी को वॉटरप्रूफ व हवादार पैकिंग में ही डिस्पैच कराएं।\n"
                    f"• **परिवहन सलाह:** दूरस्थ शहरों के लिए रेफ्रिजरेटेड वाहन का प्रयोग करें जिससे इन-ट्रांजिट सड़न से बचा जा सके।"
                )
            else:
                reply = (
                    f"**Logistics & Weather Disruption Assessment for {crop} ({region}) 🚚⛅**\n\n"
                    f"• **Active Corridor Transit Risk:** **Low to Moderate (26/100)** — Clear transit along primary agricultural expressways.\n"
                    f"• **Precipitation Warning:** Scattered showers predicted; ensure tarpaulin coverage or containerized reefers for perishable produce.\n"
                    f"• **Action Suggestion:** Check regional supplier clusters and delivery schedules directly in your Buyer Dashboard."
                )
            return {'reply': reply, 'category': 'LOGISTICS_RISK'}

        # 7. Natural Language Procurement Intent & Supplier Sourcing
        elif any(w in q for w in ['buy', 'need', 'procure', 'tonnes', 'kg', 'looking for', 'supplier', 'suppliers', 'find', 'under', 'खरेदी', 'खरीदना', 'चाहिए', 'खोजें', 'शोधा', 'सप्लायर', 'पुरवठादार', 'विक्रेता', 'व्यापारी']):
            from services.ai.procurement_optimizer import ProcurementOptimizer
            req = ProcurementOptimizer.parse_natural_language_query(query_text)
            plans_data = ProcurementOptimizer.generate_procurement_plans(req)
            plans = plans_data.get('plans', [])

            if lang == 'mr':
                reply = (
                    f"**{req['quantity']:,.0f} किलो {CROP_DISPLAY_MR.get(req['crop'], req['crop'])} खरेदी विश्लेषण ({req['location']}):**\n\n"
                    f"आपल्या मागणीनुसार आम्ही ३ खरेदी आराखडे तयार केले आहेत:\n\n"
                )
                for p in plans:
                    reply += (
                        f"• **{p['plan_name']}** ({p['tag']}): एकूण खर्च: **₹{p['total_landed_cost']:,.2f}** (दर: ₹{p['effective_landed_rate_per_kg']:.2f}/किलो) "
                        f"| पूर्तता: **{p['fulfillment_percentage']}%** | शेतकरी पुरवठादार: **{p['suppliers_count']}**\n"
                    )
                reply += "\nसविस्तर पुरवठादार पाहण्यासाठी आणि थेट ऑर्डर पाठवण्यासाठी **AI Procurement** टॅब उघडा!"
            elif lang == 'hi':
                reply = (
                    f"**{req['quantity']:,.0f} किग्रा {CROP_DISPLAY_HI.get(req['crop'], req['crop'])} खरीद अनुकूलन परिणाम ({req['location']}):**\n\n"
                    f"आपकी आवश्यकता के अनुसार 3 अनुकूलित प्रोक्योरमेंट प्लान तैयार किए गए हैं:\n\n"
                )
                for p in plans:
                    reply += (
                        f"• **{p['plan_name']}** ({p['tag']}): कुल लैंडेड लागत: **₹{p['total_landed_cost']:,.2f}** (दर: ₹{p['effective_landed_rate_per_kg']:.2f}/किग्रा) "
                        f"| पूर्ति: **{p['fulfillment_percentage']}%** | सप्लायर्स: **{p['suppliers_count']}**\n"
                    )
                reply += "\nऑर्डर समीक्षा और डायरेक्ट खरीद हेतु **AI Procurement** पेज पर जाएं!"
            else:
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
            return {'reply': reply, 'data': plans_data, 'category': 'PROCUREMENT_INTENT'}

        # 8. Intelligent Commercial Procurement Advisory Fallback
        else:
            p_fair = PriceForecasterService.get_predictive_fair_price(crop, region, 'Grade A', 1000)
            if lang == 'mr':
                reply = (
                    f"**फार्मडायरेक्ट व्यावसायिक खरेदी सल्ला: {crop_mr} ({region_mr}) 💼🤖**\n\n"
                    f"• **घाऊक बाजार संदर्भ दर:** **₹{p_fair['predicted_price']:.2f}/किलो** (पट्टा: ₹{p_fair['lower_bound']:.2f} ते ₹{p_fair['upper_bound']:.2f})\n"
                    f"• **थेट खरेदी सुविधा:** फार्मडायरेक्टवर थेट शेतकऱ्यांशी संपर्क साधून दलाली वाचवा आणि ग्रेड ए मालाची वेळेवर डिलिव्हरी मिळवा.\n\n"
                    f"💡 _आपण मला खरेदीसाठी योग्य वेळ, काउंटर-ऑफर रणनीती, मुबलक आवक असणारे जिल्हे, किंवा घाऊक सप्लायर शोधण्याबाबत विचारू शकता._"
                )
            elif lang == 'hi':
                reply = (
                    f"**फार्मडायरेक्ट व्यावसायिक खरीद सलाह: {crop_hi} ({region_hi}) 💼🤖**\n\n"
                    f"• **थोक मंडी संदर्भ भाव:** **₹{p_fair['predicted_price']:.2f}/किग्रा** (दायरा: ₹{p_fair['lower_bound']:.2f} – ₹{p_fair['upper_bound']:.2f})\n"
                    f"• **डायरेक्ट प्रोक्योरमेंट एडवांटेज:** किसानों से सीधे सौदे करके मंडी टैक्स की बचत करें तथा ग्रेड ए प्रमाणित फसल सुनिश्चित करें।\n\n"
                    f"💡 _आप मुझसे खरीद का सही समय, काउंटर-ऑफर रणनीति, अधिशेष उत्पादन वाले जिले या सप्लायर खोजने संबंधी प्रश्न पूछ सकते हैं।_"
                )
            else:
                reply = (
                    f"**FarmDirect Procurement Copilot Advisory: {crop} ({region}) 💼🤖**\n\n"
                    f"• **Commercial Benchmark:** **₹{p_fair['predicted_price']:.2f}/kg** (Fair corridor: ₹{p_fair['lower_bound']:.2f} – ₹{p_fair['upper_bound']:.2f}/kg)\n"
                    f"• **Direct Sourcing Advantage:** Source directly from verified farmer clusters to eliminate APMC markups and secure lot traceability.\n\n"
                    f"💡 _You can ask about optimal procurement windows, volume negotiation tactics, surplus districts, or cold chain logistics._"
                )
            return {'reply': reply, 'category': 'GENERAL_ADVISORY', 'context': {'crop': crop, 'region': region}}

    # -------------------------------------------------------------------------
    # MULTILINGUAL VOICE PARSER
    # -------------------------------------------------------------------------
    @staticmethod
    def parse_multilingual_voice(transcript, detected_language='en'):
        raw = transcript.strip()
        t = raw.lower()

        lang = CopilotService._detect_language(raw, explicit_lang=detected_language)
        lang_name = 'Marathi (मराठी)' if lang == 'mr' else 'Hindi (हिन्दी)' if lang == 'hi' else 'English'

        crop = CopilotService._extract_crop(raw, default='Tomato')
        region = CopilotService._extract_region(raw, default='Nashik' if any(w in t for w in ['nashik', 'नासिक', 'नाशिक']) else 'Pune')

        crop_mr = CROP_DISPLAY_MR.get(crop, crop)
        crop_hi = CROP_DISPLAY_HI.get(crop, crop)
        region_mr = REGION_DISPLAY_MR.get(region, region)
        region_hi = REGION_DISPLAY_HI.get(region, region)

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

        price_intel = PriceForecasterService.get_predictive_fair_price(crop, region)
        suggested_price = price_intel['predicted_price']

        # Determine Intent
        if any(w in t for w in ['weather', 'climate', 'rain', 'disruption', 'जोखिम', 'मौसम', 'हवामान', 'बारिश', 'पाऊस', 'जोखीम']):
            intent = 'WEATHER_RISK'
            if lang == 'mr':
                confirmation_prompt = f"{region_mr} परिसरात {crop_mr} पिकासाठी चालू हवामान जोखीम स्तर कमी-मध्यम (२८/१००) आहे. काढणी वेळेवर पूर्ण करून माल सुरक्षित शेडमध्ये साठवा."
            elif lang == 'hi':
                confirmation_prompt = f"{region_hi} क्षेत्र में {crop_hi} की फसल के लिए मौसम का जोखिम स्तर सामान्य-निम्न (28/100) है। समय पर कटाई करें तथा उपज को सुरक्षित स्थान पर रखें।"
            else:
                confirmation_prompt = f"Current weather disruption risk for {crop} harvest in {region} is Low to Moderate (28/100). No severe storm warning is active. Proceed with scheduled harvest."
            action_suggestion = '/farmer/digital-twin'
            action_payload = {'action': 'VIEW_WEATHER_RISK', 'crop': crop, 'region': region}
            requires_confirmation = False

        elif any(w in t for w in ['best time', 'when to sell', 'सही समय', 'सबसे सही समय', 'योग्य वेळ', 'timing', 'बेचने का समय', 'विकण्याची वेळ', 'विकायची वेळ']):
            intent = 'MARKET_TIMING'
            if lang == 'mr':
                confirmation_prompt = f"{region_mr} मधील {crop_mr} विक्रीसाठी पुढील १०-१४ दिवसांत बाजार आवक स्थिर झाल्यावर उत्तम दर मिळतील. चालू संदर्भ दर ₹{suggested_price:.2f}/किलो आहे."
            elif lang == 'hi':
                confirmation_prompt = f"{region_hi} में {crop_hi} बेचने का सबसे अनुकूल समय अगले 10-14 दिनों में है जब आवक स्थिर होगी। वर्तमान संदर्भ मूल्य ₹{suggested_price:.2f}/किग्रा है।"
            else:
                confirmation_prompt = f"The optimal time to sell {crop} in {region} is over the next 10–14 days as harvest influx stabilizes. Current benchmark is ₹{suggested_price:.2f}/kg."
            action_suggestion = '/farmer/smart-selling'
            action_payload = {'action': 'VIEW_SMART_SELLING', 'crop': crop, 'region': region}
            requires_confirmation = False

        elif any(w in t for w in ['waste', 'stubble', 'biomass', 'बायोमास', 'कचरा', 'पराली', 'अवशेष', 'पाचट', 'bagasse']):
            intent = 'AGRI_WASTE'
            if lang == 'mr':
                confirmation_prompt = f"शेतीतील उरलेले पाचट, पेंढा व काडीकचरा वेस्ट मार्केटप्लेसवर थेट बायो-एनर्जी व खत कंपन्यांना ₹१,०००-₹१,५००/टन दराने विक्रीसाठी उपलब्ध आहे."
            elif lang == 'hi':
                confirmation_prompt = f"गन्ने की खोई, पराली व कृषि अवशेषों को वेस्ट मार्केटप्लेस पर सीधे बॉयो-सीएनजी व प्लाईवुड खरीदारों को ₹1,000-₹1,500 प्रति टन में बेचें।"
            else:
                confirmation_prompt = f"You can monetize crop residue and agricultural stubble on the Waste Circular Marketplace at ₹1,000–₹1,500/tonne with pickup logistics."
            action_suggestion = '/waste-marketplace'
            action_payload = {'action': 'VIEW_WASTE_MARKET', 'crop': crop}
            requires_confirmation = False

        elif any(w in t for w in ['supplier', 'suppliers', 'find', 'under', 'विक्रेता', 'खोजें', 'शोधा', 'सप्लायर', 'पुरवठादार', 'खरेदीदार', 'चाहिए', 'procure']):
            intent = 'BUY_PRODUCE'
            if lang == 'mr':
                confirmation_prompt = f"फार्मडायरेक्टवर {region_mr} क्लस्टरमध्ये ₹{suggested_price:.2f}/किलोच्या आत थेट शेतकरी आणि प्रमाणित FPO पुरवठादार सक्रिय आहेत."
            elif lang == 'hi':
                confirmation_prompt = f"फार्मडायरेक्ट पर {region_hi} क्लस्टर में ₹{suggested_price:.2f}/किग्रा के भीतर सीधे सत्यापित किसान व FPO सप्लायर उपलब्ध हैं।"
            else:
                confirmation_prompt = f"Found verified {crop} producers and farmer groups in {region} with direct-from-farm listings starting near ₹{suggested_price:.2f}/kg."
            action_suggestion = '/buyer/marketplace'
            action_payload = {'action': 'SEARCH_SUPPLIERS', 'crop': crop, 'region': region, 'target_price': suggested_price}
            requires_confirmation = False

        elif any(w in t for w in ['sell', 'list', 'माझ्याकडे', 'विकायचे', 'बेचना', 'मेरे पास', 'नोंदणी']):
            intent = 'SELL_PRODUCE'
            if lang == 'mr':
                confirmation_prompt = f"तुम्हाला {region_mr} मधील {crop_mr} ({qty:,.0f} किलो) चे ₹{suggested_price:.2f}/किलो या अंदाजित दराने फार्मडायरेक्टवर पीक नोंदणी करायची आहे का?"
            elif lang == 'hi':
                confirmation_prompt = f"क्या आप {region_hi} में {crop_hi} ({qty:,.0f} किग्रा) को ₹{suggested_price:.2f}/किग्रा के अनुमानित भाव पर फार्मडायरेक्ट पर लिस्ट करना चाहते हैं?"
            else:
                confirmation_prompt = f"Would you like to list {qty:,.0f} kg of fresh {crop} at ₹{suggested_price:.2f}/kg in {region} on the FarmDirect marketplace?"
            action_suggestion = '/farmer/listings/new'
            action_payload = {
                'action': 'CREATE_LISTING',
                'crop': crop,
                'quantity': qty,
                'expected_price': suggested_price,
                'location': region,
                'quality_grade': 'Grade A',
                'availability_date': date.today().isoformat()
            }
            requires_confirmation = True

        else:
            intent = 'CHECK_PRICE'
            if lang == 'mr':
                confirmation_prompt = f"{region_mr} बाजार समितीमध्ये {crop_mr} चा सध्याचा संदर्भ दर ₹{suggested_price:.2f}/किलो आहे. आपण विस्तृत मूल्य अंदाज पाहू इच्छिता?"
            elif lang == 'hi':
                confirmation_prompt = f"{region_hi} मंडी में {crop_hi} का वर्तमान संदर्भ भाव ₹{suggested_price:.2f}/किग्रा है। क्या आप विस्तृत मूल्य पूर्वानुमान देखना चाहते हैं?"
            else:
                confirmation_prompt = f"The current reference benchmark for {crop} in {region} is ₹{suggested_price:.2f}/kg. Would you like to view detailed market forecasts?"
            action_suggestion = '/farmer/price-insight'
            action_payload = {'action': 'VIEW_PRICE_INSIGHT', 'crop': crop, 'region': region}
            requires_confirmation = False

        return {
            'success': True,
            'transcript': raw,
            'language': lang,
            'language_name': lang_name,
            'intent': intent,
            'extracted_crop': crop,
            'extracted_region': region,
            'extracted_quantity': qty,
            'suggested_price': suggested_price,
            'confirmation_prompt': confirmation_prompt,
            'response_text': confirmation_prompt,
            'reply': confirmation_prompt,
            'action_suggestion': action_suggestion,
            'action_recommendation': action_suggestion,
            'action_payload': action_payload,
            'requires_confirmation': requires_confirmation
        }

    # -------------------------------------------------------------------------
    # AI LISTING GENERATOR
    # -------------------------------------------------------------------------
    @staticmethod
    def generate_listing_attributes(prompt_text):
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
