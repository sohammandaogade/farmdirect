import React, { useState } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Languages, Check, ArrowRight } from 'lucide-react';
import { copilotAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const VoiceAssistantModal = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const samplePrompts = {
    en: [
      'What is the best time to sell my tomatoes in Nashik?',
      'Find verified organic onion suppliers with price under 30/kg',
      'How to list sugarcane stubble on the waste marketplace?',
      'Check current weather disruption risk for potato harvest in Pune',
    ],
    hi: [
      'नासिक में टमाटर बेचने का सबसे सही समय क्या है?',
      '30 रुपये प्रति किलो से कम प्याज विक्रेता खोजें',
      'कृषि अवशेष (बायोमास) कैसे बेचें?',
      'पुणे में आलू की फसल पर मौसम का क्या जोखिम है?',
    ],
    mr: [
      'नाशिकमध्ये टोमॅटो विकण्याची योग्य वेळ कोणती?',
      '३० रुपये प्रतिकिलोपेक्षा कमी दराचे कांदा शेतकरी शोधा',
      'ऊस पाचट आणि शेती कचरा कसा विकावा?',
      'पुण्यात बटाटा काढणीसाठी हवामान कसे आहे?',
    ],
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    // Simulate real-time speech recognition input with realistic prompt
    const prompts = samplePrompts[language];
    const chosen = prompts[Math.floor(Math.random() * prompts.length)];
    setTranscript(chosen);
    setTimeout(() => {
      setIsListening(false);
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!transcript.trim()) return;

    try {
      setLoading(true);
      const res = await copilotAPI.voiceAssistant(transcript, language);
      if (res.data.success) {
        setResponse(res.data.data);
      }
    } catch (err) {
      console.error('Voice assistant error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (target) => {
    onClose();
    if (target) navigate(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-xl w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Multilingual Voice Farm Assistant
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  AI Voice
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Ask in your native language (English, हिंदी, मराठी)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 px-2">
            <Languages className="w-4 h-4 text-emerald-600" />
            <span>Select Language:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिंदी (Hindi)' },
              { id: 'mr', label: 'मराठी (Marathi)' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  setLanguage(lang.id);
                  setResponse(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === lang.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Microphone & Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Speak or type your agricultural inquiry...'
                  : language === 'hi'
                  ? 'अपनी कृषि संबंधी पूछताछ बोलें या लिखें...'
                  : 'तुमचा शेतीविषयक प्रश्न बोला किंवा टाईप करा...'
              }
              className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-2 rounded-xl text-white transition-all shadow-md ${
                  isListening
                    ? 'bg-rose-500 animate-pulse shadow-rose-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="submit"
                disabled={loading || !transcript.trim()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
              >
                {loading ? 'Thinking...' : 'Ask'}
              </button>
            </div>
          </div>
          {isListening && (
            <p className="text-xs text-rose-600 font-bold text-center animate-pulse">
              Listening... Speak clearly in {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : 'मराठी'}
            </p>
          )}
        </form>

        {/* Sample Prompt Chips */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Try Asking
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts[language].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTranscript(prompt);
                }}
                className="text-left text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200/60 transition-colors"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Assistant Response Card */}
        {response && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>AI Voice Synthesis Response</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900">
                Intent: {response.intent || response.detected_intent || 'Command Processed'}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line">
              {response.confirmation_prompt || response.reply || response.response_text || 'Command parsed and processed successfully.'}
            </p>

            {(response.action_suggestion || response.action_recommendation) && (
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-xs text-emerald-900 font-medium">
                  {typeof (response.action_suggestion || response.action_recommendation) === 'string'
                    ? `Navigate: ${response.action_suggestion || response.action_recommendation}`
                    : response.action_recommendation?.text}
                </span>
                <button
                  onClick={() =>
                    handleActionClick(
                      typeof (response.action_suggestion || response.action_recommendation) === 'string'
                        ? response.action_suggestion || response.action_recommendation
                        : response.action_recommendation?.url
                    )
                  }
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  <span>Go Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistantModal;
