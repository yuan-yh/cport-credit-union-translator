import { create } from 'zustand';
import type { Translation, LanguageCode } from '../types';

// =============================================================================
// SESSION STORE - SIMPLIFIED
// =============================================================================

interface SessionState {
  translations: Translation[];
  isTranslating: boolean;
  translationError: string | null;
  selectedLanguage: LanguageCode;
}

interface SessionActions {
  addTranslation: (translation: Translation) => void;
  clearTranslations: () => void;
  setTranslating: (isTranslating: boolean) => void;
  setTranslationError: (error: string | null) => void;
  setSelectedLanguage: (language: LanguageCode) => void;
}

type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  translations: [],
  isTranslating: false,
  translationError: null,
  selectedLanguage: 'pt',
};

export const useSessionStore = create<SessionStore>()((set) => ({
  ...initialState,

  addTranslation: (translation: Translation) => {
    set((state) => ({
      translations: [...state.translations, translation],
    }));
  },

  clearTranslations: () => {
    set({ translations: [] });
  },

  setTranslating: (isTranslating: boolean) => {
    set({ isTranslating });
  },

  setTranslationError: (error: string | null) => {
    set({ translationError: error });
  },

  setSelectedLanguage: (language: LanguageCode) => {
    set({ selectedLanguage: language });
  },
}));

// Selectors
export const selectTranslations = (state: SessionStore) => state.translations;
export const selectSelectedLanguage = (state: SessionStore) => state.selectedLanguage;
