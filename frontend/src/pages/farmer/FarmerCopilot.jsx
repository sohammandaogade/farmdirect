import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  User,
  Bot,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sprout,
  HelpCircle,
} from 'lucide-react';
import { copilotAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const FarmerCopilot = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.name || 'Farmer'}! I am your FarmDirect AI Agricultural Copilot. How can I assist with your crops, current mandi prices, harvest scheduling, or disease prevention today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickQuestions = {
    en: [
      'What are current APMC price benchmarks for onions in Nashik?',
      'How to prevent blight in tomato crops after unseasonal rain?',
      'Is it optimal to hold wheat stock for 2 weeks or sell now?',
      'How do I list agricultural stubble on the waste marketplace?',
    ],
    hi: [
      'नासिक में प्याज के वर्तमान मंडी भाव क्या हैं?',
      'असमय बारिश के बाद टमाटर में झुलसा रोग से कैसे बचें?',
      'क्या गेहूं का स्टॉक 2 हफ्ते रोकना चाहिए या अभी बेचना सही है?',
      'कृषि अवशेषों को वेस्ट मार्केटप्लेस पर कैसे बेचें?',
    ],
    mr: [
      'नाशिक बाजार समितीमध्ये कांद्याचे चालू बाजारभाव काय आहेत?',
      'अवकाळी पावसानंतर टोमॅटोवरील करपा रोगाचे नियंत्रण कसे करावे?',
      'गव्हाचा साठा २ आठवडे थांबवून विकावा की आत्ताच विकावा?',
      'शेतीतील उरलेले पाचट/काडीकचरा कसा विकावा?',
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
      const farmContext = {
        farmer_name: user?.name,
        farm_name: user?.farmer_profile?.farm_name,
        location: user?.farmer_profile?.location || 'Maharashtra',
      };

      const res = await copilotAPI.askFarmer(query);
      if (res.data.success) {
        const botReply = {
          sender: 'bot',
          text: res.data.data.reply || res.data.data.response || 'Advisory computed successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendations: res.data.data.recommendations || [],
        };
        setMessages((prev) => [...prev, botReply]);
      }
    } catch (err) {
      console.error('Farmer Copilot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Apologies, I encountered an issue connecting to the agri advisory engine. Please try again.',
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
              AI Agricultural Advisory
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Farmer Copilot
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Farmer AI Copilot
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Intelligent agronomic advice, price elasticity guidance, and farm decision support
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
                  ? 'bg-emerald-600 text-white shadow-xs'
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
        {/* Messages View */}
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
                    isBot ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
                  }`}
                >
                  {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1.5">
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      isBot
                        ? 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm'
                        : 'bg-emerald-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Actionable recommendations card */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                          Recommended Next Steps:
                        </span>
                        {msg.recommendations.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-emerald-600 font-bold">•</span>
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
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
                Analyzing agronomic models and price reference data...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap">
            Suggestions:
          </span>
          {quickQuestions[language].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-semibold px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input */}
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
                ? 'Ask about crops, market prices, weather warnings, or harvest scheduling...'
                : language === 'hi'
                ? 'फसल, मंडी भाव, मौसम या कटाई के बारे में पूछें...'
                : 'पिके, बाजारभाव, हवामान किंवा काढणीबाबत विचारा...'
            }
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmerCopilot;
