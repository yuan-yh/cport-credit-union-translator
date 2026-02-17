import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';

// =============================================================================
// LOGIN PAGE - Dark Immersive UI (matches Voice Interface)
// =============================================================================

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for subtle gradient effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      
      // Always redirect to /dashboard for role-based routing
      // Don't use "from" as it may have stale role-specific routes
      navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] overflow-hidden relative">
      {/* Light gradient background */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-out"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(0, 174, 239, 0.08) 0%, 
              transparent 50%),
            radial-gradient(ellipse 60% 40% at 20% 80%, 
              rgba(0, 174, 239, 0.05) 0%, 
              transparent 40%),
            radial-gradient(ellipse 50% 30% at 80% 20%, 
              rgba(0, 144, 201, 0.06) 0%, 
              transparent 30%),
            linear-gradient(180deg, #f5f7fa 0%, #e8eef5 100%)
          `,
        }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating orbs - cPort blue (subtle on light bg) */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
        style={{ background: 'radial-gradient(circle, #00AEEF 0%, transparent 70%)' }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 60, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
        style={{ background: 'radial-gradient(circle, #0090C9 0%, transparent 70%)' }}
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 60, -40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Official cPort Full Logo */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(0, 174, 239, 0.1) 0%, transparent 70%)'
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <img 
                src="/images/cport-logo-full.png" 
                alt="cPort Credit Union" 
                className="h-16 w-auto"
              />
            </motion.div>
          </div>
          
          <h1 className="text-2xl font-light text-gray-800 mb-2 tracking-tight">
            Translation <span className="font-semibold" style={{ color: '#00AEEF' }}>Assistant</span>
          </h1>
          <p className="text-gray-500 text-sm tracking-wider uppercase">
            Staff Portal
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cn(
            'rounded-2xl p-8',
            'bg-white/80 backdrop-blur-xl',
            'border border-gray-200',
            'shadow-xl shadow-gray-200/50'
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600 font-medium">Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  className={cn(
                    'w-full pl-11 pr-4 py-3.5 rounded-xl',
                    'bg-gray-50 border border-gray-200',
                    'text-gray-900 placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]',
                    'transition-all duration-200',
                    'disabled:opacity-50'
                  )}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  className={cn(
                    'w-full pl-11 pr-4 py-3.5 rounded-xl',
                    'bg-gray-50 border border-gray-200',
                    'text-gray-900 placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]',
                    'transition-all duration-200',
                    'disabled:opacity-50'
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                'w-full py-4 rounded-xl font-medium text-white',
                'bg-gradient-to-r from-[#00AEEF] to-[#0090C9]',
                'hover:from-[#33C1F5] hover:to-[#00AEEF]',
                'focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/50 focus:ring-offset-2 focus:ring-offset-white',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-lg shadow-[#00AEEF]/30'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-4">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEmail('staff');
                  setPassword('staff123');
                }}
                className={cn(
                  'p-4 rounded-xl text-center',
                  'bg-gray-50 hover:bg-gray-100',
                  'border border-gray-200 hover:border-gray-300',
                  'transition-all duration-200'
                )}
              >
                <p className="font-medium text-gray-700">Staff</p>
                <p className="text-xs text-gray-500 mt-1">staff / staff123</p>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEmail('admin');
                  setPassword('admin123');
                }}
                className={cn(
                  'p-4 rounded-xl text-center',
                  'bg-gradient-to-br from-[#00AEEF]/10 to-[#0090C9]/10',
                  'hover:from-[#00AEEF]/20 hover:to-[#0090C9]/20',
                  'border border-[#00AEEF]/30 hover:border-[#00AEEF]/50',
                  'transition-all duration-200'
                )}
              >
                <p className="font-medium" style={{ color: '#00AEEF' }}>Admin</p>
                <p className="text-xs text-gray-600 mt-1">admin / admin123</p>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-gray-500 text-center"
        >
          Need help? Contact IT Support
        </motion.p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
