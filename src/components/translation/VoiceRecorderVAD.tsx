import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

// =============================================================================
// VOICE RECORDER WITH VAD (Voice Activity Detection)
// Uses Web Audio API for simple, reliable speech detection
// Click to start listening, auto-detects speech start/stop
// =============================================================================

type VADState = 'idle' | 'listening' | 'speaking' | 'processing';

interface VoiceRecorderVADProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onError?: (error: string) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// VAD Configuration
const VAD_CONFIG = {
  // Volume threshold to detect speech (0-1) - higher = less sensitive
  speechThreshold: 0.05,
  // How many consecutive checks above threshold to confirm speech
  speechConfirmationCount: 3,
  // How long silence before considering speech ended (ms)
  silenceTimeout: 1500,
  // Minimum speech duration to process (ms)
  minSpeechDuration: 800,
  // How often to check audio levels (ms)
  checkInterval: 50,
};

export function VoiceRecorderVAD({
  onRecordingComplete,
  onError,
  isProcessing = false,
  disabled = false,
  size = 'lg',
  className,
}: VoiceRecorderVADProps): React.ReactElement {
  const [state, setState] = useState<VADState>(isProcessing ? 'processing' : 'idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const speechConfirmCountRef = useRef<number>(0);

  // Update state when external processing state changes
  useEffect(() => {
    if (isProcessing && state !== 'processing') {
      setState('processing');
    } else if (!isProcessing && state === 'processing') {
      // Go back to listening after processing completes
      if (streamRef.current) {
        setState('listening');
      } else {
        setState('idle');
      }
    }
  }, [isProcessing, state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const getAudioLevel = useCallback((): number => {
    if (!analyzerRef.current) return 0;
    
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (root mean square) for better volume detection
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += (dataArray[i] / 255) ** 2;
    }
    return Math.sqrt(sum / dataArray.length);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current || mediaRecorderRef.current?.state === 'recording') return;

    console.log('[VAD] Starting recording...');
    chunksRef.current = [];
    startTimeRef.current = Date.now();
    setDuration(0);

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const recordingDuration = Date.now() - startTimeRef.current;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Only process if we have meaningful audio
      if (recordingDuration >= VAD_CONFIG.minSpeechDuration && chunksRef.current.length > 0) {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log(`[VAD] Recording complete: ${recordingDuration}ms, ${audioBlob.size} bytes`);
        setState('processing');
        onRecordingComplete(audioBlob, recordingDuration);
      } else {
        console.log(`[VAD] Recording too short (${recordingDuration}ms), discarding`);
        setState('listening');
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setState('speaking');
    isSpeakingRef.current = true;

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration(Date.now() - startTimeRef.current);
    }, 100);
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      console.log('[VAD] Stopping recording...');
      mediaRecorderRef.current.stop();
      isSpeakingRef.current = false;
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      console.log('[VAD] Starting listening mode...');
      
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;

      // Set up audio analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.8;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      setState('listening');

      // Start VAD monitoring
      speechConfirmCountRef.current = 0;
      
      vadIntervalRef.current = setInterval(() => {
        const level = getAudioLevel();
        setAudioLevel(level);

        if (level > VAD_CONFIG.speechThreshold) {
          // Speech detected - increment confirmation counter
          speechConfirmCountRef.current++;
          
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          // Only start recording after confirmed speech (multiple consecutive samples)
          if (!isSpeakingRef.current && speechConfirmCountRef.current >= VAD_CONFIG.speechConfirmationCount) {
            console.log(`[VAD] Speech confirmed after ${speechConfirmCountRef.current} samples`);
            startRecording();
          }
        } else {
          // Silence detected - reset confirmation counter
          speechConfirmCountRef.current = 0;
          
          if (isSpeakingRef.current && !silenceTimerRef.current) {
            // Start silence timer
            silenceTimerRef.current = setTimeout(() => {
              console.log('[VAD] Silence timeout reached');
              stopRecording();
              silenceTimerRef.current = null;
            }, VAD_CONFIG.silenceTimeout);
          }
        }
      }, VAD_CONFIG.checkInterval);

    } catch (error) {
      console.error('[VAD] Failed to start:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError?.('Microphone access denied. Please allow microphone access.');
        } else {
          onError?.(`Failed to start: ${error.message}`);
        }
      } else {
        onError?.('Failed to access microphone.');
      }
      setState('idle');
    }
  }, [getAudioLevel, startRecording, stopRecording, onError]);

  const stopListening = useCallback(() => {
    console.log('[VAD] Stopping listening mode...');
    
    // Stop VAD monitoring
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    isSpeakingRef.current = false;
    speechConfirmCountRef.current = 0;

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyzerRef.current = null;

    // Clear duration timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setAudioLevel(0);
    setDuration(0);
    setState('idle');
  }, []);

  const toggleListening = () => {
    if (state === 'idle') {
      startListening();
    } else if (state === 'listening' || state === 'speaking') {
      stopListening();
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

  // Audio level ring scale
  const ringScale = 1 + audioLevel * 2;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Main button */}
      <button
        type="button"
        onClick={toggleListening}
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
          state === 'listening' && [
            'bg-cport-teal border-4 border-cport-teal-light',
            'shadow-glow-teal',
            'focus:ring-cport-teal/50',
          ],
          state === 'speaking' && [
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
        {/* Audio level ring */}
        {(state === 'listening' || state === 'speaking') && (
          <span 
            className={cn(
              'absolute inset-0 rounded-full border-2 transition-transform duration-75',
              state === 'listening' ? 'border-cport-teal-light/50' : 'border-danger-400/50'
            )}
            style={{ transform: `scale(${ringScale})` }}
          />
        )}

        {/* Pulse rings when speaking */}
        {state === 'speaking' && (
          <>
            <span className="absolute inset-0 rounded-full bg-danger-600/50 animate-ping" />
            <span 
              className="absolute -inset-4 rounded-full border border-danger-400/30 animate-pulse-ring"
              style={{ animationDelay: '0.2s' }}
            />
          </>
        )}

        {/* Listening pulse */}
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-full bg-cport-teal/30 animate-pulse" />
        )}

        {/* Icon */}
        <span className="relative z-10 flex items-center justify-center">
          {state === 'idle' && (
            <Mic className={cn(iconSizes[size], 'text-cport-gray')} />
          )}
          {state === 'listening' && (
            <Volume2 className={cn(iconSizes[size], 'text-white')} />
          )}
          {state === 'speaking' && (
            <Mic className={cn(iconSizes[size], 'text-white animate-pulse')} />
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
            {disabled ? 'Service unavailable' : 'Click to start listening'}
          </p>
        )}
        {state === 'listening' && (
          <p className="text-body-sm text-cport-teal font-medium">
            Listening... (click to stop)
          </p>
        )}
        {state === 'speaking' && (
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

      {/* Audio level indicator */}
      {(state === 'listening' || state === 'speaking') && (
        <div className="w-32 h-2 bg-cport-slate rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-75 rounded-full',
              audioLevel > VAD_CONFIG.speechThreshold ? 'bg-danger-500' : 'bg-cport-teal'
            )}
            style={{ width: `${Math.min(audioLevel * 500, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
