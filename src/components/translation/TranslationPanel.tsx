import { useState, useCallback } from 'react';
import { X, Volume2, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button, Card } from '../ui';
import { VoiceRecorder } from './VoiceRecorder';
import { ChatHistory } from './ChatHistory';
import { CompactLanguageSelector } from './LanguageSelector';
import { useSessionStore } from '../../stores/sessionStore';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../types';

// =============================================================================
// TRANSLATION PANEL
// =============================================================================

interface TranslationPanelProps {
  sessionId?: string;
  customerLanguage: LanguageCode;
  onClose: () => void;
  onLanguageChange?: (language: LanguageCode) => void;
  className?: string;
}

export function TranslationPanel({
  customerLanguage,
  onClose,
  onLanguageChange,
  className,
}: TranslationPanelProps): React.ReactElement {
  const { translations, requestTranslation, isTranslating, translationError } = useSessionStore();
  const [currentSpeaker, setCurrentSpeaker] = useState<'customer' | 'staff'>('staff');
  const [isMuted, setIsMuted] = useState(false);

  const language = SUPPORTED_LANGUAGES[customerLanguage];

  const handleRecordingComplete = useCallback(async (_audioBlob: Blob, _duration: number) => {
    // In production, this would send audio to transcription API first
    // For now, we'll simulate with mock text
    const mockTexts = {
      staff: [
        'Hello, how can I help you today?',
        'I can help you with that.',
        'Let me check your account.',
        'Is there anything else you need?',
      ],
      customer: [
        'I need to open a savings account',
        'I would like to make a deposit',
        'Can you check my balance?',
        'Thank you for your help',
      ],
    };

    const texts = mockTexts[currentSpeaker];
    const randomText = texts[Math.floor(Math.random() * texts.length)];

    try {
      await requestTranslation({
        text: randomText,
        sourceLanguage: currentSpeaker === 'staff' ? 'en' : customerLanguage,
        targetLanguage: currentSpeaker === 'staff' ? customerLanguage : 'en',
        speakerType: currentSpeaker,
      });
    } catch (error) {
      console.error('Translation error:', error);
    }
  }, [currentSpeaker, customerLanguage, requestTranslation]);

  const handleError = useCallback((error: string) => {
    console.error('Recording error:', error);
  }, []);

  return (
    <Card
      variant="elevated"
      padding="none"
      className={cn(
        'fixed inset-4 lg:inset-auto lg:bottom-6 lg:right-6',
        'lg:w-[480px] lg:h-[640px]',
        'flex flex-col overflow-hidden z-50',
        'animate-slide-up',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-harbor/30">
        <div className="flex items-center gap-3">
          {/* Language indicator */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${language.color}20` }}
          >
            <span className="text-xl">{language.flag}</span>
          </div>
          <div>
            <h3 className="text-body font-medium text-white">
              Live Translation
            </h3>
            <p className="text-caption text-brand-fog">
              {language.name} ↔ English
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <Volume2 className={cn('w-4 h-4', isMuted && 'opacity-50')} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Button>
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
        <div className="mx-4 mb-2 p-3 rounded-lg bg-danger-600/10 border border-danger-600/20">
          <p className="text-body-sm text-danger-400">{translationError}</p>
        </div>
      )}

      {/* Recording Controls */}
      <div className="border-t border-brand-harbor/30 p-4 space-y-4">
        {/* Speaker toggle */}
        <div className="flex items-center justify-center gap-2">
          <SpeakerToggle
            speaker="staff"
            isActive={currentSpeaker === 'staff'}
            onClick={() => setCurrentSpeaker('staff')}
          />
          <div className="w-px h-6 bg-brand-harbor/50" />
          <SpeakerToggle
            speaker="customer"
            isActive={currentSpeaker === 'customer'}
            onClick={() => setCurrentSpeaker('customer')}
            language={language}
          />
        </div>

        {/* Voice recorder */}
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          onError={handleError}
          isProcessing={isTranslating}
          size="md"
        />

        {/* Language quick-switch */}
        {onLanguageChange && (
          <div className="pt-2 border-t border-brand-harbor/30">
            <p className="text-caption text-brand-fog mb-2 text-center">
              Change customer language:
            </p>
            <CompactLanguageSelector
              selectedLanguage={customerLanguage}
              onLanguageChange={onLanguageChange}
              className="justify-center"
            />
          </div>
        )}
      </div>
    </Card>
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
          ? 'bg-brand-steel-blue border-2 border-info-400'
          : 'bg-brand-deep-ocean border-2 border-brand-harbor/30 opacity-60 hover:opacity-100'
      )}
    >
      {speaker === 'customer' && language ? (
        <>
          <span className="text-lg">{language.flag}</span>
          <span className="text-body-sm font-medium text-white">Customer</span>
        </>
      ) : (
        <>
          <span className="text-lg">🇺🇸</span>
          <span className="text-body-sm font-medium text-white">Staff</span>
        </>
      )}
    </button>
  );
}
