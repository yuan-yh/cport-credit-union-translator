// =============================================================================
// STAFF DASHBOARD - Voice Translation Interface
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { Logo } from '../components/brand/Logo';
import { VoiceTranslation } from '../components/voice';
import { Button } from '../components/ui';
import { api } from '../lib/api';
import { SUPPORTED_LANGUAGES, type Session, type LanguageCode } from '../types';
import { LogOut } from 'lucide-react';

export function StaffDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);

  const handleSelectLanguage = async (language: LanguageCode) => {
    setSelectedLanguage(language);
    
    try {
      const response = await api.createSession({
        customerLanguage: language,
      });
      setActiveSession(response.data);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleEndSession = async () => {
    if (activeSession) {
      try {
        await api.completeSession(activeSession.id);
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }
    setActiveSession(null);
    setSelectedLanguage(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show full-screen voice translation when session is active
  if (activeSession && selectedLanguage) {
    return (
      <VoiceTranslation
        sessionId={activeSession.id}
        customerLanguage={selectedLanguage}
        onClose={handleEndSession}
      />
    );
  }

  // Language selection screen
  const languages = Object.values(SUPPORTED_LANGUAGES).filter(l => l.code !== 'en');

  return (
    <div className="min-h-screen bg-[#f5f7fa] overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 174, 239, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, rgba(0, 144, 201, 0.05) 0%, transparent 50%), linear-gradient(180deg, #f5f7fa 0%, #e8eef5 100%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Translation Tool</h1>
            <p className="text-xs text-gray-500">cPort Credit Union</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">Staff</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Select Customer Language
          </h2>
          <p className="text-gray-500">
            Choose the language your customer speaks
          </p>
        </motion.div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg w-full">
          {languages.map((language, index) => (
            <motion.button
              key={language.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectLanguage(language.code)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative aspect-square rounded-3xl p-6 flex flex-col items-center justify-center transition-all bg-white shadow-lg shadow-gray-200/50"
              style={{
                border: `2px solid ${language.color}40`,
              }}
            >
              {/* Glow effect on hover */}
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity -z-10"
                style={{ background: language.color }}
              />

              <span className="text-5xl mb-3">{language.flag}</span>
              <span
                className="text-lg font-medium text-gray-800"
                style={{ direction: language.rtl ? 'rtl' : 'ltr' }}
              >
                {language.nativeName}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {language.name}
              </span>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default StaffDashboard;
