import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState, LoginCredentials, UserRole } from '../types';
import { api } from '../lib/api';

// =============================================================================
// AUTH STORE
// =============================================================================

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

type AuthStore = AuthState & AuthActions;

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 100,
  STAFF: 50,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        
        try {
          const response = await api.login(credentials);
          
          console.log('Login successful:', {
            username: response.user.username,
            role: response.user.role,
          });
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Store token in API client
          api.setAccessToken(response.accessToken);
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch (e) {
          // Ignore logout API errors
          console.log('Logout API error (ignored):', e);
        } finally {
          // Always clear local state and localStorage
          api.clearAccessToken();
          
          // Clear persisted state
          localStorage.removeItem('cport-auth');
          
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          console.log('Logged out - state cleared');
        }
      },

      refreshAuth: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          // Restore token to API client
          api.setAccessToken(accessToken);
          
          // Verify token is still valid by fetching current user
          const user = await api.getCurrentUser();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token is invalid - clear auth state
          api.clearAccessToken();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      hasPermission: (requiredRole: UserRole | UserRole[]) => {
        const { user } = get();
        
        if (!user) return false;
        
        const userLevel = ROLE_HIERARCHY[user.role];
        
        if (Array.isArray(requiredRole)) {
          // Check if user's role is in the allowed list OR higher than the highest required
          return requiredRole.some(role => 
            user.role === role || userLevel >= ROLE_HIERARCHY[role]
          );
        }
        
        // Check if user's role is at or above the required level
        return userLevel >= ROLE_HIERARCHY[requiredRole];
      },
    }),
    {
      name: 'cport-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        // Don't persist user - we'll refresh from API
      }),
    }
  )
);

// =============================================================================
// AUTH SELECTORS
// =============================================================================

export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectUserRole = (state: AuthStore) => state.user?.role;
