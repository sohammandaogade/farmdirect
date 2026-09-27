import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  User,
  ShoppingBag,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { copilotAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const BuyerCopilot = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.name || 'Buyer'}! I am your AI Sourcing & Procurement Copilot. Ask me about seasonal crop availability, fair price benchmarks, multi-farm logistics optimization, or supplier trust verification.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = {
    en: [
      'What is the best procurement window for Nashik onions this month?',
      'How to structure a counter-offer for high volume tomato purchase?',
      'Which districts currently have surplus organic wheat listings?',
      'What are the cold chain transit limits for strawberries from Mahabaleshwar?',
    ],
    hi: [
      'इस महीने नासिक प्याज खरीदने का सबसे अच्छा समय क्या है?',
      'थोक टमाटर खरीद के लिए काउंटर-ऑफर कैसे तय करें?',
      'वर्तमान में किन जिलों में जैविक गेहूं का अधिशेष (सरप्लस) उपलब्ध है?',
      'महाबलेश्वर स्ट्रॉबेरी के लिए कोल्ड चेन परिवहन सीमा क्या है?',
    ],
    mr: [
      'या महिन्यात नाशिक कांदा खरेदीसाठी योग्य वेळ कोणती?',
      'मोठ्या प्रमाणातील टोमॅटो खरेदीसाठी काउंटर-ऑफर कशी द्यावी?',
      'सध्या कोणत्या जिल्ह्यांत सेंद्रिय गव्हाची मुबलक आवक आहे?',
      'महाबळेश्वर स्ट्रॉबेरीसाठी कोल्ड चेन वाहतूक मर्यादा किती आहे?',
    ],
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const procurementContext = {
        buyer_name: user?.name,
        business_name: user?.buyer_profile?.business_name,
        business_type: user?.buyer_profile?.business_type || 'Wholesaler / Retailer',
      };

      const res = await copilotAPI.askBuyer(query);
      if (res.data.success) {
        const botReply = {
          sender: 'bot',
          text: res.data.data.reply || res.data.data.response || 'Procurement intelligence computed successfully.',
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
              Buyer Copilot
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Buyer Procurement Copilot
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Strategic volume sourcing advisory, supplier credibility verification, and contract negotiation tactics
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <Languages className="w-4 h-4 text-emerald-600 ml-2" />
          {[
            { id: 'en', label: 'EN' },
            { id: 'hi', label: 'हिन्दी' },
            { id: 'mr', label: 'मराठी' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
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

                <div className="space-y-1.5">
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      isBot
                        ? 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'
                        : 'bg-blue-600 text-white rounded-tr-sm'
                    }`}
                  >
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
                ? 'Ask about crop pricing, suppliers, delivery risks, or negotiation tactics...'
                : language === 'hi'
                ? 'फसल मूल्य, सप्लायर या नेगोशिएशन रणनीति के बारे में पूछें...'
                : 'पिकांचे दर, पुरवठादार किंवा घासाघिस धोरणाबद्दल विचारा...'
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
