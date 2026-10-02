import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  User,
  Bot,
  Activity,
  Calendar,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { copilotAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const BuyerCopilot = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const greetings = {
    en: `Hello ${user?.name || 'Commercial Buyer'}! I am your FarmDirect Procurement AI Copilot. How can I assist with verified live market rates, regional supplier discovery, or contract negotiations today?`,
    hi: `नमस्ते ${user?.name || 'खरीदार'}! मैं आपका फार्मडायरेक्ट खरीद सहायक (Copilot) हूँ। आज मैं प्रमाणित मंडी भाव, सप्लायर खोज या नेगोशिएशन रणनीति में कैसे सहायता कर सकता हूँ?`,
    mr: `नमस्कार ${user?.name || 'खरेदीदार'}! मी आपला फार्मडायरेक्ट खरेदी सल्लागार (Copilot) आहे. आज मी प्रमाणित बाजारभाव, पुरवठादार शोध किंवा सौदेबाजीत कशी मदत करू शकतो?`,
  };

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: greetings.en,
      dataType: 'AI ANALYSIS',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = {
    en: [
      'What are verified today onion benchmark prices in Nashik?',
      'How to structure counter-offers for 10-tonne bulk tomato orders?',
      'Which districts currently have surplus organic wheat supplies?',
      'What is the cold chain logistics threshold for Mahabaleshwar strawberries?',
    ],
    hi: [
      'नासिक में आज के प्रमाणित प्याज थोक भाव क्या हैं?',
      '10 टन टमाटर के लिए काउंटर-ऑफर कैसे तय करें?',
      'किन जिलों में वर्तमान में सेंद्रिय गेहूं का अधिशेष है?',
      'महाबलेश्वर स्ट्रॉबेरी के लिए कोल्ड चेन परिवहन सीमा क्या है?',
    ],
    mr: [
      'नाशिकमध्ये आजचे प्रमाणित कांदा घाऊक दर काय आहेत?',
      'मोठ्या प्रमाणातील टोमॅटो खरेदीसाठी काउंटर-ऑफर कशी द्यावी?',
      'सध्या कोणत्या जिल्ह्यांत सेंद्रिय गव्हाची मुबलक आवक आहे?',
      'महाबळेश्वर स्ट्रॉबेरीसाठी कोल्ड चेन वाहतूक मर्यादा किती आहे?',
    ],
  };

  const classifyQuery = (q) => {
    const lower = q.toLowerCase();
    const isLiveRequest =
      lower.includes('today') ||
      lower.includes('current') ||
      lower.includes('live') ||
      lower.includes('now') ||
      lower.includes('price') ||
      lower.includes('rate') ||
      lower.includes('mandi') ||
      lower.includes('apmc') ||
      lower.includes('आज') ||
      lower.includes('चालू') ||
      lower.includes('दर') ||
      lower.includes('भाव');

    const isForecast =
      lower.includes('forecast') ||
      lower.includes('future') ||
      lower.includes('next week') ||
      lower.includes('trend');

    const isHistorical =
      lower.includes('past') ||
      lower.includes('history') ||
      lower.includes('last month');

    if (isLiveRequest && !isForecast) return 'LIVE';
    if (isForecast) return 'FORECAST';
    if (isHistorical) return 'HISTORICAL';
    return 'AI ANALYSIS';
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const detectedType = classifyQuery(query);

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await copilotAPI.askBuyer(query, language);
      if (res.data?.success) {
        const rawReply = res.data.data.reply || res.data.data.response || 'Procurement intelligence computed successfully.';
        const grounding = res.data.data.market_grounding;

        let finalType = detectedType;
        let isLiveUnavailable = false;

        if (detectedType === 'LIVE') {
          if (grounding?.verified_data) {
            finalType = 'LIVE';
          } else {
            finalType = 'AI ANALYSIS';
            isLiveUnavailable = true;
          }
        }

        const botReply = {
          sender: 'bot',
          text: rawReply,
          dataType: finalType,
          liveUnavailable: isLiveUnavailable,
          sourceName: grounding?.source || 'Agmarknet APMC Feed / FarmDirect Records',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendations: res.data.data.recommendations || [],
        };

        setMessages((prev) => [...prev, botReply]);
      }
    } catch (err) {
      console.error('Buyer Copilot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Encountered an issue retrieving procurement market intelligence. Please retry.',
          dataType: 'AI ANALYSIS',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Procurement Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
              Verified Grounding
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Buyer Procurement Copilot
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Strategic volume sourcing advisory and supplier verification grounded in verified APMC market data
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <Languages className="w-4 h-4 text-blue-600 ml-2" />
          {[
            { id: 'en', label: 'EN' },
            { id: 'hi', label: 'हिन्दी' },
            { id: 'mr', label: 'मराठी' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                setLanguage(lang.id);
                setMessages((prev) => {
                  if (prev.length === 1 && prev[0].sender === 'bot') {
                    return [{ ...prev[0], text: greetings[lang.id] || greetings.en }];
                  }
                  return prev;
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === lang.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isBot ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1.5 max-w-full">
                  {/* Classification Badge (LIVE, HISTORICAL, FORECAST, AI ANALYSIS) */}
                  {isBot && msg.dataType && (
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.dataType === 'LIVE' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>LIVE DATA</span>
                        </span>
                      ) : msg.dataType === 'FORECAST' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-600" />
                          <span>FORECAST</span>
                        </span>
                      ) : msg.dataType === 'HISTORICAL' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          <span>HISTORICAL DATA</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>AI ANALYSIS</span>
                        </span>
                      )}

                      {msg.sourceName && (
                        <span className="text-[10px] text-slate-400 font-semibold truncate">
                          • {msg.sourceName}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      isBot
                        ? 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'
                        : 'bg-blue-600 text-white rounded-tr-sm'
                    }`}
                  >
                    {/* Live Data Unavailable Notice if Applicable */}
                    {isBot && msg.liveUnavailable && (
                      <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span>Live data is currently unavailable, so I cannot verify the current value.</span>
                          <span className="block font-normal text-[11px] text-amber-800 mt-0.5">
                            Providing procurement advisory below based on regional agricultural benchmarks.
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Actionable recommendations card */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                          Sourcing Strategy Recommendations:
                        </span>
                        {msg.recommendations.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold text-slate-400 block px-2 ${
                      isBot ? 'text-left' : 'text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 mr-auto">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
                Scanning wholesale pricing data and regional supply indices...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap">
            Suggestions:
          </span>
          {quickPrompts[language].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-slate-100 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Ask about verified crop pricing, suppliers, delivery risks, or negotiation tactics...'
                : language === 'hi'
                ? 'प्रमाणित फसल मूल्य, सप्लायर या नेगोशिएशन रणनीति के बारे में पूछें...'
                : 'प्रमाणित पिकांचे दर, पुरवठादार किंवा घासाघिस धोरणाबद्दल विचारा...'
            }
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default BuyerCopilot;
