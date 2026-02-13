import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';
import { LoginPage, GreeterDashboard, TellerDashboard, ConsultorDashboard } from './pages';
import { useAuthStore } from './stores/authStore';
import { useSessionStore } from './stores/sessionStore';
import { UserRole } from './types';

// =============================================================================
// QUERY CLIENT
// =============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// =============================================================================
// APP INITIALIZER
// =============================================================================

function AppInitializer({ children }: { children: React.ReactNode }): React.ReactElement {
  const refreshAuth = useAuthStore((state) => state.refreshAuth);
  const loadQueueStats = useSessionStore((state) => state.loadQueueStats);

  useEffect(() => {
    // Restore auth state on app load
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    // Load queue stats on mount and periodically
    loadQueueStats();
    const interval = setInterval(loadQueueStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [loadQueueStats]);

  return <>{children}</>;
}

// =============================================================================
// APP COMPONENT
// =============================================================================

function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/greeter"
              element={
                <ProtectedRoute requiredRoles={[UserRole.GREETER, UserRole.MANAGER, UserRole.ADMIN]}>
                  <GreeterDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teller"
              element={
                <ProtectedRoute requiredRoles={[UserRole.TELLER, UserRole.MANAGER, UserRole.ADMIN]}>
                  <TellerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consultor"
              element={
                <ProtectedRoute requiredRoles={[UserRole.CONSULTOR, UserRole.MANAGER, UserRole.ADMIN]}>
                  <ConsultorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
