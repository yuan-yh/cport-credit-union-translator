import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Visualizer, type InteractionState } from './Visualizer';
import { VoiceControls } from './VoiceControls';
import { TranscriptPanel } from './TranscriptPanel';
import { SUPPORTED_LANGUAGES, type LanguageCode, type Translation } from '../../types';
import { api } from '../../lib/api';
import { useStreamingAudio } from '../../hooks/useStreamingAudio';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';

interface VoiceTranslationProps {
  sessionId: string;
  customerLanguage: LanguageCode;
  onClose: () => void;
  onTranslation?: (translation: Translation) => void;
}

export function VoiceTranslation({
  sessionId,
  customerLanguage,
  onClose,
  onTranslation,
}: VoiceTranslationProps) {
  const [state, setState] = useState<InteractionState>('idle');
  const [currentSpeaker, setCurrentSpeaker] = useState<'staff' | 'customer'>('staff');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Translation[]>([]);
  const [showPanel, setShowPanel] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Streaming TTS for faster audio playback
  const { playStreamingAudio, stopAudio } = useStreamingAudio();

  const language = SUPPORTED_LANGUAGES[customerLanguage];

  // Load existing transcripts
  useEffect(() => {
    const loadTranscripts = async () => {
      try {
        const response = await api.getSessionTranslations(sessionId);
        setTranscripts(response.data);
      } catch (err) {
        console.error('Failed to load transcripts:', err);
      }
    };
    loadTranscripts();
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Stop any playing audio
      stopAudio();
    };
  }, [stopAudio]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setState('listening');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied');
      setState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('processing');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const sourceLanguage = currentSpeaker === 'staff' ? 'en' : customerLanguage;
      const targetLanguage = currentSpeaker === 'staff' ? customerLanguage : 'en';

      // Get translation (STT → Translation)
      const translation = await api.translateAudio(
        sessionId,
        audioBlob,
        sourceLanguage,
        targetLanguage,
        currentSpeaker,
        'Banking conversation at cPort Credit Union'
      );

      if (translation.noSpeechDetected) {
        setError('No speech detected');
        setTimeout(() => {
          setError(null);
          setState('idle');
        }, 2000);
        return;
      }

      // Immediately show the translation text (no waiting for TTS)
      setTranscripts(prev => [...prev, translation]);
      setState('speaking');

      // Notify parent
      if (onTranslation) {
        onTranslation(translation);
      }

      // Use streaming TTS for faster audio playback
      // Audio starts playing as chunks arrive, reducing perceived latency
      if (translation.translatedText) {
        try {
          console.log('[VoiceTranslation] Starting streaming TTS...');
          const startTime = performance.now();
          
          // Play streaming audio - this will start playing as soon as first chunks arrive
          await playStreamingAudio(translation.translatedText, targetLanguage);
          
          console.log(`[VoiceTranslation] Streaming TTS completed in ${(performance.now() - startTime).toFixed(0)}ms`);
          
          // After audio finishes
          setState('idle');
          setCurrentSpeaker(prev => prev === 'staff' ? 'customer' : 'staff');
        } catch (audioErr) {
          console.error('Failed to play streaming TTS:', audioErr);
          
          // Fallback to base64 audio if streaming fails
          if (translation.ttsAudio) {
            try {
              console.log('[VoiceTranslation] Falling back to base64 audio...');
              const audioData = `data:audio/mp3;base64,${translation.ttsAudio}`;
              const audio = new Audio(audioData);
              audio.volume = 0.8;
              audio.onended = () => {
                setState('idle');
                setCurrentSpeaker(prev => prev === 'staff' ? 'customer' : 'staff');
              };
              await audio.play();
            } catch (fallbackErr) {
              console.error('Fallback audio also failed:', fallbackErr);
              setState('idle');
              setCurrentSpeaker(prev => prev === 'staff' ? 'customer' : 'staff');
            }
          } else {
            setTimeout(() => {
              setState('idle');
              setCurrentSpeaker(prev => prev === 'staff' ? 'customer' : 'staff');
            }, 2000);
          }
        }
      } else {
        setTimeout(() => {
          setState('idle');
          setCurrentSpeaker(prev => prev === 'staff' ? 'customer' : 'staff');
        }, 2000);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Translation failed');
      setState('idle');
    }
  };

  const handleToggleListening = useCallback(() => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'listening') {
      stopRecording();
    }
  }, [state]);

  const handleSwitchSpeaker = () => {
    setCurrentSpeaker(prev => prev === 'staff' ? 'customer' : 'staff');
  };

  return (
    <div className="fixed inset-0 bg-[#010101] overflow-hidden flex z-50">
      {/* Main Voice Area */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showPanel ? 'mr-[400px]' : ''}`}>
        {/* Background Gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${language.color}30 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, #00A6A620 0%, transparent 50%)`,
          }}
        />

        {/* Background Lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={language.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00A6A6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {[...Array(8)].map((_, i) => (
              <motion.path
                key={i}
                d={`M ${-50 + i * 60} 0 Q ${200 + i * 20} 400 ${-50 + i * 60} 800`}
                stroke="url(#lineGrad)"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            ))}
          </svg>
        </div>

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between pt-8 px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 rounded-full flex items-center gap-2"
            style={{ backgroundColor: language.color }}
          >
            <span className="text-lg">{language.flag}</span>
            <p className="font-bold text-sm text-black">
              {language.name} ↔ English
            </p>
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ color: language.color }}
                className="text-sm"
              >
                •
              </motion.div>
              <p className="text-sm text-white/50">
                {currentSpeaker === 'staff' ? 'Staff Speaking' : 'Customer Speaking'}
              </p>
            </motion.div>

            {/* Toggle Panel Button */}
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {showPanel ? (
                <PanelRightClose className="w-5 h-5 text-white/70" />
              ) : (
                <PanelRightOpen className="w-5 h-5 text-white/70" />
              )}
            </button>
          </div>
        </div>

        {/* Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <Visualizer state={state} customerLanguageColor={language.color} />

          {/* Status Text - Minimal */}
          <div className="mt-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={state}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {state === 'listening' ? (
                  <p className="text-xl font-light text-white/50 animate-pulse">
                    Listening...
                  </p>
                ) : state === 'processing' ? (
                  <p className="text-xl font-light text-white/50 animate-pulse">
                    Translating...
                  </p>
                ) : state === 'speaking' ? (
                  <p className="text-xl font-light text-white/50">
                    Playing translation...
                  </p>
                ) : error ? (
                  <p className="text-lg text-red-400">{error}</p>
                ) : (
                  <p className="text-lg text-white/30">
                    Tap the microphone to speak
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Voice Controls */}
        <VoiceControls
          isListening={state === 'listening'}
          isProcessing={state === 'processing'}
          onToggleListening={handleToggleListening}
          onClose={onClose}
          onSwitchSpeaker={handleSwitchSpeaker}
          currentSpeaker={currentSpeaker}
          accentColor={language.color}
        />
      </div>

      {/* Transcript Panel */}
      <AnimatePresence>
        {showPanel && (
          <TranscriptPanel
            transcripts={transcripts}
            customerLanguage={customerLanguage}
            currentSpeaker={currentSpeaker}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default VoiceTranslation;
