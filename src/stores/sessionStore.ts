import { create } from 'zustand';
import type { 
  SessionWithDetails, 
  Translation, 
  LanguageCode, 
  QueueStats, 
  QueueItemWithSession,
  CreateSessionInput,
  TranslationRequest,
} from '../types';
import { api } from '../lib/api';

// =============================================================================
// SESSION STORE
// =============================================================================

interface SessionState {
  // Current active session
  currentSession: SessionWithDetails | null;
  
  // Translation state
  translations: Translation[];
  isTranslating: boolean;
  translationError: string | null;
  
  // Queue state
  queueStats: QueueStats | null;
  myQueue: QueueItemWithSession[];
  
  // Language selection
  selectedLanguage: LanguageCode;
  
  // Loading states
  isLoadingSession: boolean;
  isLoadingQueue: boolean;
}

interface SessionActions {
  // Session actions
  createSession: (input: CreateSessionInput) => Promise<SessionWithDetails>;
  loadSession: (sessionId: string) => Promise<void>;
  updateSession: (updates: Partial<SessionWithDetails>) => Promise<void>;
  completeSession: () => Promise<void>;
  clearSession: () => void;
  
  // Translation actions
  addTranslation: (translation: Translation) => void;
  requestTranslation: (request: Omit<TranslationRequest, 'sessionId'>) => Promise<Translation>;
  setTranslating: (isTranslating: boolean) => void;
  setTranslationError: (error: string | null) => void;
  
  // Queue actions
  loadQueueStats: () => Promise<void>;
  loadMyQueue: () => Promise<void>;
  addToQueue: (queueType: 'TELLER' | 'CONSULTOR') => Promise<void>;
  updateQueueStats: (stats: QueueStats) => void;
  updateQueueItem: (item: QueueItemWithSession) => void;
  
  // Language actions
  setSelectedLanguage: (language: LanguageCode) => void;
}

type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  currentSession: null,
  translations: [],
  isTranslating: false,
  translationError: null,
  queueStats: null,
  myQueue: [],
  selectedLanguage: 'pt',
  isLoadingSession: false,
  isLoadingQueue: false,
};

export const useSessionStore = create<SessionStore>()((set, get) => ({
  ...initialState,

  // ---------------------------------------------------------------------------
  // Session Actions
  // ---------------------------------------------------------------------------

  createSession: async (input: CreateSessionInput) => {
    set({ isLoadingSession: true });
    
    try {
      const session = await api.createSession(input);
      
      set({
        currentSession: session,
        translations: session.translations || [],
        isLoadingSession: false,
      });
      
      return session;
    } catch (error) {
      set({ isLoadingSession: false });
      throw error;
    }
  },

  loadSession: async (sessionId: string) => {
    set({ isLoadingSession: true });
    
    try {
      const session = await api.getSession(sessionId);
      
      set({
        currentSession: session,
        translations: session.translations || [],
        selectedLanguage: session.preferredLanguage,
        isLoadingSession: false,
      });
    } catch (error) {
      set({ isLoadingSession: false });
      throw error;
    }
  },

  updateSession: async (updates: Partial<SessionWithDetails>) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    try {
      const updated = await api.updateSession(currentSession.id, updates);
      set({ currentSession: updated });
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  },

  completeSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    try {
      await api.completeSession(currentSession.id);
      set({ 
        currentSession: null,
        translations: [],
      });
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  },

  clearSession: () => {
    set({
      currentSession: null,
      translations: [],
      translationError: null,
    });
  },

  // ---------------------------------------------------------------------------
  // Translation Actions
  // ---------------------------------------------------------------------------

  addTranslation: (translation: Translation) => {
    set((state) => ({
      translations: [...state.translations, translation],
    }));
  },

  requestTranslation: async (request: Omit<TranslationRequest, 'sessionId'>) => {
    const { currentSession } = get();
    if (!currentSession) {
      throw new Error('No active session');
    }
    
    set({ isTranslating: true, translationError: null });
    
    try {
      const translation = await api.translate({
        ...request,
        sessionId: currentSession.id,
      });
      
      set((state) => ({
        translations: [...state.translations, translation],
        isTranslating: false,
      }));
      
      return translation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Translation failed';
      set({ 
        isTranslating: false, 
        translationError: message,
      });
      throw error;
    }
  },

  setTranslating: (isTranslating: boolean) => {
    set({ isTranslating });
  },

  setTranslationError: (error: string | null) => {
    set({ translationError: error });
  },

  // ---------------------------------------------------------------------------
  // Queue Actions
  // ---------------------------------------------------------------------------

  loadQueueStats: async () => {
    try {
      const stats = await api.getQueueStats();
      set({ queueStats: stats });
    } catch (error) {
      console.error('Failed to load queue stats:', error);
    }
  },

  loadMyQueue: async () => {
    set({ isLoadingQueue: true });
    
    try {
      const queue = await api.getQueue();
      set({ myQueue: queue, isLoadingQueue: false });
    } catch (error) {
      set({ isLoadingQueue: false });
      console.error('Failed to load queue:', error);
    }
  },

  addToQueue: async (queueType: 'TELLER' | 'CONSULTOR') => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    try {
      await api.addToQueue(currentSession.id, queueType);
      // Refresh queue stats
      await get().loadQueueStats();
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw error;
    }
  },

  updateQueueStats: (stats: QueueStats) => {
    set({ queueStats: stats });
  },

  updateQueueItem: (item: QueueItemWithSession) => {
    set((state) => ({
      myQueue: state.myQueue.map((q) =>
        q.id === item.id ? item : q
      ),
    }));
  },

  // ---------------------------------------------------------------------------
  // Language Actions
  // ---------------------------------------------------------------------------

  setSelectedLanguage: (language: LanguageCode) => {
    set({ selectedLanguage: language });
  },
}));

// =============================================================================
// SELECTORS
// =============================================================================

export const selectCurrentSession = (state: SessionStore) => state.currentSession;
export const selectTranslations = (state: SessionStore) => state.translations;
export const selectQueueStats = (state: SessionStore) => state.queueStats;
export const selectMyQueue = (state: SessionStore) => state.myQueue;
export const selectSelectedLanguage = (state: SessionStore) => state.selectedLanguage;
