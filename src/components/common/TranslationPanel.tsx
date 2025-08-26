import React, { useState, useEffect } from 'react';

interface TranslationPanelProps {
    sourceLanguage: string;
    targetLanguage: string;
    onClose: () => void;
}

interface ConversationEntry {
    id: string;
    speaker: 'employee' | 'customer';
    originalText: string;
    translatedText: string;
    timestamp: Date;
    confidence: number;
    isAudio: boolean;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({
    sourceLanguage,
    targetLanguage,
    onClose
}) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [activeRole, setActiveRole] = useState<'employee' | 'customer'>('employee');
    const [isRecording, setIsRecording] = useState(false);
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [currentInput, setCurrentInput] = useState('');

    // Mock translation function - replace with real API call
    const mockTranslate = (text: string, targetLang: string): string => {
        const mockTranslations: Record<string, Record<string, string>> = {
            pt: {
                'Hello, how can I help you today?': 'Olá, como posso ajudá-lo hoje?',
                'I need to make a deposit': 'Preciso fazer um depósito',
                'What is your account number?': 'Qual é o seu número de conta?',
                'Thank you for your help': 'Obrigado pela sua ajuda',
                'Please sign here': 'Por favor, assine aqui'
            },
            fr: {
                'Hello, how can I help you today?': 'Bonjour, comment puis-je vous aider aujourd\'hui?',
                'I need to make a deposit': 'J\'ai besoin de faire un dépôt',
                'What is your account number?': 'Quel est votre numéro de compte?',
                'Thank you for your help': 'Merci pour votre aide',
                'Please sign here': 'Veuillez signer ici'
            },
            es: {
                'Hello, how can I help you today?': 'Hola, ¿cómo puedo ayudarle hoy?',
                'I need to make a deposit': 'Necesito hacer un depósito',
                'What is your account number?': '¿Cuál es su número de cuenta?',
                'Thank you for your help': 'Gracias por su ayuda',
                'Please sign here': 'Por favor firme aquí'
            }
        };

        return mockTranslations[targetLang]?.[text] || `[${targetLang.toUpperCase()}] ${text}`;
    };

    const handleStartRecording = () => {
        setIsRecording(true);
        // Mock audio recording - in real implementation, use Web Speech API
        setTimeout(() => {
            const mockPhrases = {
                employee: [
                    'Hello, how can I help you today?',
                    'What is your account number?',
                    'Please sign here',
                    'Thank you for your help'
                ],
                customer: [
                    'I need to make a deposit',
                    'My account number is 1234567890',
                    'Thank you for your help',
                    'How much is the fee?'
                ]
            };

            const phrases = mockPhrases[activeRole];
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

            handleTranslation(randomPhrase, true);
            setIsRecording(false);
        }, 2000);
    };

    const handleTranslation = (text: string, isAudio: boolean = false) => {
        if (!text.trim()) return;

        const sourceLang = activeRole === 'employee' ? sourceLanguage : targetLanguage;
        const destLang = activeRole === 'employee' ? targetLanguage : sourceLanguage;
        const translatedText = mockTranslate(text, destLang);

        const newEntry: ConversationEntry = {
            id: `entry_${Date.now()}`,
            speaker: activeRole,
            originalText: text,
            translatedText: translatedText,
            timestamp: new Date(),
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            isAudio: isAudio
        };

        setConversation(prev => [newEntry, ...prev]);
        setCurrentInput('');
    };

    const handleTextInput = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentInput.trim()) {
            handleTranslation(currentInput);
        }
    };

    const getLanguageName = (code: string): string => {
        const languages: Record<string, string> = {
            'en': 'English',
            'pt': 'Português',
            'fr': 'Français',
            'so': 'Soomaali',
            'ar': 'العربية',
            'es': 'Español'
        };
        return languages[code] || code.toUpperCase();
    };

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div
            className="fixed inset-0 bg-white flex flex-col"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                backgroundColor: 'white'
            }}
        >
            {/* Header with Controls */}
            <div className="bg-cport-blue text-white p-4 flex justify-between items-center shadow-lg shrink-0">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold">Real-Time Translation</h2>
                    <div className="hidden sm:flex items-center space-x-2 text-sm">
                        <span className="opacity-75">Employee:</span>
                        <span>{getLanguageName(sourceLanguage)}</span>
                        <span className="text-lg">↔</span>
                        <span className="opacity-75">Customer:</span>
                        <span>{getLanguageName(targetLanguage)}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Role Selector */}
                    <div className="flex bg-white/20 rounded-lg p-1">
                        <button
                            onClick={() => setActiveRole('employee')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeRole === 'employee'
                                    ? 'bg-white text-cport-blue'
                                    : 'text-white hover:bg-white/30'
                                }`}
                        >
                            Employee
                        </button>
                        <button
                            onClick={() => setActiveRole('customer')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeRole === 'customer'
                                    ? 'bg-white text-cport-blue'
                                    : 'text-white hover:bg-white/30'
                                }`}
                        >
                            Customer
                        </button>
                    </div>

                    {/* Call Control */}
                    <button
                        onClick={() => {
                            setIsCallActive(!isCallActive);
                            if (isCallActive) {
                                setConversation([]);
                            }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${isCallActive
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                    >
                        {isCallActive ? 'End Session' : 'Start Session'}
                    </button>

                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 text-2xl px-2"
                    >
                        ×
                    </button>
                </div>
            </div>

            {!isCallActive ? (
                /* Welcome Screen */
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-lg px-6">
                        <div className="text-6xl mb-6">🗣️</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Translation</h3>
                        <p className="text-gray-600 mb-6">
                            Click "Start Session" to begin real-time audio translation between
                            {getLanguageName(sourceLanguage)} and {getLanguageName(targetLanguage)}
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Privacy:</strong> This full-screen mode ensures customers only see
                                translation content, protecting sensitive banking information.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Active Translation Interface */
                <div className="flex-1 flex flex-col sm:flex-row min-h-0">
                    {/* Employee Column */}
                    <div className="flex-1 bg-blue-50 border-r border-blue-200 flex flex-col min-h-0">
                        <div className="bg-blue-100 p-3 border-b border-blue-200 shrink-0">
                            <h3 className="text-lg font-semibold text-blue-800">
                                Employee ({getLanguageName(sourceLanguage)})
                            </h3>
                            <p className="text-sm text-blue-600">Translations appear in {getLanguageName(targetLanguage)}</p>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto min-h-0">
                            <div className="space-y-3">
                                {conversation
                                    .filter(entry => entry.speaker === 'employee')
                                    .map((entry) => (
                                        <div key={entry.id} className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-500">
                                                    {entry.timestamp.toLocaleTimeString()}
                                                    {entry.isAudio && ' 🎤'}
                                                </span>
                                                <span className={`text-xs font-medium ${entry.confidence > 0.9 ? 'text-green-600' :
                                                        entry.confidence > 0.7 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {Math.round(entry.confidence * 100)}%
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-blue-800 font-medium">{entry.originalText}</p>
                                                <p className="text-gray-700 italic">{entry.translatedText}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {activeRole === 'employee' && (
                            <div className="p-3 bg-white border-t border-blue-200 shrink-0">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyPress={handleTextInput}
                                        placeholder="Type to translate or use voice..."
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        disabled={isRecording}
                                    />
                                    <button
                                        onClick={handleStartRecording}
                                        disabled={isRecording}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${isRecording
                                                ? 'bg-red-500 text-white recording'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                    >
                                        {isRecording ? '🔴 Recording...' : '🎤 Speak'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Customer Column */}
                    <div className="flex-1 bg-green-50 flex flex-col min-h-0">
                        <div className="bg-green-100 p-3 border-b border-green-200 shrink-0">
                            <h3 className="text-lg font-semibold text-green-800">
                                Customer ({getLanguageName(targetLanguage)})
                            </h3>
                            <p className="text-sm text-green-600">Translations appear in {getLanguageName(sourceLanguage)}</p>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto min-h-0">
                            <div className="space-y-3">
                                {conversation
                                    .filter(entry => entry.speaker === 'customer')
                                    .map((entry) => (
                                        <div key={entry.id} className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-500">
                                                    {entry.timestamp.toLocaleTimeString()}
                                                    {entry.isAudio && ' 🎤'}
                                                </span>
                                                <span className={`text-xs font-medium ${entry.confidence > 0.9 ? 'text-green-600' :
                                                        entry.confidence > 0.7 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {Math.round(entry.confidence * 100)}%
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-green-800 font-medium">{entry.originalText}</p>
                                                <p className="text-gray-700 italic">{entry.translatedText}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {activeRole === 'customer' && (
                            <div className="p-3 bg-white border-t border-green-200 shrink-0">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyPress={handleTextInput}
                                        placeholder="Type to translate or use voice..."
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                        disabled={isRecording}
                                    />
                                    <button
                                        onClick={handleStartRecording}
                                        disabled={isRecording}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${isRecording
                                                ? 'bg-red-500 text-white recording'
                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                            }`}
                                    >
                                        {isRecording ? '🔴 Recording...' : '🎤 Speak'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Status Bar */}
            <div className="bg-gray-800 text-white p-2 flex justify-between items-center text-sm shrink-0">
                <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${isCallActive ? 'text-green-400' : 'text-gray-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                        <span>{isCallActive ? 'Session Active' : 'Session Inactive'}</span>
                    </div>

                    <div className="text-gray-300">
                        Conversations: {conversation.length}
                    </div>

                    {isRecording && (
                        <div className="text-red-400 recording">
                            🔴 Recording as {activeRole}...
                        </div>
                    )}
                </div>

                <div className="text-gray-400 hidden sm:block">
                    cPort Credit Union - Translation System
                </div>
            </div>
        </div>
    );
};

export default TranslationPanel;