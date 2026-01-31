import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Language options matching the standard UI
const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'so', name: 'Somali', flag: '🇸🇴', native: 'Soomaali' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' }
];

type UIState = 'idle' | 'language-selection' | 'role-selection' | 'ready' | 'listening' | 'processing';

const RedButtonUI: React.FC = () => {
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://cport-576395442003.us-east1.run.app';
    
    const [uiState, setUIState] = useState<UIState>('idle');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<'staff' | 'customer' | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('Click to start');
    const [currentText, setCurrentText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const sessionIdRef = useRef<string>('');
    const currentAudioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Note: source and target languages are computed dynamically in processAudio and handleButtonClick
    // based on selectedRole to ensure correct language for each translation round

    // Initialize WebSocket connection
    useEffect(() => {
        const socket = io(API_BASE.replace('/api', ''), {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            timeout: 20000
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
            setCurrentText(data.originalText);
            setTranslatedText(data.translatedText);
            setStatus('Listening...');
        });

        socket.on('streaming_audio_result', (data) => {
            setCurrentText(data.originalText);
            setTranslatedText(data.translatedText);
            setIsListening(false);
            setIsProcessing(true);
            // Play audio and let audio.onended handle showing role selection
            playAudioFromBase64(data.audioBuffer);
        });

        socket.on('streaming_error', (data) => {
            console.error('Streaming error:', data.error);
            setStatus('Error occurred. Select who is speaking next');
            setIsProcessing(false);
            setIsListening(false);
            setSelectedRole(null);
            setUIState('role-selection');
        });

        return () => {
            socket.disconnect();
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
            
            if (audioRef.current) {
                audioRef.current.pause();
            }
            
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.volume = 0.9;
            
            setIsProcessing(true);
            setStatus('Playing translation...');
            
            audio.play().catch(err => {
                console.error('Audio playback failed:', err);
                setStatus('Audio playback failed');
                setIsProcessing(false);
            });
            
            audio.onended = () => {
                console.log('Audio playback ended, showing role selection');
                setIsProcessing(false);
                // Reset role selection for next round - this changes what we listen to/translate to
                // When role changes, source/target languages change:
                // Staff: listens to English, translates to target language
                // Customer: listens to target language, translates to English
                setSelectedRole(null);
                // Clear previous text
                setCurrentText('');
                setTranslatedText('');
                // Show role selection panel - this is critical for next round
                setUIState('role-selection');
                setStatus('Select who is speaking next');
            };
            
            // Fallback: if audio fails to play, still show role selection
            audio.onerror = () => {
                console.log('Audio playback error, showing role selection anyway');
                setIsProcessing(false);
                setSelectedRole(null);
                setCurrentText('');
                setTranslatedText('');
                setUIState('role-selection');
                setStatus('Select who is speaking next');
            };
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsProcessing(false);
        }
    };

    const startListening = async () => {
        try {
            setStatus('Starting...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            currentAudioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    currentAudioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                processAudio();
            };

            mediaRecorder.start();
            setIsListening(true);
            setStatus('Listening...');
            setUIState('listening');
        } catch (error) {
            console.error('Error starting recording:', error);
            setStatus('Microphone access denied');
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            setStatus('Processing...');
            setUIState('processing');
        }
    };

    const processAudio = () => {
        if (currentAudioChunksRef.current.length > 0 && socketRef.current && sessionIdRef.current && selectedRole && selectedLanguage) {
            // Compute languages based on current role - this determines what we listen to and translate to
            const srcLang = selectedRole === 'staff' ? 'en' : selectedLanguage;
            const tgtLang = selectedRole === 'staff' ? selectedLanguage : 'en';
            
            const audioBlob = new Blob(currentAudioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                socketRef.current?.emit('streaming_audio_chunk', {
                    audioData: base64,
                    sessionId: sessionIdRef.current,
                    isFinal: true,
                    sourceLanguage: srcLang,
                    targetLanguage: tgtLang
                });
            };
            reader.readAsDataURL(audioBlob);
        }
    };

    const handleButtonClick = () => {
        if (uiState === 'idle') {
            setUIState('language-selection');
            setStatus('Select language');
        } else if (uiState === 'role-selection') {
            // Role selection is handled by handleRoleSelect, but button can be used to proceed if role already selected
            if (selectedRole) {
                setUIState('ready');
                setStatus('Click Start to begin listening');
            }
        } else if (uiState === 'processing') {
            // Already processing, do nothing
            return;
        } else if (uiState === 'ready') {
            // Start streaming session before listening
            if (selectedRole && selectedLanguage) {
                const srcLang = selectedRole === 'staff' ? 'en' : selectedLanguage;
                const tgtLang = selectedRole === 'staff' ? selectedLanguage : 'en';
                const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sessionIdRef.current = newSessionId;
                
                socketRef.current?.emit('start_streaming_translation', {
                    sourceLanguage: srcLang,
                    targetLanguage: tgtLang,
                    sessionId: newSessionId
                });
            }
            startListening();
        } else if (uiState === 'listening') {
            stopListening();
        }
    };

    const handleLanguageSelect = (langCode: string) => {
        setSelectedLanguage(langCode);
        // Automatically proceed to role selection after language is selected
        setTimeout(() => {
            setUIState('role-selection');
            setStatus('Select your role');
        }, 100);
    };

    const handleRoleSelect = (role: 'staff' | 'customer') => {
        setSelectedRole(role);
        // Close role selection and go to ready state
        setTimeout(() => {
            setUIState('ready');
            setStatus('Click Start to begin listening');
        }, 100);
    };

    const reset = () => {
        setUIState('idle');
        setSelectedLanguage('');
        setSelectedRole(null);
        setIsListening(false);
        setIsProcessing(false);
        setStatus('Click to start');
        setCurrentText('');
        setTranslatedText('');
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    };

    const getButtonText = () => {
        switch (uiState) {
            case 'idle':
                return 'Start';
            case 'language-selection':
                return 'Select Language';
            case 'role-selection':
                return selectedRole ? 'Continue' : 'Select Role';
            case 'ready':
                return 'Start';
            case 'listening':
                return 'Stop & Translate';
            case 'processing':
                return 'Processing...';
            default:
                return 'Click';
        }
    };

    const getButtonColor = () => {
        if (isProcessing) return '#10b981'; // Green when processing
        if (isListening) return '#dc2626'; // Red when listening
        return '#dc2626'; // Red by default
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative'
        }}>
            {/* Language Selection Modal */}
            {uiState === 'language-selection' && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#1a1a1a',
                    padding: '32px',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
                    border: '2px solid #333333',
                    zIndex: 100,
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}>
                    <h2 style={{
                        color: '#ffffff',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontSize: '24px'
                    }}>
                        Select Language to Translate
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        {languages.filter(lang => lang.code !== 'en').map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageSelect(lang.code)}
                                style={{
                                    padding: '20px 12px',
                                    borderRadius: '8px',
                                    border: selectedLanguage === lang.code
                                        ? '2px solid #dc2626'
                                        : '1px solid #333333',
                                    backgroundColor: selectedLanguage === lang.code
                                        ? '#5f1e1e'
                                        : '#2a2a2a',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{lang.flag}</div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>{lang.native}</div>
                                <div style={{ fontSize: '12px', color: '#999999', marginTop: '4px' }}>{lang.name}</div>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={reset}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#333333',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Role Selection Modal */}
            {uiState === 'role-selection' && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#1a1a1a',
                    padding: '32px',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
                    border: '2px solid #333333',
                    zIndex: 100,
                    maxWidth: '400px',
                    width: '90%'
                }}>
                    <h2 style={{
                        color: '#ffffff',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontSize: '24px'
                    }}>
                        {selectedLanguage ? 'Who is speaking next?' : 'Who are you?'}
                    </h2>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <button
                            onClick={() => handleRoleSelect('staff')}
                            style={{
                                padding: '24px',
                                borderRadius: '8px',
                                border: selectedRole === 'staff'
                                    ? '2px solid #dc2626'
                                    : '1px solid #333333',
                                backgroundColor: selectedRole === 'staff'
                                    ? '#5f1e1e'
                                    : '#2a2a2a',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '500'
                            }}
                        >
                             Staff (English → {languages.find(l => l.code === selectedLanguage)?.native})
                        </button>
                        <button
                            onClick={() => handleRoleSelect('customer')}
                            style={{
                                padding: '24px',
                                borderRadius: '8px',
                                border: selectedRole === 'customer'
                                    ? '2px solid #dc2626'
                                    : '1px solid #333333',
                                backgroundColor: selectedRole === 'customer'
                                    ? '#5f1e1e'
                                    : '#2a2a2a',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '500'
                            }}
                        >
                             Customer ({languages.find(l => l.code === selectedLanguage)?.native} → English)
                        </button>
                    </div>
                    <button
                        onClick={() => setUIState('language-selection')}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#333333',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginBottom: '12px'
                        }}
                    >
                        Back
                    </button>
                    <button
                        onClick={reset}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#333333',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Status and Translation Display */}
            {(currentText || translatedText) && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333333',
                    maxWidth: '600px',
                    width: '90%',
                    zIndex: 10
                }}>
                    {currentText && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#999999', fontSize: '12px', marginBottom: '4px' }}>
                                {selectedRole === 'staff' ? 'You said (English)' : `You said (${languages.find(l => l.code === selectedLanguage)?.native})`}
                            </div>
                            <div style={{ color: '#ffffff', fontSize: '16px' }}>{currentText}</div>
                        </div>
                    )}
                    {translatedText && (
                        <div>
                            <div style={{ color: '#999999', fontSize: '12px', marginBottom: '4px' }}>
                                Translation ({selectedRole === 'staff' ? languages.find(l => l.code === selectedLanguage)?.native : 'English'})
                            </div>
                            <div style={{ color: '#3b82f6', fontSize: '18px', fontWeight: '500' }}>{translatedText}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Red Button */}
            <button
                onClick={handleButtonClick}
                disabled={isProcessing || uiState === 'language-selection' || (uiState === 'role-selection' && !selectedRole)}
                style={{
                    width: uiState === 'listening' ? '400px' : '500px',
                    height: uiState === 'listening' ? '400px' : '500px',
                    borderRadius: '50%',
                    backgroundColor: getButtonColor(),
                    border: 'none',
                    cursor: (isProcessing || (uiState === 'language-selection' && !selectedLanguage) || (uiState === 'role-selection' && !selectedRole)) ? 'not-allowed' : 'pointer',
                    boxShadow: isProcessing
                        ? `0 0 80px rgba(16, 185, 129, 0.8), 0 0 160px rgba(16, 185, 129, 0.4)`
                        : isListening
                        ? `0 0 80px rgba(220, 38, 38, 0.8), 0 0 160px rgba(220, 38, 38, 0.4)`
                        : `0 0 40px rgba(220, 38, 38, 0.5)`,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 5,
                    opacity: isProcessing ? 0.8 : 1
                }}
            >
                <div style={{
                    color: '#ffffff',
                    fontSize: isProcessing ? '36px' : isListening ? '48px' : '64px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                    textAlign: 'center',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                }}>
                    {getButtonText()}
                </div>
            </button>

            {/* Status Text */}
            <div style={{
                marginTop: '40px',
                color: '#999999',
                fontSize: '18px',
                textAlign: 'center'
            }}>
                {status}
            </div>

            {/* Reset Button */}
            {uiState !== 'idle' && (
                <button
                    onClick={reset}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        padding: '12px 24px',
                        backgroundColor: '#333333',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        zIndex: 10
                    }}
                >
                    Reset
                </button>
            )}
        </div>
    );
};

export default RedButtonUI;

