import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for browser Web Speech API (SpeechRecognition & SpeechSynthesis)
 * Supports English, Hindi (hi-IN), and Marathi (mr-IN).
 */
export const useSpeechRecognition = ({ onResult, onEnd, onError } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const mapLanguageCode = (lang) => {
    switch (lang) {
      case 'hi':
        return 'hi-IN';
      case 'mr':
        return 'mr-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  const startListening = useCallback(
    (lang = 'en') => {
      setError(null);

      if (!SpeechRecognition) {
        const msg =
          'Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.';
        setError(msg);
        if (onError) onError(msg);
        return;
      }

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (_) {}
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = mapLanguageCode(lang);
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          if (currentText) {
            setTranscript(currentText);
            if (onResult) onResult(currentText);
          }
        };

        recognition.onerror = (event) => {
          console.warn('[SpeechRecognition] error:', event.error);
          setIsListening(false);
          let userMsg = '';
          switch (event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
              userMsg =
                'Microphone access denied. Please allow microphone permission in your browser address bar.';
              break;
            case 'no-speech':
              userMsg = 'No speech detected. Please speak clearly into your microphone.';
              break;
            case 'network':
              userMsg = 'Network error while recognizing speech. Please check your connection.';
              break;
            case 'aborted':
              // User aborted or restarted; don't flash alarming error
              return;
            default:
              userMsg = `Microphone issue (${event.error}). Please try again or type directly.`;
          }
          setError(userMsg);
          if (onError) onError(userMsg);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (onEnd) onEnd();
        };

        recognition.start();
      } catch (err) {
        console.error('[SpeechRecognition] start error:', err);
        setIsListening(false);
        const errStr = err?.message || 'Could not start microphone.';
        setError(errStr);
        if (onError) onError(errStr);
      }
    },
    [SpeechRecognition, onResult, onEnd, onError]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    error,
    setError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

/**
 * Text-to-Speech synthesis helper
 */
export const speakText = (text, lang = 'en', onEndCallback = null) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    if (!text || !text.trim()) return false;

    // Clean markdown and formatting symbols before speech
    const cleanText = text
      .replace(/[*#_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/₹\s*/g, 'rupees ')
      .replace(/•/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clear Indian language pronunciation
    utterance.pitch = 1.0;

    if (onEndCallback) {
      utterance.onend = onEndCallback;
      utterance.onerror = onEndCallback;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('[speechSynthesis] error:', err);
    return false;
  }
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
