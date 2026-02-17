import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Settings, Menu } from 'lucide-react';
import { cn, getInitials } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { StatusIndicator } from './Badge';
import { Logo } from '../brand/Logo';

// =============================================================================
// HEADER COMPONENT - cPort Branding
// =============================================================================

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function Header({
  title,
  subtitle,
  actions,
  className,
}: HeaderProps): React.ReactElement {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={cn(
        'h-16 px-6 flex items-center justify-between',
        'bg-cport-navy border-b border-cport-slate',
        'sticky top-0 z-40',
        className
      )}
    >
      {/* Left section - Logo and title */}
      <div className="flex items-center gap-4">
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Logo size="sm" variant="full" />
        </Link>

        {/* Divider */}
        {title && (
          <>
            <div className="w-px h-6 bg-cport-slate hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-body-sm font-medium text-cport-white">{title}</p>
              {subtitle && (
                <p className="text-caption text-cport-gray">{subtitle}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Center section - Actions */}
      {actions && (
        <div className="hidden md:flex items-center gap-2">
          {actions}
        </div>
      )}

      {/* Right section - User info */}
      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cport-slate/50">
          <StatusIndicator status="online" />
          <span className="text-caption text-cport-gray">Connected</span>
        </div>

        {/* User menu */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-body-sm font-medium text-cport-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-caption text-cport-gray capitalize">
                {user.role.toLowerCase()}
              </p>
            </div>

            <Avatar
              initials={getInitials(`${user.firstName} ${user.lastName}`)}
              size="sm"
            />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Logout"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
