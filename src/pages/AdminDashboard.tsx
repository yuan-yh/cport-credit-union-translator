// =============================================================================
// ADMIN DASHBOARD - Analytics, Sessions, and Translation Tool
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Logo } from '../components/brand/Logo';
import { VoiceTranslation } from '../components/voice';
import { Button, Card } from '../components/ui';
import { 
  SUPPORTED_LANGUAGES, 
  type Session, 
  type LanguageCode, 
  type AnalyticsData, 
  type SessionWithTranslations 
} from '../types';
import { 
  LogOut, 
  Mic, 
  BarChart3, 
  FolderOpen, 
  RefreshCw, 
  Users, 
  MessageSquare, 
  Clock, 
  Globe, 
  Cloud, 
  ChevronDown, 
  ChevronRight,
  Play
} from 'lucide-react';

type ViewType = 'translate' | 'analytics' | 'sessions';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const [view, setView] = useState<ViewType>('analytics');
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [sessions, setSessions] = useState<SessionWithTranslations[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    if (view === 'analytics') {
      loadAnalytics();
    } else if (view === 'sessions') {
      loadSessions();
    }
  }, [view]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAnalyticsDashboard();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSessionsWithTranslations();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLanguage = async (language: LanguageCode) => {
    setSelectedLanguage(language);
    try {
      const response = await api.createSession({ customerLanguage: language });
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

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString();
  const getLanguageName = (code: string) => SUPPORTED_LANGUAGES[code as LanguageCode]?.name || code;
  const getLanguageFlag = (code: string) => SUPPORTED_LANGUAGES[code as LanguageCode]?.flag || '🌐';

  // Show voice translation when session is active
  if (activeSession && selectedLanguage) {
    return (
      <VoiceTranslation
        sessionId={activeSession.id}
        customerLanguage={selectedLanguage}
        onClose={handleEndSession}
      />
    );
  }

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
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Translation Tool</h1>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <NavButton 
              active={view === 'analytics'} 
              onClick={() => setView('analytics')}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Analytics"
            />
            <NavButton 
              active={view === 'sessions'} 
              onClick={() => setView('sessions')}
              icon={<FolderOpen className="w-4 h-4" />}
              label="Sessions"
            />
            <NavButton 
              active={view === 'translate'} 
              onClick={() => setView('translate')}
              icon={<Mic className="w-4 h-4" />}
              label="Translate"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs" style={{ color: '#00AEEF' }}>Admin</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'analytics' && (
            <AnalyticsView 
              key="analytics"
              analytics={analytics} 
              isLoading={isLoading} 
              onRefresh={loadAnalytics}
              getLanguageName={getLanguageName}
              getLanguageFlag={getLanguageFlag}
            />
          )}
          
          {view === 'sessions' && (
            <SessionsView 
              key="sessions"
              sessions={sessions} 
              isLoading={isLoading} 
              onRefresh={loadSessions}
              expandedSession={expandedSession}
              setExpandedSession={setExpandedSession}
              formatDate={formatDate}
              formatTime={formatTime}
              getLanguageName={getLanguageName}
              getLanguageFlag={getLanguageFlag}
            />
          )}
          
          {view === 'translate' && (
            <TranslateView 
              key="translate"
              languages={languages}
              onSelectLanguage={handleSelectLanguage}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// =============================================================================
// Navigation Button
// =============================================================================

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active
          ? 'bg-[#00AEEF] text-white shadow-md'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// =============================================================================
// Analytics View
// =============================================================================

function AnalyticsView({ 
  analytics, 
  isLoading, 
  onRefresh,
  getLanguageName,
  getLanguageFlag,
}: { 
  analytics: AnalyticsData | null; 
  isLoading: boolean; 
  onRefresh: () => void;
  getLanguageName: (code: string) => string;
  getLanguageFlag: (code: string) => string;
}) {
  if (isLoading && !analytics) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-96"
      >
        <RefreshCw className="w-8 h-8 text-[#00AEEF] animate-spin" />
      </motion.div>
    );
  }

  if (!analytics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics Overview</h2>
          <p className="text-gray-500">Usage statistics and insights</p>
        </div>
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={<FolderOpen className="w-5 h-5" />}
          label="Total Sessions"
          value={analytics.totals.totalSessions}
          color="#00A6A6"
        />
        <MetricCard 
          icon={<MessageSquare className="w-5 h-5" />}
          label="Total Translations"
          value={analytics.totals.totalTranslations}
          color="#1B4965"
        />
        <MetricCard 
          icon={<Users className="w-5 h-5" />}
          label="Active Staff"
          value={analytics.totals.activeStaff}
          color="#8B5CF6"
        />
        <MetricCard 
          icon={<Clock className="w-5 h-5" />}
          label="Avg Processing"
          value={`${analytics.totals.avgProcessingTime}ms`}
          color="#F59E0B"
        />
      </div>

      {/* Cloud Storage & Language Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloud Storage Stats */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#00AEEF]/10">
              <Cloud className="w-5 h-5 text-[#00AEEF]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Cloud Storage</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Audio files uploaded</span>
              <span className="text-gray-800 font-medium">{analytics.audioStats.withAudio}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Pending upload</span>
              <span className="text-gray-800 font-medium">{analytics.audioStats.withoutAudio}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Upload rate</span>
              <span className="text-[#00AEEF] font-medium">{analytics.audioStats.uploadRate}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00AEEF] to-[#0090C9] transition-all"
                style={{ width: `${analytics.audioStats.uploadRate}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Language Distribution */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Languages Used</h3>
          </div>
          
          <div className="space-y-3">
            {analytics.languageStats.slice(0, 5).map((lang) => (
              <div key={lang.language} className="flex items-center gap-3">
                <span className="text-2xl">{getLanguageFlag(lang.language)}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-800">{getLanguageName(lang.language)}</span>
                    <span className="text-sm text-gray-500">{lang.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00AEEF] transition-all"
                      style={{ 
                        width: `${(lang.count / Math.max(...analytics.languageStats.map(l => l.count))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Staff Performance */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Staff Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm">
                <th className="pb-3 font-medium">Staff Member</th>
                <th className="pb-3 font-medium text-right">Sessions</th>
                <th className="pb-3 font-medium text-right">Translations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics.staffStats.map((staff) => (
                <tr key={staff.id}>
                  <td className="py-3 text-gray-800">{staff.name}</td>
                  <td className="py-3 text-gray-600 text-right">{staff.sessions}</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00AEEF]/10 text-[#00AEEF] rounded-full text-sm font-medium">
                      {staff.translations}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Sessions Preview */}
      <Card className="bg-white border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Sessions</h3>
        <div className="space-y-3">
          {analytics.recentSessions.slice(0, 5).map((session) => (
            <div 
              key={session.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getLanguageFlag(session.customerLanguage)}</span>
                <div>
                  <p className="text-gray-800 text-sm">
                    {session.customerName || 'Anonymous'} • {getLanguageName(session.customerLanguage)}
                  </p>
                  <p className="text-gray-500 text-xs">{session.staffName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-gray-800 text-sm">{session.translationCount} translations</p>
                  {session.audioCount > 0 && (
                    <p className="text-[#00AEEF] text-xs flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      {session.audioCount} in cloud
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  session.status === 'COMPLETED' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// Metric Card
// =============================================================================

function MetricCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Card>
  );
}

// =============================================================================
// Audio Play Button (fetches signed URL)
// =============================================================================

function AudioPlayButton({ audioUrl }: { audioUrl: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const signedUrl = await api.getSignedAudioUrl(audioUrl);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(signedUrl);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        console.error('Audio playback failed');
      };
      
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to get audio URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00AEEF]/10 hover:bg-[#00AEEF]/20 rounded-lg text-sm text-[#00AEEF] transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <span className="w-4 h-4 flex items-center justify-center">■</span>
      ) : (
        <Play className="w-4 h-4" />
      )}
      {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play Audio'}
    </button>
  );
}

// =============================================================================
// Sessions View
// =============================================================================

function SessionsView({ 
  sessions, 
  isLoading, 
  onRefresh,
  expandedSession,
  setExpandedSession,
  formatDate,
  formatTime,
  getLanguageName,
  getLanguageFlag,
}: { 
  sessions: SessionWithTranslations[]; 
  isLoading: boolean; 
  onRefresh: () => void;
  expandedSession: string | null;
  setExpandedSession: (id: string | null) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  getLanguageName: (code: string) => string;
  getLanguageFlag: (code: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Session History</h2>
          <p className="text-gray-500">All translation sessions with audio links</p>
        </div>
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-sm p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sessions yet</p>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card 
              key={session.id}
              className="bg-white border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Session Header */}
              <button
                onClick={() => setExpandedSession(
                  expandedSession === session.id ? null : session.id
                )}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{getLanguageFlag(session.customerLanguage)}</span>
                  <div className="text-left">
                    <p className="text-gray-800 font-medium">
                      {session.customerName || 'Anonymous Customer'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {getLanguageName(session.customerLanguage)} • {session.staffName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-gray-800 text-sm">{formatDate(session.createdAt)}</p>
                    <p className="text-gray-500 text-xs">
                      {session.translations.length} translations
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      session.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {session.status}
                    </span>
                    {expandedSession === session.id 
                      ? <ChevronDown className="w-5 h-5 text-gray-400" />
                      : <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>
              </button>

              {/* Expanded Translations */}
              <AnimatePresence>
                {expandedSession === session.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 overflow-hidden"
                  >
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-gray-50">
                      {session.translations.map((t, index) => (
                        <div 
                          key={t.id}
                          className={`p-4 rounded-lg ${
                            t.speakerType === 'staff'
                              ? 'bg-[#00AEEF]/5 border border-[#00AEEF]/20 ml-8'
                              : 'bg-purple-50 border border-purple-200 mr-8'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                t.speakerType === 'staff'
                                  ? 'bg-[#00AEEF]/10 text-[#00AEEF]'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {t.speakerType === 'staff' ? 'Staff' : 'Customer'}
                              </span>
                              <span className="text-gray-400 text-xs">#{index + 1}</span>
                            </div>
                            <span className="text-gray-400 text-xs">{formatTime(t.createdAt)}</span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">
                                Original ({getLanguageName(t.sourceLanguage)})
                              </p>
                              <p className="text-gray-800">{t.originalText}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">
                                Translation ({getLanguageName(t.targetLanguage)})
                              </p>
                              <p className="text-[#00AEEF] font-medium">{t.translatedText}</p>
                            </div>
                          </div>

                          {/* Audio Link */}
                          {t.audioUrl && (
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-3">
                              <AudioPlayButton audioUrl={t.audioUrl} />
                              <span className="text-xs text-gray-400">
                                <Cloud className="w-3 h-3 inline mr-1" />
                                Secured in cloud
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      {session.translations.length === 0 && (
                        <p className="text-gray-400 text-center py-4">
                          No translations in this session
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Translate View
// =============================================================================

function TranslateView({ 
  languages, 
  onSelectLanguage 
}: { 
  languages: typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES][];
  onSelectLanguage: (language: LanguageCode) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Select Customer Language
        </h2>
        <p className="text-gray-500">
          Choose the language your customer speaks
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl w-full">
        {languages.map((language, index) => (
          <motion.button
            key={language.code}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectLanguage(language.code)}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-center transition-all bg-white shadow-lg shadow-gray-200/50"
            style={{
              border: `2px solid ${language.color}40`,
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity -z-10"
              style={{ background: language.color }}
            />
            <span className="text-4xl mb-2">{language.flag}</span>
            <span className="text-sm font-medium text-gray-800">{language.nativeName}</span>
            <span className="text-xs text-gray-500">{language.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default AdminDashboard;
