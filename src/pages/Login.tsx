import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button, Input, Card } from '../components/ui';
import { cn } from '../lib/utils';
import type { UserRole } from '../types';

// =============================================================================
// LOGIN PAGE
// =============================================================================

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      
      // Redirect to intended destination or role-based default
      const from = (location.state as { from?: string })?.from;
      
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Get user role and redirect accordingly
        const user = useAuthStore.getState().user;
        if (user) {
          const roleRedirects: Record<UserRole, string> = {
            GREETER: '/greeter',
            TELLER: '/teller',
            CONSULTOR: '/consultor',
            MANAGER: '/admin',
            ADMIN: '/admin',
          };
          navigate(roleRedirects[user.role] || '/greeter', { replace: true });
        }
      }
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Invalid credentials. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-midnight p-4">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(27, 38, 59, 0.8) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-info-600 mb-4">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          
          <h1 className="text-h1 font-bold text-white mb-2">
            cPort Credit Union
          </h1>
          <p className="text-body text-brand-fog">
            Translation Assistant
          </p>
        </div>

        {/* Login Card */}
        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-danger-600/10 border border-danger-600/20">
                <AlertCircle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
                <p className="text-body-sm text-danger-400">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <Input
              type="email"
              label="Email"
              placeholder="staff@cportcu.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
              disabled={isSubmitting}
            />

            {/* Password Input */}
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-6 border-t border-brand-harbor/30">
            <p className="text-caption text-brand-fog text-center">
              Demo credentials:
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-caption">
              <DemoCredential 
                role="Greeter" 
                email="sarah.wilson@cportcu.org" 
                onClick={() => {
                  setEmail('sarah.wilson@cportcu.org');
                  setPassword('password123');
                }}
              />
              <DemoCredential 
                role="Teller" 
                email="mike.johnson@cportcu.org" 
                onClick={() => {
                  setEmail('mike.johnson@cportcu.org');
                  setPassword('password123');
                }}
              />
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-caption text-brand-harbor text-center">
          Need help? Contact IT Support
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// DEMO CREDENTIAL BUTTON
// =============================================================================

interface DemoCredentialProps {
  role: string;
  email: string;
  onClick: () => void;
}

function DemoCredential({ role, email, onClick }: DemoCredentialProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg text-left',
        'bg-brand-steel-blue/30 hover:bg-brand-steel-blue/50',
        'border border-brand-harbor/30 hover:border-brand-harbor/50',
        'transition-colors'
      )}
    >
      <p className="font-medium text-brand-sea-foam">{role}</p>
      <p className="text-brand-fog truncate">{email}</p>
    </button>
  );
}

export default LoginPage;
