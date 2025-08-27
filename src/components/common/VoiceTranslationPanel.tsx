import React, { useState, useRef, useEffect } from 'react';

interface VoiceTranslationPanelProps {
    targetLanguage: string;
    onClose: () => void;
    onCustomerDataUpdate?: (data: { name?: string; phone?: string; notes?: string; mood?: 'calm' | 'anxious' | 'urgent' }) => void;
    currentCustomerData?: { name?: string; phone?: string; notes?: string; mood?: 'calm' | 'anxious' | 'urgent' };
}

interface TranslationEntry {
    originalText: string;
    translatedText: string;
    turn: 'customer' | 'staff';
    timestamp: Date;
    confidence?: number;
    audioUrl?: string;
}

const VoiceTranslationPanel: React.FC<VoiceTranslationPanelProps> = ({
    targetLanguage,
    onClose,
    onCustomerDataUpdate,
    currentCustomerData = {}
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<TranslationEntry[]>([]);
    const [currentTurn, setCurrentTurn] = useState<'customer' | 'staff'>('customer');
    const [audioLevel, setAudioLevel] = useState(0);
    const [status, setStatus] = useState('Ready to record');
    const [extractedInfo, setExtractedInfo] = useState<string>('');
    const [moodInfo, setMoodInfo] = useState<string>('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationIdRef = useRef<number | null>(null);

    // Initialize audio context for waveform visualization
    useEffect(() => {
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Set up audio context for visualization
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            
            analyserRef.current.fftSize = 256;
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            // Start visualization
            updateAudioLevel();

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const audioChunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await processAudio(audioBlob);
                
                // Stop the stream
                stream.getTracks().forEach(track => track.stop());
                
                // Stop visualization
                if (animationIdRef.current) {
                    cancelAnimationFrame(animationIdRef.current);
                    animationIdRef.current = null;
                }
                setAudioLevel(0);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setStatus(`🎤 Recording (${currentTurn === 'customer' ? targetLanguage : 'English'})...`);

        } catch (error) {
            console.error('Error starting recording:', error);
            setStatus('❌ Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
            setStatus('🔄 Processing...');
        }
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

    const processAudio = async (audioBlob: Blob) => {
        try {
                            setStatus('Processing (optimized for speed)...');
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            formData.append('sourceLanguage', currentTurn === 'customer' ? targetLanguage : 'en');
            formData.append('targetLanguage', currentTurn === 'customer' ? 'en' : targetLanguage);
            formData.append('conversationHistory', JSON.stringify(conversationHistory));
            formData.append('currentCustomerData', JSON.stringify(currentCustomerData));

            // Use optimized fetch with timeout and priority
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch('/api/translate-with-emotion', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
                priority: 'high' as any // Request high priority processing
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Translation failed');
            }

            const result = await response.json();

            if (result.success) {
                // Decode base64 audio buffer
                const binaryString = atob(result.audioBuffer);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Create audio URL for playback
                const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Play the translated audio with optimization
                const audio = new Audio(audioUrl);
                audio.preload = 'auto'; // Preload for faster playback
                audio.volume = 0.9; // Slightly lower volume for better quality
                
                // Start playing as soon as possible
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            setStatus('Playing translation...');
                        })
                        .catch(err => {
                            console.error('Audio playback failed:', err);
                            setStatus('Audio playback failed');
                        });
                }

                // Add to conversation history
                const newEntry: TranslationEntry = {
                    originalText: result.originalText,
                    translatedText: result.translatedText,
                    turn: currentTurn,
                    timestamp: new Date(),
                    confidence: result.confidence,
                    audioUrl
                };

                setConversationHistory(prev => [...prev, newEntry]);

                // Map Hume emotion to Customer mood and update form (if available)
                if (result.emotionAnalysis && result.emotionAnalysis.primaryEmotion && onCustomerDataUpdate) {
                    const primary = result.emotionAnalysis.primaryEmotion.name?.toLowerCase?.() || '';
                    // Simple mapping: negative/high-arousal → urgent, anxiety/fear → anxious, default → calm
                    const mappedMood = (
                        ['anger', 'frustration', 'stress', 'impatience'].includes(primary) ? 'urgent' :
                        ['anxiety', 'fear', 'sadness', 'nervous'].includes(primary) ? 'anxious' :
                        'calm'
                    ) as 'calm' | 'anxious' | 'urgent';
                    onCustomerDataUpdate({ mood: mappedMood } as any);
                    const moodLabel = mappedMood.charAt(0).toUpperCase() + mappedMood.slice(1);
                    setMoodInfo(`Mood set to: ${moodLabel}`);
                    setTimeout(() => setMoodInfo(''), 4000);
                }

                // Switch turn after successful translation
                setCurrentTurn(prev => prev === 'customer' ? 'staff' : 'customer');
                setStatus(`✅ Translated - Now listening for ${currentTurn === 'customer' ? 'staff (English)' : `customer (${targetLanguage})`}`);

                // Extract customer information if available
                if (result.customerDataExtraction && result.customerDataExtraction.hasUpdates) {
                    console.log('Customer data extracted:', result.customerDataExtraction.updatedCustomerData);
                    const extractedData = result.customerDataExtraction.updatedCustomerData;
                    
                    // Show what was extracted
                    const extractedItems = [];
                    if (extractedData.name && extractedData.name !== currentCustomerData.name) {
                        extractedItems.push(`Name: ${extractedData.name}`);
                    }
                    if (extractedData.phone && extractedData.phone !== currentCustomerData.phone) {
                        extractedItems.push(`Phone: ${extractedData.phone}`);
                    }
                    if (extractedData.notes && extractedData.notes !== currentCustomerData.notes) {
                        extractedItems.push('Notes updated');
                    }
                    
                    if (extractedItems.length > 0) {
                        setExtractedInfo(`Extracted: ${extractedItems.join(', ')}`);
                        setTimeout(() => setExtractedInfo(''), 5000); // Clear after 5 seconds
                    }
                    
                    if (onCustomerDataUpdate) {
                        onCustomerDataUpdate({
                            name: extractedData.name || currentCustomerData.name,
                            phone: extractedData.phone || currentCustomerData.phone,
                            notes: extractedData.notes || currentCustomerData.notes
                        });
                    }
                }
            } else {
                setStatus('Translation failed');
            }

        } catch (error) {
            console.error('Processing error:', error);
            setStatus('Processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
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
                                height: isRecording ? barHeight : 4,
                                borderRadius: '2px'
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    const AudioWaveform: React.FC<{ audioUrl: string }> = ({ audioUrl }) => {
        const [isPlaying, setIsPlaying] = useState(false);
        const [duration, setDuration] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);
        const audioRef = useRef<HTMLAudioElement | null>(null);

        useEffect(() => {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration);
            });

            audio.addEventListener('timeupdate', () => {
                setCurrentTime(audio.currentTime);
            });

            audio.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentTime(0);
            });

            return () => {
                audio.removeEventListener('loadedmetadata', () => {});
                audio.removeEventListener('timeupdate', () => {});
                audio.removeEventListener('ended', () => {});
                audio.pause();
            };
        }, [audioUrl]);

        const togglePlayback = () => {
            if (audioRef.current) {
                if (isPlaying) {
                    audioRef.current.pause();
                } else {
                    audioRef.current.play();
                }
                setIsPlaying(!isPlaying);
            }
        };

        const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
            if (audioRef.current && duration > 0) {
                const rect = event.currentTarget.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                const percentage = clickX / rect.width;
                const newTime = percentage * duration;
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
            }
        };

        const progress = duration > 0 ? currentTime / duration : 0;
        const barCount = 40;

        return (
            <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                marginTop: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={togglePlayback}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    
                    <div 
                        onClick={handleWaveformClick}
                        style={{ 
                            flex: 1, 
                            height: '40px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '2px',
                            cursor: 'pointer',
                            padding: '4px 0'
                        }}
                    >
                        {Array.from({ length: barCount }, (_, i) => {
                            const barProgress = i / barCount;
                            const barHeight = Math.max(4, Math.random() * 32 + 8);
                            const isActive = barProgress <= progress;
                            const isPlayed = barProgress < progress;
                            
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: '2px',
                                        height: `${barHeight}px`,
                                        backgroundColor: isPlayed 
                                            ? '#10b981' 
                                            : isActive 
                                                ? '#3b82f6' 
                                                : '#cbd5e1',
                                        borderRadius: '1px',
                                        transition: 'background-color 0.1s'
                                    }}
                                />
                            );
                        })}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#64748b', minWidth: '45px' }}>
                        {Math.floor(currentTime)}s / {Math.floor(duration)}s
                    </div>
                </div>
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
                        Speech Translation: {targetLanguage.toUpperCase()} ↔ English
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
                {moodInfo && (
                    <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500', marginTop: '4px' }}>
                        {moodInfo}
                    </div>
                )}
                {extractedInfo && (
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '500', marginTop: '4px' }}>
                        {extractedInfo}
                    </div>
                )}
            </div>

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
                    onClick={handleToggleRecording}
                    disabled={isProcessing}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.5 : 1,
                        backgroundColor: isRecording ? '#dc2626' : '#2563eb',
                        color: '#ffffff',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        if (!isProcessing) {
                            e.currentTarget.style.backgroundColor = isRecording ? '#b91c1c' : '#1d4ed8';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isProcessing) {
                            e.currentTarget.style.backgroundColor = isRecording ? '#dc2626' : '#2563eb';
                        }
                    }}
                >
                                               {isProcessing ? 'Processing...' : isRecording ? 'Stop & Translate' : 'Start Recording'}
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
                                {entry.audioUrl && (
                                    <AudioWaveform audioUrl={entry.audioUrl} />
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

export default VoiceTranslationPanel;