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
        <div style={{
            backgroundColor: '#1a1a1a',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
            border: '1px solid #333333'
        }}>
            <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#ffffff'
            }}>
                Select Customer Language
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px'
            }}>
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        style={{
                            padding: '16px 12px',
                            borderRadius: '8px',
                            border: selectedLanguage === lang.code
                                ? '2px solid #3b82f6'
                                : '1px solid #333333',
                            backgroundColor: selectedLanguage === lang.code
                                ? '#001f3f'
                                : '#0a0a0a',
                            color: selectedLanguage === lang.code
                                ? '#3b82f6'
                                : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                            if (selectedLanguage !== lang.code) {
                                e.currentTarget.style.borderColor = '#666666';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (selectedLanguage !== lang.code) {
                                e.currentTarget.style.borderColor = '#333333';
                            }
                        }}
                    >
                        <div style={{ fontSize: '32px', marginBottom: '4px' }}>{lang.flag}</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
                            {lang.native}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999999' }}>{lang.name}</div>
                    </button>
                ))}
            </div>

            {selectedLanguage !== 'en' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#3b82f6',
                            marginBottom: '4px'
                        }}>
                            Real-time Interpreter
                        </div>
                        <div style={{ fontSize: '12px', color: '#66b3ff' }}>
                            Detects speech and translates instantly after you stop speaking
                        </div>
                    </div>

                    <button
                        onClick={onStartTranslation}
                        style={{
                            width: '100%',
                            backgroundColor: '#059669',
                            color: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                    >
                        Start Real-time Interpreter
                    </button>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;