import { cn } from '../../lib/utils';

// =============================================================================
// CPORT CREDIT UNION LOGO
// Using official cPort Credit Union brand assets
// =============================================================================

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
}

const sizeClasses = {
  sm: { icon: 'h-8', full: 'h-8' },
  md: { icon: 'h-10', full: 'h-10' },
  lg: { icon: 'h-12', full: 'h-12' },
  xl: { icon: 'h-16', full: 'h-14' },
};

export function Logo({ 
  size = 'md', 
  variant = 'full',
  className 
}: LogoProps): React.ReactElement {
  const sizes = sizeClasses[size];

  if (variant === 'icon') {
    return (
      <img 
        src="/images/cport-star.png" 
        alt="cPort Credit Union" 
        className={cn(sizes.icon, 'w-auto', className)}
      />
    );
  }

  return (
    <img 
      src="/images/cport-logo-full.png" 
      alt="cPort Credit Union" 
      className={cn(sizes.full, 'w-auto', className)}
    />
  );
}

// =============================================================================
// CPORT STAR ICON - For standalone use
// =============================================================================

interface CPortStarIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const starSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function CPortStarIcon({ 
  className,
  size = 'md'
}: CPortStarIconProps): React.ReactElement {
  return (
    <img 
      src="/images/cport-star.png" 
      alt="cPort" 
      className={cn(starSizes[size], 'object-contain', className)}
    />
  );
}

// =============================================================================
// LOGO MARK ONLY (for favicons, small spaces)
// =============================================================================

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoMarkProps): React.ReactElement {
  return (
    <img 
      src="/images/cport-star.png" 
      alt="cPort" 
      style={{ width: size, height: size }}
      className={cn('object-contain', className)}
    />
  );
}

// =============================================================================
// FULL LOGO WITH VARIANTS
// =============================================================================

interface FullLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  className?: string;
}

export function FullLogo({ 
  size = 'md', 
  className 
}: FullLogoProps): React.ReactElement {
  const sizes = sizeClasses[size];

  return (
    <img 
      src="/images/cport-logo-full.png" 
      alt="cPort Credit Union" 
      className={cn(sizes.full, 'w-auto', className)}
    />
  );
}
