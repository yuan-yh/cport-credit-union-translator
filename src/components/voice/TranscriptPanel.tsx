import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, User, Headphones } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type LanguageCode, type Translation } from '../../types';

interface TranscriptPanelProps {
  transcripts: Translation[];
  customerLanguage: LanguageCode;
  currentSpeaker: 'staff' | 'customer';
}

export function TranscriptPanel({
  transcripts,
  customerLanguage,
  currentSpeaker,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const language = SUPPORTED_LANGUAGES[customerLanguage];

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-[400px] bg-[#0a0a0a] border-l border-white/10 flex flex-col z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Conversation</h3>
            <p className="text-xs text-white/50">
              {transcripts.length} message{transcripts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Language Indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <span>🇺🇸</span>
            <span className="text-sm text-white/70">English</span>
            <span className="text-white/30 mx-2">↔</span>
            <span>{language.flag}</span>
            <span className="text-sm text-white/70">{language.name}</span>
          </div>
        </div>
      </div>

      {/* Transcripts List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Headphones className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50">No messages yet</p>
            <p className="text-sm text-white/30 mt-1">
              Start speaking to see transcriptions
            </p>
          </div>
        ) : (
          transcripts.map((transcript, index) => (
            <TranscriptMessage
              key={transcript.id || index}
              transcript={transcript}
              customerLanguage={customerLanguage}
            />
          ))
        )}
      </div>

      {/* Current Speaker Indicator */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: currentSpeaker === 'staff' ? '#00A6A620' : `${language.color}20`,
            }}
          >
            <User
              className="w-4 h-4"
              style={{
                color: currentSpeaker === 'staff' ? '#00A6A6' : language.color,
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {currentSpeaker === 'staff' ? 'Staff' : 'Customer'}
            </p>
            <p className="text-xs text-white/50">
              Speaking {currentSpeaker === 'staff' ? 'English' : language.name}
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: currentSpeaker === 'staff' ? '#00A6A6' : language.color,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Individual transcript message
interface TranscriptMessageProps {
  transcript: Translation;
  customerLanguage: LanguageCode;
}

function TranscriptMessage({ transcript, customerLanguage }: TranscriptMessageProps) {
  const isStaff = transcript.speakerType === 'staff';
  const language = SUPPORTED_LANGUAGES[customerLanguage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}
    >
      {/* Speaker label */}
      <div className={`flex items-center gap-2 mb-1 ${isStaff ? '' : 'flex-row-reverse'}`}>
        <span className="text-xs text-white/40">
          {isStaff ? 'Staff' : 'Customer'}
        </span>
        <span className="text-xs text-white/30">
          {formatTime(transcript.createdAt)}
        </span>
      </div>

      {/* Message bubbles */}
      <div className={`max-w-[85%] space-y-2 ${isStaff ? '' : 'flex flex-col items-end'}`}>
        {/* Original text */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isStaff
              ? 'rounded-tl-md bg-[#00A6A6]/20 border border-[#00A6A6]/30'
              : `rounded-tr-md border`
          }`}
          style={!isStaff ? {
            backgroundColor: `${language.color}20`,
            borderColor: `${language.color}30`,
          } : undefined}
        >
          <p className="text-sm text-white/90">{transcript.originalText}</p>
          <p className="text-[10px] text-white/40 mt-1">
            {isStaff ? '🇺🇸 English' : `${language.flag} ${language.name}`}
          </p>
        </div>

        {/* Translated text */}
        <div
          className={`px-4 py-3 rounded-2xl bg-white/5 border border-white/10 ${
            isStaff ? 'rounded-tl-md' : 'rounded-tr-md'
          }`}
        >
          <p className="text-sm text-white/70">{transcript.translatedText}</p>
          <p className="text-[10px] text-white/40 mt-1">
            {isStaff ? `${language.flag} ${language.name}` : '🇺🇸 English'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default TranscriptPanel;
