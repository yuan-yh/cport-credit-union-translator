import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Extend window interface for audio stream
declare global {
    interface Window {
        currentAudioStream?: MediaStream;
    }
}

interface StreamingVoiceTranslationPanelProps {
    targetLanguage: string;
    onClose: () => void;
    onCustomerDataUpdate?: (data: { name?: string; phone?: string; notes?: string; mood?: 'calm' | 'anxious' | 'urgent' }) => void;
    currentCustomerData?: { name?: string; phone?: string; notes?: string; mood?: 'calm' | 'anxious' | 'urgent' };
}

interface StreamingTranslationEntry {
    originalText: string;
    translatedText: string;
    turn: 'customer' | 'staff';
    timestamp: Date;
    isPartial: boolean;
    audioUrl?: string;
}

const StreamingVoiceTranslationPanel: React.FC<StreamingVoiceTranslationPanelProps> = ({
    targetLanguage,
    onClose,
    onCustomerDataUpdate,
    currentCustomerData = {}
}) => {
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://cport-576395442003.us-east1.run.app';
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<StreamingTranslationEntry[]>([]);
    const [currentTurn, setCurrentTurn] = useState<'customer' | 'staff'>('customer');
    const [audioLevel, setAudioLevel] = useState(0);
    const [status, setStatus] = useState('Ready to listen');
    // const [extractedInfo, setExtractedInfo] = useState<string>('');
    // const [moodInfo, setMoodInfo] = useState<string>('');
    const [currentPartialText, setCurrentPartialText] = useState('');
    const [currentTranslatedText, setCurrentTranslatedText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSpeakingRef = useRef(false);
    
    // Simple processing timer
    const deliveryTimerRef = useRef<number | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioPreloadRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const sessionIdRef = useRef<string>('');
    // const audioChunksRef = useRef<Blob[]>([]);
    // const recordingIntervalRef = useRef<number | null>(null);
    const lastFinalBlobRef = useRef<Blob | null>(null);
    
    // Voice Activity Detection - Simple fixed threshold
    const baseThreshold = 0.03; // Higher fixed threshold to ignore background noise
    const [vadThreshold, setVadThreshold] = useState(0.03);
    // const silenceTimeout = 1000; // 1 second of silence before processing
    // const silenceDuration = 1500; // Need 1.5 seconds of silence to trigger processing
    const silenceTimerRef = useRef<number | null>(null);
    const isRecordingRef = useRef<boolean>(false);
    const currentAudioChunksRef = useRef<Blob[]>([]);
    const silenceCountRef = useRef<number>(0);
    const requiredSilenceFrames = 100; // Need 100 frames (~2 seconds) of sustained silence
    
    // Voice learning system
    const voiceLevelsRef = useRef<number[]>([]);
    // const backgroundLevelsRef = useRef<number[]>([]);
    // const isLearningRef = useRef<boolean>(false);
    // const learningFramesRef = useRef<number>(0);
    // const maxLearningFrames = 60; // Learn for 3 seconds

    // Initialize WebSocket connection
    useEffect(() => {
        const socket = io(API_BASE.replace('/api', ''), {
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to streaming server');
        });

        socket.on('streaming_started', (data) => {
            console.log('Streaming session started:', data.sessionId);
            sessionIdRef.current = data.sessionId;
        });

        socket.on('streaming_partial_result', (data) => {
            console.log('📝 Real-time translation received:', data);
            setCurrentPartialText(data.originalText);
            setCurrentTranslatedText(data.translatedText);
            setStatus('Live translation...');
        });

        socket.on('streaming_audio_result', (data) => {
            console.log('🔊 Audio result received:', data);
            playAudioFromBase64(data.audioBuffer);
            setStatus('Playing translation...');
            
            // Add to conversation history
            const newEntry: StreamingTranslationEntry = {
                originalText: currentPartialText,
                translatedText: data.translatedText,
                turn: currentTurn,
                timestamp: new Date(),
                isPartial: false
            };
            setConversationHistory(prev => [...prev, newEntry]);

            // Trigger combined finalize call to populate customer data and mood
            try {
                if (onCustomerDataUpdate) {
                    finalizeTurnPopulate(currentPartialText, data.translatedText);
                }
            } catch (e) {
                console.log('Background finalize failed:', e);
            }
            
            // Switch turn
            setCurrentTurn(prev => prev === 'customer' ? 'staff' : 'customer');
            setCurrentPartialText('');
            setCurrentTranslatedText('');
            setIsProcessing(false);
            setStatus(`Listening for ${currentTurn === 'customer' ? 'staff (English)' : `customer (${targetLanguage})`}...`);
        });

        socket.on('streaming_error', (data) => {
            console.error('Streaming error:', data.error);
            setStatus('Streaming error occurred');
            setIsProcessing(false);
        });

        socket.on('streaming_stopped', (data) => {
            console.log('Streaming stopped:', data.sessionId);
            setIsProcessing(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [API_BASE, currentTurn]);

    // Initialize audio context for waveform visualization
    useEffect(() => {
        audioPreloadRef.current = new Audio();
        audioPreloadRef.current.preload = 'auto';
        
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    audioContextRef.current.close();
                } catch (error) {
                    console.log('AudioContext already closed or closing');
                }
            }
            if (audioPreloadRef.current) {
                audioPreloadRef.current.pause();
                audioPreloadRef.current.src = '';
            }
        };
    }, []);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isListening) {
                stopListening();
            }
        };
    }, [isListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
        };
    }, []);

    const playAudioFromBase64 = (base64Audio: string) => {
        try {
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const audioBlob = new Blob([bytes], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audio = new Audio(audioUrl);
            audio.volume = 0.9;
            audio.play().catch(err => {
                console.error('Audio playback failed:', err);
                setStatus('Audio playback failed');
            });
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const processFinalAudio = () => {
        console.log('🎯 Processing final audio for translation...');
        setStatus('Processing translation...');
        
        if (currentAudioChunksRef.current.length > 0 && socketRef.current && sessionIdRef.current) {
            const audioBlob = new Blob(currentAudioChunksRef.current, { type: 'audio/webm' });
            lastFinalBlobRef.current = audioBlob;
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                console.log('🎯 Sending final audio for translation, size:', base64.length);
                socketRef.current?.emit('streaming_audio_chunk', {
                    audioData: base64,
                    sessionId: sessionIdRef.current,
                    isFinal: true
                });
            };
            reader.readAsDataURL(audioBlob);
        } else {
            console.log('❌ No audio to process');
            setStatus('No audio recorded');
        }
    };

    // Post helpers
    const postJson = async (url: string, body: any) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
    };

    const extractAndPopulateCustomerData = async (latestOriginalText: string) => {
        try {
            let inferredSourceLanguage = currentTurn === 'customer' ? targetLanguage : 'en';
            // Prefer the provided text; if empty, fall back to most recent conversation entry
            const fallbackEntry = conversationHistory[conversationHistory.length - 1];
            let safeText = (latestOriginalText && latestOriginalText.trim())
                ? latestOriginalText
                : (fallbackEntry?.originalText || '');

            // If original text is empty (e.g., only translated text available),
            // use translated text for extraction in English.
            if (!safeText && fallbackEntry?.translatedText) {
                safeText = fallbackEntry.translatedText;
                inferredSourceLanguage = 'en';
            }

            if (!safeText) {
                console.log('Skipping extraction: no original text available');
                return;
            }
            const payload = {
                text: safeText,
                sourceLanguage: inferredSourceLanguage,
                conversationHistory: conversationHistory.map(e => ({
                    turn: e.turn,
                    originalText: e.originalText,
                    translatedText: e.translatedText,
                    timestamp: e.timestamp
                })),
                currentCustomerData
            };
            const result = await postJson(`${API_BASE}/api/extract-customer-info`, payload);
            if (result && result.hasUpdates && result.updatedCustomerData && onCustomerDataUpdate) {
                const upd = result.updatedCustomerData || {};
                onCustomerDataUpdate({
                    name: upd.name || currentCustomerData.name,
                    phone: upd.phone || currentCustomerData.phone,
                    notes: upd.notes || currentCustomerData.notes
                } as any);
            }
        } catch (err) {
            console.log('Customer data extraction failed:', err);
        }
    };

    const analyzeAndPopulateMood = async () => {
        if (!lastFinalBlobRef.current || !onCustomerDataUpdate) return;
        try {
            const form = new FormData();
            form.append('audio', lastFinalBlobRef.current, 'final.webm');
            const res = await fetch(`${API_BASE}/api/analyze-emotion`, { method: 'POST', body: form });
            if (!res.ok) throw new Error(`Emotion API ${res.status}`);
            const data = await res.json();
            const primary = (data?.primaryEmotion?.name || data?.emotions?.[0]?.name || '').toLowerCase();
            const mappedMood = (['anger','frustration','stress','impatience','urgent'].includes(primary)
                ? 'urgent'
                : ['anxiety','fear','sadness','nervous','anxious'].includes(primary)
                ? 'anxious'
                : 'calm') as 'calm' | 'anxious' | 'urgent';
            onCustomerDataUpdate({ mood: mappedMood } as any);
        } catch (e) {
            console.log('Emotion analysis failed:', e);
        }
    };

    const finalizeTurnPopulate = async (latestOriginalText: string, latestTranslatedText: string) => {
        try {
            // Prepare optional encoded audio for emotion (best effort)
            let audioBase64: string | undefined;
            if (lastFinalBlobRef.current) {
                const b = await lastFinalBlobRef.current.arrayBuffer();
                audioBase64 = btoa(String.fromCharCode(...new Uint8Array(b)));
            }

            const payload = {
                originalText: latestOriginalText || '',
                translatedText: latestTranslatedText || '',
                conversationHistory: conversationHistory.map(e => ({
                    turn: e.turn,
                    originalText: e.originalText,
                    translatedText: e.translatedText,
                    timestamp: e.timestamp
                })),
                currentCustomerData,
                ...(audioBase64 ? { audioBase64 } : {})
            };

            const result = await postJson(`${API_BASE}/api/streaming-finalize`, payload);
            if (result?.customerDataExtraction?.updatedCustomerData && onCustomerDataUpdate) {
                const upd = result.customerDataExtraction.updatedCustomerData || {};
                onCustomerDataUpdate({
                    name: upd.name || currentCustomerData.name,
                    phone: upd.phone || currentCustomerData.phone,
                    notes: upd.notes || currentCustomerData.notes
                } as any);
            }
            if (result?.emotionAnalysis?.primaryEmotion?.name && onCustomerDataUpdate) {
                const primary = (result.emotionAnalysis.primaryEmotion.name as string).toLowerCase();
                const mappedMood = (['anger','frustration','stress','impatience','urgent'].includes(primary)
                    ? 'urgent'
                    : ['anxiety','fear','sadness','nervous','anxious'].includes(primary)
                    ? 'anxious'
                    : 'calm') as 'calm' | 'anxious' | 'urgent';
                onCustomerDataUpdate({ mood: mappedMood } as any);
            }
        } catch (e) {
            console.log('Finalize populate failed:', e);
        }
    };

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1,
                    // latency: 0.01 // Ultra-low latency - not supported in MediaTrackConstraints
                } 
            });
            console.log('🎤 Got audio stream:', stream);
            
            // Set up optimized audio context for VAD (only if not already created)
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new AudioContext({
                    sampleRate: 48000,
                    latencyHint: 'interactive' // Ultra-low latency
                });
            }
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            
            // Optimized settings for ultra-fast VAD
            analyserRef.current.fftSize = 128; // Smaller FFT for faster processing
            analyserRef.current.smoothingTimeConstant = 0.3; // Less smoothing for faster response
            analyserRef.current.minDecibels = -90;
            analyserRef.current.maxDecibels = -10;
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            // Store the original stream for recording
            window.currentAudioStream = stream;
            console.log('🎤 Stored audio stream for recording');

            // Reset VAD system
            setVadThreshold(baseThreshold);
            setStatus('Ready - speak now');

            // Start VAD monitoring
            startVADMonitoring();

            // Start streaming translation session
            if (socketRef.current) {
                const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sessionIdRef.current = sessionId;
                socketRef.current.emit('start_streaming_translation', {
                    sourceLanguage: currentTurn === 'customer' ? targetLanguage : 'en',
                    targetLanguage: currentTurn === 'customer' ? 'en' : targetLanguage,
                    sessionId
                });
            }

            setIsListening(true);
            setStatus(`Listening for ${currentTurn === 'customer' ? targetLanguage : 'English'} speech...`);

        } catch (error) {
            console.error('Error starting listening:', error);
            setStatus('Microphone access denied');
        }
    };

    const startVADMonitoring = () => {
        console.log('🎤 Starting VAD monitoring...');
        let frameCount = 0;
        
        const checkAudioLevel = () => {
            if (!analyserRef.current || !dataArrayRef.current) {
                console.log('❌ VAD: Missing analyser or data array');
                return;
            }

            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
            // Calculate average frequency data for VAD
            const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
            const normalizedLevel = average / 255;
            
            setAudioLevel(normalizedLevel);
            
            // Log audio level every 30 frames (about every 0.5 seconds)
            frameCount++;
            if (frameCount % 30 === 0) {
                const status = normalizedLevel > vadThreshold ? 'SPEECH' : 'SILENCE';
                console.log(`🎤 Audio level: ${normalizedLevel.toFixed(4)} (${status}) - threshold: ${vadThreshold} - isSpeaking: ${isSpeakingRef.current} - silenceCount: ${silenceCountRef.current}`);
            }

            // Ultra-low latency Voice Activity Detection
            if (normalizedLevel > vadThreshold) {
                // Speech detected - start processing immediately
                console.log('⚡ Speech detected! Starting immediate processing...', normalizedLevel.toFixed(4));
                if (!isRecordingRef.current) {
                    console.log('⚡ Starting ultra-fast recording...');
                    startRecordingSpeech();
                }
                isSpeakingRef.current = true;
                setIsSpeaking(true);
                setStatus(`⚡ Processing in real-time...`);
                
                // Learn from user's voice levels
                voiceLevelsRef.current.push(normalizedLevel);
                if (voiceLevelsRef.current.length > 20) {
                    voiceLevelsRef.current.shift(); // Keep only last 20 samples
                }
                
                // Reset silence counter when speech resumes
                silenceCountRef.current = 0;
                
                // Clear any existing timer
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            } else {
                // Silence detected - only count if we were previously speaking
                if (isSpeakingRef.current) {
                    silenceCountRef.current++;
                    const silenceProgress = Math.min(silenceCountRef.current / requiredSilenceFrames * 100, 100);
                    console.log(`🔇 Silence frame ${silenceCountRef.current}/${requiredSilenceFrames} (${silenceProgress.toFixed(1)}%) - level: ${normalizedLevel.toFixed(4)}`);
                    
                    // Update status to show silence countdown
                    setStatus(`Listening... (${Math.max(0, 2 - (silenceCountRef.current / 50)).toFixed(1)}s silence remaining)`);
                    
                    // Check if we have enough sustained silence frames (2 seconds)
                    if (silenceCountRef.current >= requiredSilenceFrames) {
                        console.log('⏰ 2 seconds of silence detected, automatically stopping recording...');
                        // Call the same function as the "Stop Listening" button
                        stopListening();
                        silenceCountRef.current = 0;
                    }
                } else {
                    // Reset silence counter if we're not in a speaking session
                    silenceCountRef.current = 0;
                }
            }

            animationIdRef.current = requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
    };

    const startRecordingSpeech = () => {
        if (isRecordingRef.current) return;
        
        console.log('🎤 startRecordingSpeech called');
        isRecordingRef.current = true;
        currentAudioChunksRef.current = [];
        
        // Use the original audio stream
        const stream = window.currentAudioStream;
        console.log('🎤 Audio stream available:', !!stream);
        if (stream) {
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('🎤 Audio data received:', event.data.size, 'bytes');
                    currentAudioChunksRef.current.push(event.data);
                    
                    // Process all chunks for ultra-low latency
                    if (event.data.size > 500) { // Minimum 500 bytes for speed
                        // Process audio chunk immediately for real-time translation
                        const audioBlob = new Blob([event.data], { type: 'audio/webm' });
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Audio = reader.result?.toString().split(',')[1];
                            if (base64Audio && socketRef.current && sessionIdRef.current) {
                                console.log('⚡ Sending real-time audio chunk...');
                                socketRef.current.emit('streaming_audio_chunk', {
                                    audioData: base64Audio,
                                    sessionId: sessionIdRef.current,
                                    isFinal: false // Real-time processing
                                });
                            }
                        };
                        reader.readAsDataURL(audioBlob);
                    } else {
                        console.log('🎤 Chunk too small, skipping:', event.data.size, 'bytes');
                    }
                }
            };

            mediaRecorder.start(200); // 200ms chunks for ultra-low latency
            console.log('🎤 MediaRecorder started');
        } else {
            console.error('🎤 No audio stream available!');
        }
    };

    const stopRecordingSpeech = () => {
        if (!isRecordingRef.current) return;
        
        console.log('🔇 stopRecordingSpeech called');
        isRecordingRef.current = false;
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('🔇 Stopping MediaRecorder...');
            mediaRecorderRef.current.stop();
        }
        
        // Process the recorded audio
        if (currentAudioChunksRef.current.length > 0 && socketRef.current && sessionIdRef.current) {
            console.log('🔇 Processing', currentAudioChunksRef.current.length, 'audio chunks');
            const audioBlob = new Blob(currentAudioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                console.log('🔇 Sending final audio to server, size:', base64.length, 'sessionId:', sessionIdRef.current);
                socketRef.current?.emit('streaming_audio_chunk', {
                    audioData: base64,
                    sessionId: sessionIdRef.current,
                    isFinal: true
                });
            };
            reader.readAsDataURL(audioBlob);
        } else {
            console.log('🔇 No audio chunks to process or missing socket/session');
        }
        
        setStatus(`Processing speech...`);
        setIsProcessing(true);
    };

    const stopListening = () => {
        // Stop VAD monitoring
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
        
        // Clear timers
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (deliveryTimerRef.current) {
            clearTimeout(deliveryTimerRef.current);
            deliveryTimerRef.current = null;
        }
        
        // Stop any active recording and process final audio immediately
        if (isRecordingRef.current) {
            stopRecordingSpeech();
            // Process the final audio immediately
            setTimeout(() => {
                processFinalAudio();
            }, 10); // Very short delay
        }
        
        // Close audio context if it's not already closed
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch (error) {
                console.log('AudioContext already closed or closing');
            }
        }
        
        setIsListening(false);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setAudioLevel(0);
        setStatus('Stopped listening');
    };

    const updateAudioLevel = () => {
        if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
            // Calculate average frequency data for visualization
            const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
            setAudioLevel(average / 255); // Normalize to 0-1

            animationIdRef.current = requestAnimationFrame(updateAudioLevel);
        }
    };

    const handleToggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const WaveformVisualizer = () => {
        const height = 60;
        const barWidth = 4;
        const barCount = 20;
        
        return (
            <div className="flex items-center justify-center space-x-1 h-15">
                {Array.from({ length: barCount }, (_, i) => {
                    const barHeight = Math.max(4, audioLevel * height * (0.5 + Math.random() * 0.5));
                    return (
                        <div
                            key={i}
                            className="bg-blue-500 transition-all duration-100"
                            style={{
                                width: barWidth,
                                height: isListening ? barHeight : 4,
                                borderRadius: '2px'
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    backgroundColor: '#ffffff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e5e7eb',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    zIndex: 100000
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                        Real-time Interpreter: {targetLanguage.toUpperCase()} ↔ English
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            color: '#6b7280',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        ×
                    </button>
                </div>

                {/* Current Turn Indicator */}
                <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                        Current Turn: {currentTurn === 'customer' ? `Customer (${targetLanguage})` : 'Staff (English)'}
                    </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {status}
                </div>
                {isSpeaking && (
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '500', marginTop: '4px' }}>
                        🎤 Speaking detected...
                    </div>
                )}
                </div>

                {/* Real-time Translation Display */}
                {(currentPartialText || currentTranslatedText) && (
                    <div style={{ 
                        marginBottom: '16px', 
                        padding: '16px', 
                        backgroundColor: '#f0f9ff', 
                        borderRadius: '8px',
                        border: '1px solid #0ea5e9',
                        position: 'relative'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#0c4a6e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#0ea5e9',
                                borderRadius: '50%',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}></div>
                            Live Translation:
                        </div>
                        <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
                            <strong>Original:</strong> {currentPartialText}
                        </div>
                        <div style={{ fontSize: '14px', color: '#1e293b' }}>
                            <strong>Translated:</strong> {currentTranslatedText}
                        </div>
                        <style>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.5; }
                            }
                        `}</style>
                    </div>
                )}

                {/* Waveform Visualizer */}
                <div style={{ 
                    marginBottom: '16px', 
                    padding: '16px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <WaveformVisualizer />
                </div>

                {/* Recording Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <button
                        onClick={handleToggleListening}
                        disabled={isProcessing}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.5 : 1,
                            backgroundColor: isListening ? '#dc2626' : '#2563eb',
                            color: '#ffffff',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = isListening ? '#b91c1c' : '#1d4ed8';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = isListening ? '#dc2626' : '#2563eb';
                            }
                        }}
                    >
                        {isProcessing ? 'Processing...' : isListening ? 'Stop Listening' : 'Start Real-time Interpreter'}
                    </button>
                </div>

                {/* Conversation History */}
                {conversationHistory.length > 0 && (
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                        <h4 style={{ fontWeight: '500', marginBottom: '12px', color: '#1f2937', fontSize: '16px' }}>Conversation History</h4>
                        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                            {conversationHistory.map((entry, index) => (
                                <div key={index} style={{ 
                                    border: '1px solid #e5e7eb', 
                                    borderRadius: '8px', 
                                    padding: '12px', 
                                    marginBottom: '12px',
                                    backgroundColor: '#ffffff'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: entry.turn === 'customer' ? '#dbeafe' : '#dcfce7',
                                            color: entry.turn === 'customer' ? '#1e40af' : '#166534',
                                            fontWeight: '500'
                                        }}>
                                            {entry.turn === 'customer' ? `Customer (${targetLanguage})` : 'Staff (English)'}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                            {entry.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', marginBottom: '4px', color: '#1f2937' }}>
                                        <strong>Original:</strong> {entry.originalText}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                                        <strong>Translation:</strong> {entry.translatedText}
                                    </div>
                                    {entry.isPartial && (
                                        <div style={{ fontSize: '12px', color: '#f59e0b', fontStyle: 'italic' }}>
                                            Partial result
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamingVoiceTranslationPanel;
