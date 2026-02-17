import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

// =============================================================================
// VOICE RECORDER COMPONENT
// =============================================================================

type RecorderState = 'idle' | 'recording' | 'processing';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onError?: (error: string) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VoiceRecorder({
  onRecordingComplete,
  onError,
  isProcessing = false,
  disabled = false,
  size = 'lg',
  className,
}: VoiceRecorderProps): React.ReactElement {
  const [state, setState] = useState<RecorderState>(isProcessing ? 'processing' : 'idle');
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Update state when external processing state changes
  useEffect(() => {
    if (isProcessing && state !== 'processing') {
      setState('processing');
    } else if (!isProcessing && state === 'processing') {
      setState('idle');
    }
  }, [isProcessing, state]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const recordingDuration = Date.now() - startTimeRef.current;
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Only call callback if we have audio data
        if (audioBlob.size > 0) {
          onRecordingComplete(audioBlob, recordingDuration);
        }
      };

      mediaRecorder.onerror = () => {
        onError?.('Recording failed. Please try again.');
        setState('idle');
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setState('recording');
      startTimeRef.current = Date.now();
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current);
      }, 100);

    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.('Microphone access denied. Please enable microphone permissions.');
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('processing');
    }
  }, [state]);

  const handleMouseDown = () => {
    if (state === 'idle' && !disabled) {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (state === 'recording') {
      stopRecording();
    }
  };

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' && state === 'idle' && !disabled) {
      e.preventDefault();
      startRecording();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' && state === 'recording') {
      e.preventDefault();
      stopRecording();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Main button */}
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        disabled={state === 'processing' || disabled}
        className={cn(
          'relative rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-cport-navy',
          sizeClasses[size],
          state === 'idle' && !disabled && [
            'bg-cport-slate border-4 border-cport-gray/30',
            'hover:border-cport-teal hover:shadow-lg hover:shadow-cport-teal/20',
            'focus:ring-cport-teal/50',
          ],
          state === 'idle' && disabled && [
            'bg-cport-slate/50 border-4 border-cport-gray/20',
            'cursor-not-allowed opacity-50',
          ],
          state === 'recording' && [
            'bg-danger-600 border-4 border-danger-400',
            'shadow-glow-red scale-105',
            'focus:ring-danger-400/50',
          ],
          state === 'processing' && [
            'bg-cport-slate border-4 border-cport-gray/30',
            'cursor-wait',
          ]
        )}
      >
        {/* Pulse rings when recording */}
        {state === 'recording' && (
          <>
            <span className="absolute inset-0 rounded-full bg-danger-600/50 animate-ping" />
            <span 
              className="absolute inset-0 rounded-full border-2 border-danger-400/50 animate-pulse-ring"
              style={{ animationDelay: '0.2s' }}
            />
            <span 
              className="absolute -inset-4 rounded-full border border-danger-400/30 animate-pulse-ring"
              style={{ animationDelay: '0.4s' }}
            />
          </>
        )}

        {/* Icon */}
        <span className="relative z-10 flex items-center justify-center">
          {state === 'idle' && (
            <Mic className={cn(iconSizes[size], 'text-cport-gray')} />
          )}
          {state === 'recording' && (
            <Square className={cn(iconSizes[size], 'text-white fill-white')} />
          )}
          {state === 'processing' && (
            <Loader2 className={cn(iconSizes[size], 'text-cport-gray animate-spin')} />
          )}
        </span>
      </button>

      {/* Label */}
      <div className="text-center">
        {state === 'idle' && (
          <p className="text-body-sm text-cport-gray">
            {disabled ? 'Service unavailable' : 'Hold to speak'}
          </p>
        )}
        {state === 'recording' && (
          <p className="text-body-sm text-danger-400 font-medium">
            Recording... {formatDuration(duration)}
          </p>
        )}
        {state === 'processing' && (
          <p className="text-body-sm text-cport-gray animate-pulse">
            Processing...
          </p>
        )}
      </div>
    </div>
  );
}
