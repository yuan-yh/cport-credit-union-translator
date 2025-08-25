import React, { useState } from 'react';

interface TranslationPanelProps {
    sourceLanguage: string;
    targetLanguage: string;
    onClose: () => void;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({
    sourceLanguage,
    targetLanguage,
    onClose
}) => {
    const [inputText, setInputText] = useState('');
    const [translations, setTranslations] = useState<Array<{
        original: string;
        translated: string;
        confidence: number;
        timestamp: Date;
    }>>([]);
    const [isRecording, setIsRecording] = useState(false);

    // Mock translation function for prototype
    const mockTranslate = (text: string) => {
        const mockTranslations: Record<string, string> = {
            'Hello': 'Olá',
            'How can I help you?': 'Como posso ajudá-lo?',
            'What type of service do you need?': 'Que tipo de serviço você precisa?',
            'Thank you': 'Obrigado',
            'Please wait': 'Por favor, aguarde'
        };

        return mockTranslations[text] || `[Translated: ${text}]`;
    };

    const handleTranslate = () => {
        if (!inputText.trim()) return;

        const translated = mockTranslate(inputText);
        const newTranslation = {
            original: inputText,
            translated: translated,
            confidence: Math.random() * 0.3 + 0.7, // Random confidence between 70-100%
            timestamp: new Date()
        };

        setTranslations(prev => [newTranslation, ...prev]);
        setInputText('');
    };

    const handleVoiceInput = () => {
        setIsRecording(!isRecording);
        // Mock voice input - in real implementation, would use Web Speech API
        if (!isRecording) {
            setTimeout(() => {
                setInputText('Hello, I need help with my account');
                setIsRecording(false);
            }, 2000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-cport-blue">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Real-time Translation</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                >
                    ×
                </button>
            </div>

            <div className="flex items-center justify-center mb-4">
                <div className="text-center">
                    <span className="text-sm text-gray-600">
                        {sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type or speak to translate..."
                        className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-cport-blue focus:border-cport-blue"
                        onKeyPress={(e) => e.key === 'Enter' && handleTranslate()}
                    />
                    <button
                        onClick={handleVoiceInput}
                        className={`px-4 py-3 rounded-md transition-colors ${isRecording
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {isRecording ? '🔴' : '🎤'}
                    </button>
                    <button
                        onClick={handleTranslate}
                        className="px-4 py-3 bg-cport-blue text-white rounded-md hover:bg-cport-light transition-colors"
                    >
                        Translate
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                    {translations.map((translation, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm text-gray-500">
                                    {translation.timestamp.toLocaleTimeString()}
                                </span>
                                <span className={`text-sm font-medium ${translation.confidence > 0.9 ? 'text-green-600' :
                                        translation.confidence > 0.7 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {Math.round(translation.confidence * 100)}% confident
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-800">{translation.original}</p>
                                <p className="text-cport-blue font-medium">{translation.translated}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TranslationPanel;