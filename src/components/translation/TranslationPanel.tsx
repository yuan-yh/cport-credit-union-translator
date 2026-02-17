import { useState, useCallback, useEffect } from 'react';
import { X, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui';
import { VoiceRecorderVAD } from './VoiceRecorderVAD';
import { ChatHistory } from './ChatHistory';
import { useSessionStore } from '../../stores/sessionStore';
import { SUPPORTED_LANGUAGES, type LanguageCode, type Translation } from '../../types';
import { api } from '../../lib/api';

// =============================================================================
// TRANSLATION PANEL - SIMPLIFIED
// =============================================================================

interface TranslationPanelProps {
  sessionId: string;
  customerLanguage: LanguageCode;
  onComplete?: () => void;
  className?: string;
}

export function TranslationPanel({
  sessionId,
  customerLanguage,
  onComplete,
  className,
}: TranslationPanelProps): React.ReactElement {
  const { translations, addTranslation, isTranslating, setTranslating, translationError, setTranslationError } = useSessionStore();
  const [currentSpeaker, setCurrentSpeaker] = useState<'customer' | 'staff'>('staff');
  const [isMuted, setIsMuted] = useState(false);

  const language = SUPPORTED_LANGUAGES[customerLanguage];

  // Load existing translations for this session
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await api.getSessionTranslations(sessionId);
        response.data.forEach((t: Translation) => {
          addTranslation(t);
        });
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };

    if (sessionId) {
      loadTranslations();
    }
  }, [sessionId, addTranslation]);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    if (!sessionId) {
      setTranslationError('No active session');
      return;
    }

    setTranslating(true);
    setTranslationError(null);

    try {
      const sourceLanguage = currentSpeaker === 'staff' ? 'en' : customerLanguage;
      const targetLanguage = currentSpeaker === 'staff' ? customerLanguage : 'en';
      const speakerType = currentSpeaker;

      const translation = await api.translateAudio(
        sessionId,
        audioBlob,
        sourceLanguage,
        targetLanguage,
        speakerType,
        'Banking conversation at cPort Credit Union'
      );

      if (translation.noSpeechDetected) {
        console.log('No speech detected');
        return;
      }

      addTranslation(translation);

      // Play TTS audio if available
      if (!isMuted && translation.ttsAudio) {
        try {
          const audioData = `data:audio/mp3;base64,${translation.ttsAudio}`;
          const audio = new Audio(audioData);
          audio.volume = 0.8;
          await audio.play();
        } catch (audioError) {
          console.error('Failed to play TTS audio:', audioError);
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(
        error instanceof Error ? error.message : 'Translation failed'
      );
    } finally {
      setTranslating(false);
    }
  }, [sessionId, currentSpeaker, customerLanguage, isMuted, setTranslating, setTranslationError, addTranslation]);

  const handleError = useCallback((error: string) => {
    setTranslationError(error);
  }, [setTranslationError]);

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl',
        'border-2 border-cport-teal/30 shadow-2xl',
        'bg-cport-navy h-[600px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cport-slate bg-cport-slate/50">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${language.color}20` }}
          >
            <span className="text-xl">{language.flag}</span>
          </div>
          <div>
            <h3 className="text-base font-medium text-white">
              Live Translation
            </h3>
            <p className="text-sm text-gray-400">
              {language.name} ↔ English
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
          >
            <Volume2 className={cn('w-4 h-4', isMuted && 'opacity-50')} />
          </Button>
          {onComplete && (
            <Button variant="ghost" size="sm" onClick={onComplete}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat History */}
      <ChatHistory
        translations={translations}
        customerLanguage={customerLanguage}
        className="flex-1 min-h-0"
      />

      {/* Error display */}
      {translationError && (
        <div className="mx-4 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{translationError}</p>
        </div>
      )}

      {/* Recording Controls */}
      <div className="border-t border-cport-slate p-4 space-y-4 bg-cport-slate/50">
        {/* Speaker toggle */}
        <div className="flex items-center justify-center gap-2">
          <SpeakerToggle
            speaker="staff"
            isActive={currentSpeaker === 'staff'}
            onClick={() => setCurrentSpeaker('staff')}
          />
          <div className="w-px h-6 bg-gray-600" />
          <SpeakerToggle
            speaker="customer"
            isActive={currentSpeaker === 'customer'}
            onClick={() => setCurrentSpeaker('customer')}
            language={language}
          />
        </div>

        {/* Voice recorder with VAD */}
        <VoiceRecorderVAD
          onRecordingComplete={handleRecordingComplete}
          onError={handleError}
          isProcessing={isTranslating}
          size="md"
        />
      </div>
    </div>
  );
}

// =============================================================================
// SPEAKER TOGGLE
// =============================================================================

interface SpeakerToggleProps {
  speaker: 'staff' | 'customer';
  isActive: boolean;
  onClick: () => void;
  language?: (typeof SUPPORTED_LANGUAGES)[LanguageCode];
}

function SpeakerToggle({
  speaker,
  isActive,
  onClick,
  language,
}: SpeakerToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full transition-all duration-150',
        'flex items-center gap-2',
        isActive
          ? 'bg-cport-teal border-2 border-cport-teal-light'
          : 'bg-cport-navy border-2 border-gray-600 opacity-60 hover:opacity-100'
      )}
    >
      {speaker === 'customer' && language ? (
        <>
          <span className="text-lg">{language.flag}</span>
          <span className="text-sm font-medium text-white">Customer</span>
        </>
      ) : (
        <>
          <span className="text-lg">🇺🇸</span>
          <span className="text-sm font-medium text-white">Staff</span>
        </>
      )}
    </button>
  );
}
