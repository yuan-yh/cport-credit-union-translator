// =============================================================================
// CPORT CREDIT UNION TRANSLATION TOOL - SIMPLIFIED TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// User Role (Admin only)
// -----------------------------------------------------------------------------

export const UserRole = {
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// -----------------------------------------------------------------------------
// Session Status
// -----------------------------------------------------------------------------

export const SessionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

// -----------------------------------------------------------------------------
// Language Types
// -----------------------------------------------------------------------------

export type LanguageCode = 'en' | 'pt' | 'fr' | 'so' | 'ar' | 'es' | 'ln';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  color: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, Language> = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', color: '#6B7280' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', color: '#22C55E' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', color: '#3B82F6' },
  so: { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴', color: '#F59E0B' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', color: '#8B5CF6', rtl: true },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', color: '#EF4444' },
  ln: { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩', color: '#06B6D4' },
};

// -----------------------------------------------------------------------------
// User & Authentication Types
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// -----------------------------------------------------------------------------
// Session Types
// -----------------------------------------------------------------------------

export interface Session {
  id: string;
  customerLanguage: LanguageCode;
  customerName: string | null;
  notes: string | null;
  status: SessionStatus;
  staffId: string;
  staffName: string | null;
  translationCount: number;
  createdAt: string;
  completedAt: string | null;
}

// SessionWithTranslations moved to Analytics section below

export interface CreateSessionInput {
  customerLanguage: LanguageCode;
  customerName?: string;
  notes?: string;
}

// -----------------------------------------------------------------------------
// Translation Types
// -----------------------------------------------------------------------------

export interface Translation {
  id: string;
  sessionId: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  speakerType: 'customer' | 'staff';
  confidence: number;
  processingTimeMs: number;
  audioUrl: string | null;
  staffId: string;
  staffName: string | null;
  customerLanguage?: LanguageCode;
  customerName?: string;
  createdAt: string;
  // TTS audio (base64 MP3)
  ttsAudio?: string;
  ttsAvailable?: boolean;
  // No speech detected
  noSpeechDetected?: boolean;
  message?: string;
}

export interface TranslationRequest {
  sessionId: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  speakerType: 'customer' | 'staff';
  context?: string;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
}

// -----------------------------------------------------------------------------
// Socket Event Types
// -----------------------------------------------------------------------------

export interface SocketEvents {
  'session:join': (sessionId: string) => void;
  'session:leave': (sessionId: string) => void;
  'translation:result': (translation: Translation) => void;
  'translation:error': (error: { sessionId: string; message: string }) => void;
}

// -----------------------------------------------------------------------------
// UI State Types
// -----------------------------------------------------------------------------

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  error: string | null;
}

// -----------------------------------------------------------------------------
// Analytics Types
// -----------------------------------------------------------------------------

export interface AnalyticsTotals {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  totalTranslations: number;
  activeStaff: number;
  avgProcessingTime: number;
}

export interface LanguageStat {
  language: string;
  count: number;
}

export interface DailyStat {
  date: string;
  translations: number;
  sessions: number;
}

export interface StaffStat {
  id: string;
  name: string;
  translations: number;
  sessions: number;
}

export interface RecentSession {
  id: string;
  customerLanguage: string;
  customerName: string | null;
  status: string;
  staffName: string;
  translationCount: number;
  audioCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface SpeakerStat {
  speakerType: string;
  count: number;
}

export interface AudioStats {
  total: number;
  withAudio: number;
  withoutAudio: number;
  uploadRate: number;
}

export interface AnalyticsData {
  totals: AnalyticsTotals;
  languageStats: LanguageStat[];
  dailyStats: DailyStat[];
  staffStats: StaffStat[];
  recentSessions: RecentSession[];
  speakerStats: SpeakerStat[];
  audioStats: AudioStats;
}

export interface SessionWithTranslations {
  id: string;
  customerLanguage: string;
  customerName: string | null;
  notes: string | null;
  status: string;
  staffId: string;
  staffName: string;
  createdAt: string;
  completedAt: string | null;
  translations: Translation[];
}
