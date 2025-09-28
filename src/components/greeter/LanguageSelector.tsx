import React from 'react';

interface LanguageSelectorProps {
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
    onStartTranslation: () => void;
}

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
    { code: 'so', name: 'Somali', flag: '🇸🇴', native: 'Soomaali' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguage,
    onLanguageChange,
    onStartTranslation
}) => {
    return (
        <div className="language-grid">
            {languages.map((lang) => (
                <div
                    key={lang.code}
                    className={`language-option ${selectedLanguage === lang.code ? 'active' : ''}`}
                    onClick={() => onLanguageChange(lang.code)}
                >
                    <div className="language-flag">{lang.flag}</div>
                    <div className="language-name">{lang.name}</div>
                    <div className="language-native">{lang.native}</div>
                </div>
            ))}
        </div>
    );
};

export default LanguageSelector;