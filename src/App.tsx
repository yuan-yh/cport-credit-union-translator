import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { useAuthStore } from './stores/authStore';
import { UserRole } from './types';

// =============================================================================
// QUERY CLIENT
// =============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
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

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return <>{children}</>;
}

// =============================================================================
// ROLE-BASED REDIRECT
// =============================================================================

function RoleBasedRedirect(): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  
  // Debug: log the role comparison
  console.log('RoleBasedRedirect - user:', user);
  console.log('RoleBasedRedirect - user.role:', user?.role);
  console.log('RoleBasedRedirect - UserRole.ADMIN:', UserRole.ADMIN);
  console.log('RoleBasedRedirect - match:', user?.role === UserRole.ADMIN);
  
  // Check role (case-insensitive for safety)
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/translate" replace />;
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
            {/* Login */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />

            {/* Admin Dashboard - History & Cloud Sync */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole={UserRole.ADMIN}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Staff Translation Interface */}
            <Route
              path="/translate"
              element={
                <ProtectedRoute>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* Role-based redirect */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
