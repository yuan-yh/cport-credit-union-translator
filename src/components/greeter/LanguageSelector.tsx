import React from 'react';

interface LanguageSelectorProps {
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
    onStartTranslation: () => void;
}

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'so', name: 'Somali', flag: '🇸🇴', native: 'Soomaali' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguage,
    onLanguageChange,
    onStartTranslation
}) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Select Customer Language</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        className={`p-3 rounded-md border-2 transition-all ${selectedLanguage === lang.code
                                ? 'border-cport-blue bg-blue-50 text-cport-blue'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="text-2xl mb-1">{lang.flag}</div>
                        <div className="text-sm font-medium">{lang.native}</div>
                        <div className="text-xs text-gray-500">{lang.name}</div>
                    </button>
                ))}
            </div>

            {selectedLanguage !== 'en' && (
                <div className="space-y-3">
                    {/* Real-time Interpreter Info */}
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                        <div className="text-sm font-medium text-blue-800">Real-time Interpreter</div>
                        <div className="text-xs text-blue-600">Detects speech and translates instantly after you stop speaking</div>
                    </div>
                    
                    <button
                        onClick={onStartTranslation}
                        className="w-full bg-cport-green text-white py-3 rounded-md hover:bg-green-600 transition-colors font-medium"
                    >
                        Start Real-time Interpreter
                    </button>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;