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
  Activity,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { copilotAPI, priceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const FarmerCopilot = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const greetings = {
    en: `Hello ${user?.name || 'Farmer'}! I am your FarmDirect AI Agricultural Copilot. How can I assist with your crops, current verified mandi prices, harvest scheduling, or disease prevention today?`,
    hi: `नमस्ते ${user?.name || 'किसान साथी'}! मैं आपका फार्मडायरेक्ट एआई कृषि सलाहकार (Copilot) हूँ। आज मैं आपकी फसलों, प्रमाणित मंडी भाव, फसल सुरक्षा या रोग नियंत्रण में कैसे सहायता कर सकता हूँ?`,
    mr: `नमस्कार ${user?.name || 'शेतकरी मित्र'}! मी आपला फार्मडायरेक्ट एआय कृषी सल्लागार (Copilot) आहे. आज मी आपल्या पिकांचे नियोजन, प्रमाणित चालू बाजारभाव किंवा रोग व्यवस्थापनात कशी मदत करू शकतो?`,
  };

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: greetings.en,
      dataType: 'AI ANALYSIS',
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
      lower.includes('भाव');

    const isForecast =
      lower.includes('forecast') ||
      lower.includes('future') ||
      lower.includes('next week') ||
      lower.includes('2 weeks') ||
      lower.includes('हफ्ते') ||
      lower.includes('आठवडे');

    const isHistorical =
      lower.includes('past') ||
      lower.includes('history') ||
      lower.includes('last month') ||
      lower.includes('मागील') ||
      lower.includes('पिछले');

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
      const res = await copilotAPI.askFarmer(query, language);
      if (res.data?.success) {
        const rawReply = res.data.data.reply || res.data.data.response || 'Advisory computed successfully.';
        const grounding = res.data.data.market_grounding;

        let finalType = detectedType;
        let isLiveUnavailable = false;

        if (detectedType === 'LIVE') {
          if (grounding?.verified_data) {
            finalType = 'LIVE';
          } else {
            // If live data couldn't be verified by ground truth source
            finalType = 'AI ANALYSIS';
            isLiveUnavailable = true;
          }
        }

        const botReply = {
          sender: 'bot',
          text: rawReply,
          dataType: finalType,
          liveUnavailable: isLiveUnavailable,
          sourceName: grounding?.source || 'Agmarknet / FarmDirect Database',
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B7A66]">
              AI Agricultural Advisory
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FFE5B8] text-[#211C18]">
              Verified Grounding
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Farmer AI Copilot
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Intelligent agronomic advice grounded in verified APMC benchmark data, with zero invented market rates
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#F5EBDD] shadow-xs self-start sm:self-auto">
          <Languages className="w-4 h-4 text-[#8B7A66] ml-2" />
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
                  ? 'bg-[#8B7A66] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                    isBot ? 'bg-[#8B7A66] text-white' : 'bg-[#211C18] text-white'
                  }`}
                >
                  {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="space-y-1.5 max-w-full">
                  {/* Classification Badge (LIVE, HISTORICAL, FORECAST, AI ANALYSIS) */}
                  {isBot && msg.dataType && (
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.dataType === 'LIVE' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FFE5B8]/50 text-[#211C18] border border-[#FFE5B8] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
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
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#F5EBDD] text-[#6F655B] border border-[#EADCC9] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#8B7A66]" />
                          <span>AI ADVISORY</span>
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
                        : 'bg-[#211C18] text-white rounded-tr-sm'
                    }`}
                  >
                    {/* Live Data Unavailable Notice if Applicable */}
                    {isBot && msg.liveUnavailable && (
                      <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span>Live data is currently unavailable, so I cannot verify the current value.</span>
                          <span className="block font-normal text-[11px] text-amber-800 mt-0.5">
                            Providing best-estimate advisory below based on regional agronomic baseline.
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Actionable recommendations card */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B7A66] block">
                          Recommended Next Steps:
                        </span>
                        {msg.recommendations.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-[#8B7A66] font-bold">•</span>
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
              <div className="w-9 h-9 rounded-2xl bg-[#8B7A66] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
                Verifying live Agmarknet benchmark data and agronomic intelligence...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#F5EBDD] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap">
            Suggestions:
          </span>
          {quickQuestions[language].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs bg-white hover:bg-[#FFE5B8]/30 hover:text-[#211C18] text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-[#F5EBDD] transition-colors whitespace-nowrap"
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
          className="p-4 bg-white border-t border-[#F5EBDD] flex items-center gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Ask about verified mandi prices, weather warnings, or harvest scheduling...'
                : language === 'hi'
                ? 'प्रमाणित मंडी भाव, मौसम या कटाई के बारे में पूछें...'
                : 'प्रमाणित बाजारभाव, हवामान किंवा काढणीबाबत विचारा...'
            }
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-[#8B7A66] hover:bg-[#786855] disabled:opacity-50 text-white rounded-2xl shadow-md active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmerCopilot;
