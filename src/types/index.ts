// =============================================================================
// CPORT CREDIT UNION TRANSLATION TOOL - TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// Constants (using const objects instead of enums for erasableSyntaxOnly)
// -----------------------------------------------------------------------------

export const UserRole = {
  GREETER: 'GREETER',
  TELLER: 'TELLER',
  CONSULTOR: 'CONSULTOR',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const SessionStatus = {
  ACTIVE: 'ACTIVE',
  WAITING: 'WAITING',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const ServiceType = {
  SIMPLE_TRANSACTION: 'SIMPLE_TRANSACTION',
  COMPLEX_SERVICE: 'COMPLEX_SERVICE',
  URGENT: 'URGENT',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const QueueType = {
  TELLER: 'TELLER',
  CONSULTOR: 'CONSULTOR',
} as const;
export type QueueType = (typeof QueueType)[keyof typeof QueueType];

export const QueueStatus = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type QueueStatus = (typeof QueueStatus)[keyof typeof QueueStatus];

export const Priority = {
  LOW: 'LOW',
  STANDARD: 'STANDARD',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const EmotionState = {
  CALM: 'CALM',
  NEUTRAL: 'NEUTRAL',
  ANXIOUS: 'ANXIOUS',
  DISTRESSED: 'DISTRESSED',
} as const;
export type EmotionState = (typeof EmotionState)[keyof typeof EmotionState];

// -----------------------------------------------------------------------------
// Language Types
// -----------------------------------------------------------------------------

export type LanguageCode = 'en' | 'pt' | 'fr' | 'so' | 'ar' | 'es';

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
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string;
  firstName: string;
  iat: number;
  exp: number;
}

// -----------------------------------------------------------------------------
// Session Types
// -----------------------------------------------------------------------------

export interface Session {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  preferredLanguage: LanguageCode;
  status: SessionStatus;
  serviceType: ServiceType | null;
  priority: Priority;
  emotionState: EmotionState | null;
  branchId: string;
  greeterId: string | null;
  assignedBankerId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface SessionWithDetails extends Session {
  greeter?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  assignedBanker?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  translations: Translation[];
  queueItem?: QueueItem;
}

export interface CreateSessionInput {
  customerName?: string;
  customerPhone?: string;
  preferredLanguage: LanguageCode;
  serviceType?: ServiceType;
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
  confidence: number;
  context: string | null;
  speakerType: 'customer' | 'staff';
  processingTimeMs: number;
  createdAt: string;
  createdById: string;
}

export interface TranslationRequest {
  sessionId: string;
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  speakerType: 'customer' | 'staff';
  context?: string;
}

export interface TranslationResponse {
  translation: Translation;
  alternatives?: string[];
}

// -----------------------------------------------------------------------------
// Queue Types
// -----------------------------------------------------------------------------

export interface QueueItem {
  id: string;
  sessionId: string;
  queueType: QueueType;
  position: number;
  estimatedWaitMinutes: number;
  priority: Priority;
  status: QueueStatus;
  assignedBankerId: string | null;
  createdAt: string;
  updatedAt: string;
  calledAt: string | null;
  completedAt: string | null;
}

export interface QueueItemWithSession extends QueueItem {
  session: Pick<Session, 
    'id' | 'customerName' | 'preferredLanguage' | 'serviceType' | 'emotionState'
  >;
  assignedBanker?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface QueueStats {
  tellerQueue: {
    count: number;
    estimatedWait: number;
  };
  consultorQueue: {
    count: number;
    estimatedWait: number;
  };
}

// -----------------------------------------------------------------------------
// Chat History Types
// -----------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  sessionId: string;
  translationId: string | null;
  speakerType: 'customer' | 'staff' | 'system';
  originalText: string;
  translatedText: string | null;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode | null;
  confidence: number | null;
  timestamp: string;
}

export interface ChatHistory {
  sessionId: string;
  messages: ChatMessage[];
  customerLanguage: LanguageCode;
  staffLanguage: LanguageCode;
  createdAt: string;
  updatedAt: string;
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
  details?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// -----------------------------------------------------------------------------
// Socket Event Types
// -----------------------------------------------------------------------------

export interface SocketEvents {
  // Client -> Server
  'session:join': (sessionId: string) => void;
  'session:leave': (sessionId: string) => void;
  'translation:request': (request: TranslationRequest) => void;
  'queue:update': (queueItemId: string, status: QueueStatus) => void;
  
  // Server -> Client
  'session:updated': (session: SessionWithDetails) => void;
  'translation:result': (translation: Translation) => void;
  'translation:error': (error: { sessionId: string; message: string }) => void;
  'queue:changed': (stats: QueueStats) => void;
  'queue:item-updated': (item: QueueItemWithSession) => void;
  'notification': (notification: { type: string; message: string }) => void;
}

// -----------------------------------------------------------------------------
// UI State Types
// -----------------------------------------------------------------------------

export type UIMode = 'standard' | 'focus';

export interface UIPreferences {
  mode: UIMode;
  soundEnabled: boolean;
  autoPlayTranslations: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  error: string | null;
}

// -----------------------------------------------------------------------------
// Form Types
// -----------------------------------------------------------------------------

export interface CustomerFormData {
  name: string;
  phone: string;
  serviceType: ServiceType;
  notes: string;
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
