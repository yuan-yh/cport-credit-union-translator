// =============================================================================
// STREAMING AUDIO HOOK - Play TTS audio as it streams
// Reduces perceived latency by starting playback before full audio is received
// =============================================================================

import { useCallback, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface StreamingAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number; // 0-100
}

interface UseStreamingAudioReturn {
  state: StreamingAudioState;
  playStreamingAudio: (text: string, language: string) => Promise<void>;
  stopAudio: () => void;
}

/**
 * Hook for playing streaming TTS audio
 * Audio starts playing as chunks arrive, reducing perceived latency
 */
export function useStreamingAudio(): UseStreamingAudioReturn {
  const [state, setState] = useState<StreamingAudioState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    progress: 0,
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const stopAudio = useCallback(() => {
    // Abort any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop audio playback
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
      sourceNodeRef.current = null;
    }
    
    setState({
      isPlaying: false,
      isLoading: false,
      error: null,
      progress: 0,
    });
  }, []);

  const playStreamingAudio = useCallback(async (text: string, language: string): Promise<void> => {
    // Stop any currently playing audio
    stopAudio();

    setState({
      isPlaying: false,
      isLoading: true,
      error: null,
      progress: 0,
    });

    const startTime = performance.now();
    
    return new Promise(async (resolve, reject) => {
      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Create or resume AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        console.log('[StreamingAudio] Starting fetch...');
        
        // Fetch streaming audio
        const response = await fetch(`${API_BASE_URL}/api/translations/speak-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text, language }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS failed: ${response.statusText}`);
        }

        const firstByteTime = performance.now() - startTime;
        console.log(`[StreamingAudio] First byte received in ${firstByteTime.toFixed(0)}ms`);

        // Read the stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        // Collect all chunks
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          totalBytes += value.length;
          
          // Update progress (estimated based on typical audio sizes)
          const estimatedProgress = Math.min((totalBytes / 50000) * 100, 95);
          setState(prev => ({ ...prev, progress: estimatedProgress }));
        }

        const downloadTime = performance.now() - startTime;
        console.log(`[StreamingAudio] Full audio received: ${totalBytes} bytes in ${downloadTime.toFixed(0)}ms`);

        // Combine chunks into single buffer
        const audioData = new Uint8Array(totalBytes);
        let offset = 0;
        for (const chunk of chunks) {
          audioData.set(chunk, offset);
          offset += chunk.length;
        }

        // Decode the audio
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.buffer);
        
        // Create and play source node
        const sourceNode = audioContextRef.current.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioContextRef.current.destination);
        
        sourceNodeRef.current = sourceNode;
        
        // Resolve promise when audio finishes playing
        sourceNode.onended = () => {
          setState({
            isPlaying: false,
            isLoading: false,
            error: null,
            progress: 100,
          });
          const totalTime = performance.now() - startTime;
          console.log(`[StreamingAudio] Playback complete. Total time: ${totalTime.toFixed(0)}ms`);
          resolve();
        };

        setState({
          isPlaying: true,
          isLoading: false,
          error: null,
          progress: 100,
        });

        const playStartTime = performance.now() - startTime;
        console.log(`[StreamingAudio] Playback started in ${playStartTime.toFixed(0)}ms`);
        
        sourceNode.start(0);

      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          console.log('[StreamingAudio] Playback aborted');
          resolve(); // Resolve instead of reject for aborts
          return;
        }
        
        console.error('[StreamingAudio] Error:', error);
        setState({
          isPlaying: false,
          isLoading: false,
          error: (error as Error).message,
          progress: 0,
        });
        reject(error);
      }
    });
  }, [accessToken, stopAudio]);

  return {
    state,
    playStreamingAudio,
    stopAudio,
  };
}

// =============================================================================
// SIMPLER APPROACH: Use MediaSource Extensions or HTML5 Audio with streaming
// This version uses the simpler approach of playing audio URL directly
// =============================================================================

/**
 * Play streaming audio using HTML5 Audio element
 * Simpler but may have slightly higher latency than Web Audio API
 */
export function useSimpleStreamingAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const play = useCallback(async (text: string, language: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Create audio element with streaming URL
      // The GET endpoint allows direct use as audio source
      const url = `${API_BASE_URL}/api/translations/speak-stream?text=${encodeURIComponent(text)}&language=${language}`;
      
      const audio = new Audio();
      audioRef.current = audio;
      
      // Set authorization header via fetch and blob
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      audio.src = blobUrl;
      audio.volume = 0.8;
      
      audio.oncanplaythrough = () => {
        setIsLoading(false);
        console.log(`[SimpleStreamingAudio] Ready to play in ${(performance.now() - startTime).toFixed(0)}ms`);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(blobUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(blobUrl);
      };

      await audio.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('[SimpleStreamingAudio] Error:', error);
      setIsLoading(false);
    }
  }, [accessToken]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  return { isPlaying, isLoading, play, stop };
}
