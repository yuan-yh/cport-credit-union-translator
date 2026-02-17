import { useEffect, useRef } from 'react';
import { cn, formatTime, getConfidenceLevel } from '../../lib/utils';
import { SUPPORTED_LANGUAGES, type Translation, type LanguageCode } from '../../types';

// =============================================================================
// CHAT HISTORY COMPONENT
// =============================================================================

interface ChatHistoryProps {
  translations: Translation[];
  customerLanguage: LanguageCode;
  className?: string;
}

export function ChatHistory({
  translations,
  customerLanguage,
  className,
}: ChatHistoryProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [translations]);

  if (translations.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 px-6',
        className
      )}>
        <div className="w-16 h-16 rounded-full bg-cport-slate flex items-center justify-center mb-4">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-cport-gray"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-body-sm text-cport-gray text-center">
          No conversation yet
        </p>
        <p className="text-caption text-cport-gray mt-1 text-center">
          Start speaking to begin translation
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col gap-4 overflow-y-auto px-4 py-2',
        className
      )}
    >
      {translations.map((translation) => (
        <ChatMessage
          key={translation.id}
          translation={translation}
          customerLanguage={customerLanguage}
        />
      ))}
    </div>
  );
}

// =============================================================================
// CHAT MESSAGE
// =============================================================================

interface ChatMessageProps {
  translation: Translation;
  customerLanguage: LanguageCode;
}

function ChatMessage({ translation, customerLanguage }: ChatMessageProps): React.ReactElement {
  const isCustomer = translation.speakerType === 'customer';
  const language = SUPPORTED_LANGUAGES[isCustomer ? customerLanguage : 'en'];
  const confidenceLevel = getConfidenceLevel(translation.confidence);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 max-w-[85%] animate-fade-in',
        isCustomer ? 'self-start' : 'self-end items-end'
      )}
    >
      {/* Speaker label */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: language.color }}
        />
        <span className="text-caption text-cport-gray">
          {isCustomer ? 'Customer' : 'Staff'} • {formatTime(translation.createdAt)}
        </span>
      </div>

      {/* Original text */}
      <div
        className={cn(
          'px-4 py-3 rounded-2xl',
          isCustomer
            ? 'bg-cport-slate rounded-tl-sm'
            : 'bg-cport-teal/20 rounded-tr-sm'
        )}
      >
        <p
          className="text-body text-white"
          style={{ direction: language.rtl ? 'rtl' : 'ltr' }}
        >
          {translation.originalText}
        </p>
      </div>

      {/* Translation */}
      <div
        className={cn(
          'px-4 py-2 rounded-xl border',
          isCustomer
            ? 'border-cport-gray/30 bg-cport-navy'
            : 'border-cport-teal/30 bg-cport-teal/10'
        )}
      >
        <p
          className="text-body-sm text-cport-green-light"
          style={{ direction: !isCustomer && SUPPORTED_LANGUAGES[customerLanguage].rtl ? 'rtl' : 'ltr' }}
        >
          {translation.translatedText}
        </p>
      </div>

      {/* Confidence indicator */}
      <div className="flex items-center gap-2 text-caption">
        <ConfidenceBar level={confidenceLevel} />
        <span className="text-cport-gray">
          {Math.round(translation.confidence * 100)}% confident
        </span>
        {translation.processingTimeMs && (
          <span className="text-cport-gray">
            • {translation.processingTimeMs}ms
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CONFIDENCE BAR
// =============================================================================

interface ConfidenceBarProps {
  level: 'high' | 'medium' | 'low';
}

function ConfidenceBar({ level }: ConfidenceBarProps): React.ReactElement {
  const colors = {
    high: 'bg-success-400',
    medium: 'bg-warning-400',
    low: 'bg-danger-400',
  };

  const widths = {
    high: 'w-full',
    medium: 'w-2/3',
    low: 'w-1/3',
  };

  return (
    <div className="w-12 h-1.5 rounded-full bg-cport-slate overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', colors[level], widths[level])}
      />
    </div>
  );
}
