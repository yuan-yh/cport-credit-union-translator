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
    const [currentPartialText, setCurrentPartialText] = useState('');
    const [currentTranslatedText, setCurrentTranslatedText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSpeakingRef = useRef(false);
    
    const deliveryTimerRef = useRef<number | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioPreloadRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const sessionIdRef = useRef<string>('');
    const lastFinalBlobRef = useRef<Blob | null>(null);
    
    const baseThreshold = 0.03;
    const [vadThreshold, setVadThreshold] = useState(0.03);
    const silenceTimerRef = useRef<number | null>(null);
    const isRecordingRef = useRef<boolean>(false);
    const currentAudioChunksRef = useRef<Blob[]>([]);
    const silenceCountRef = useRef<number>(0);
    const requiredSilenceFrames = 100;
    
    const voiceLevelsRef = useRef<number[]>([]);

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
            
            const newEntry: StreamingTranslationEntry = {
                originalText: currentPartialText,
                translatedText: data.translatedText,
                turn: currentTurn,
                timestamp: new Date(),
                isPartial: false
            };
            setConversationHistory(prev => [...prev, newEntry]);

            try {
                if (onCustomerDataUpdate) {
                    finalizeTurnPopulate(currentPartialText, data.translatedText);
                }
            } catch (e) {
                console.log('Background finalize failed:', e);
            }
            
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

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        return () => {
            if (isListening) {
                stopListening();
            }
        };
    }, [isListening]);

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

    const postJson = async (url: string, body: any) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
    };

    const finalizeTurnPopulate = async (latestOriginalText: string, latestTranslatedText: string) => {
        try {
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
                } 
            });
            console.log('🎤 Got audio stream:', stream);
            
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new AudioContext({
                    sampleRate: 48000,
                    latencyHint: 'interactive'
                });
            }
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            
            analyserRef.current.fftSize = 128;
            analyserRef.current.smoothingTimeConstant = 0.3;
            analyserRef.current.minDecibels = -90;
            analyserRef.current.maxDecibels = -10;
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            window.currentAudioStream = stream;
            console.log('🎤 Stored audio stream for recording');

            setVadThreshold(baseThreshold);
            setStatus('Ready - speak now');

            startVADMonitoring();

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
            
            const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
            const normalizedLevel = average / 255;
            
            setAudioLevel(normalizedLevel);
            
            frameCount++;
            if (frameCount % 30 === 0) {
                const status = normalizedLevel > vadThreshold ? 'SPEECH' : 'SILENCE';
                console.log(`🎤 Audio level: ${normalizedLevel.toFixed(4)} (${status}) - threshold: ${vadThreshold} - isSpeaking: ${isSpeakingRef.current} - silenceCount: ${silenceCountRef.current}`);
            }

            if (normalizedLevel > vadThreshold) {
                console.log('⚡ Speech detected! Starting immediate processing...', normalizedLevel.toFixed(4));
                if (!isRecordingRef.current) {
                    console.log('⚡ Starting ultra-fast recording...');
                    startRecordingSpeech();
                }
                isSpeakingRef.current = true;
                setIsSpeaking(true);
                setStatus(`⚡ Processing in real-time...`);
                
                voiceLevelsRef.current.push(normalizedLevel);
                if (voiceLevelsRef.current.length > 20) {
                    voiceLevelsRef.current.shift();
                }
                
                silenceCountRef.current = 0;
                
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            } else {
                if (isSpeakingRef.current) {
                    silenceCountRef.current++;
                    const silenceProgress = Math.min(silenceCountRef.current / requiredSilenceFrames * 100, 100);
                    console.log(`🔇 Silence frame ${silenceCountRef.current}/${requiredSilenceFrames} (${silenceProgress.toFixed(1)}%) - level: ${normalizedLevel.toFixed(4)}`);
                    
                    setStatus(`Listening... (${Math.max(0, 2 - (silenceCountRef.current / 50)).toFixed(1)}s silence remaining)`);
                    
                    if (silenceCountRef.current >= requiredSilenceFrames) {
                        console.log('⏰ 2 seconds of silence detected, automatically stopping recording...');
                        stopListening();
                        silenceCountRef.current = 0;
                    }
                } else {
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
                    
                    if (event.data.size > 500) {
                        const audioBlob = new Blob([event.data], { type: 'audio/webm' });
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Audio = reader.result?.toString().split(',')[1];
                            if (base64Audio && socketRef.current && sessionIdRef.current) {
                                console.log('⚡ Sending real-time audio chunk...');
                                socketRef.current.emit('streaming_audio_chunk', {
                                    audioData: base64Audio,
                                    sessionId: sessionIdRef.current,
                                    isFinal: false
                                });
                            }
                        };
                        reader.readAsDataURL(audioBlob);
                    } else {
                        console.log('🎤 Chunk too small, skipping:', event.data.size, 'bytes');
                    }
                }
            };

            mediaRecorder.start(200);
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
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
        
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (deliveryTimerRef.current) {
            clearTimeout(deliveryTimerRef.current);
            deliveryTimerRef.current = null;
        }
        
        if (isRecordingRef.current) {
            stopRecordingSpeech();
            setTimeout(() => {
                processFinalAudio();
            }, 10);
        }
        
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px' }}>
                {Array.from({ length: barCount }, (_, i) => {
                    const barHeight = Math.max(4, audioLevel * height * (0.5 + Math.random() * 0.5));
                    return (
                        <div
                            key={i}
                            style={{
                                width: barWidth,
                                height: isListening ? barHeight : 4,
                                backgroundColor: '#3b82f6',
                                borderRadius: '2px',
                                transition: 'all 0.1s'
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
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '20px',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    backgroundColor: '#1a1a1a',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
                    border: '1px solid #333333',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    zIndex: 100000
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                        Real-time Interpreter: {targetLanguage.toUpperCase()} ↔ English
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            color: '#999999',
                            fontSize: '24px',
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
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        ×
                    </button>
                </div>

                {/* Current Turn Indicator */}
                <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    backgroundColor: '#0a0a0a', 
                    borderRadius: '8px',
                    border: '1px solid #333333'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', marginBottom: '4px' }}>
                        Current Turn: {currentTurn === 'customer' ? `Customer (${targetLanguage})` : 'Staff (English)'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999999' }}>
                        {status}
                    </div>
                    {isSpeaking && (
                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '500', marginTop: '4px' }}>
                            🎤 Speaking detected...
                        </div>
                    )}
                </div>

                {/* Real-time Translation Display */}
                {(currentPartialText || currentTranslatedText) && (
                    <div style={{ 
                        marginBottom: '16px', 
                        padding: '16px', 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        position: 'relative'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#3b82f6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}></div>
                            Live Translation:
                        </div>
                        <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>
                            <strong>Original:</strong> {currentPartialText}
                        </div>
                        <div style={{ fontSize: '14px', color: '#ffffff' }}>
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
                    backgroundColor: '#0a0a0a', 
                    borderRadius: '8px',
                    border: '1px solid #333333'
                }}>
                    <WaveformVisualizer />
                </div>

                {/* Recording Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <button
                        onClick={handleToggleListening}
                        disabled={isProcessing}
                        style={{
                            padding: '15px 30px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            fontSize: '16px',
                            border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.5 : 1,
                            backgroundColor: isListening ? '#dc2626' : '#1e40af',
                            color: '#ffffff',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = isListening ? '#b91c1c' : '#3b82f6';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = isListening ? '#dc2626' : '#1e40af';
                            }
                        }}
                    >
                        {isProcessing ? 'Processing...' : isListening ? 'Stop Listening' : 'Start Real-time Interpreter'}
                    </button>
                </div>

                {/* Conversation History */}
                {conversationHistory.length > 0 && (
                    <div style={{ borderTop: '1px solid #333333', paddingTop: '16px' }}>
                        <h4 style={{ fontWeight: '500', marginBottom: '12px', color: '#ffffff', fontSize: '16px' }}>
                            Conversation History
                        </h4>
                        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                            {conversationHistory.map((entry, index) => (
                                <div key={index} style={{ 
                                    border: '1px solid #333333', 
                                    borderRadius: '8px', 
                                    padding: '12px', 
                                    marginBottom: '12px',
                                    backgroundColor: entry.turn === 'customer' ? '#004d00' : '#001f3f',
                                    borderLeft: entry.turn === 'customer' ? '4px solid #00cc00' : '4px solid #0066cc'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: entry.turn === 'customer' ? '#00cc00' : '#0066cc',
                                            color: '#ffffff',
                                            fontWeight: '500'
                                        }}>
                                            {entry.turn === 'customer' ? `Customer (${targetLanguage})` : 'Staff (English)'}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#999999' }}>
                                            {entry.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', marginBottom: '4px', color: '#ffffff' }}>
                                        <strong>Original:</strong> {entry.originalText}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#cccccc', marginBottom: '8px' }}>
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