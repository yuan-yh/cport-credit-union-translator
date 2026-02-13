import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// =============================================================================
// BADGE VARIANTS
// =============================================================================

const badgeVariants = cva(
  // Base styles
  [
    'inline-flex items-center gap-1.5 font-medium',
    'rounded-full border transition-colors',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-brand-harbor/20 text-brand-fog border-brand-harbor/30',
        ],
        success: [
          'bg-success-400/15 text-success-400 border-success-400/30',
        ],
        warning: [
          'bg-warning-400/15 text-warning-400 border-warning-400/30',
        ],
        danger: [
          'bg-danger-400/15 text-danger-400 border-danger-400/30',
        ],
        info: [
          'bg-info-400/15 text-info-400 border-info-400/30',
        ],
        // Language badges
        portuguese: [
          'bg-lang-portuguese/15 text-lang-portuguese border-lang-portuguese/30',
        ],
        french: [
          'bg-lang-french/15 text-lang-french border-lang-french/30',
        ],
        somali: [
          'bg-lang-somali/15 text-lang-somali border-lang-somali/30',
        ],
        arabic: [
          'bg-lang-arabic/15 text-lang-arabic border-lang-arabic/30',
        ],
        spanish: [
          'bg-lang-spanish/15 text-lang-spanish border-lang-spanish/30',
        ],
        english: [
          'bg-lang-english/15 text-lang-english border-lang-english/30',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-caption',
        md: 'px-2.5 py-1 text-body-sm',
        lg: 'px-3 py-1.5 text-body',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// =============================================================================
// BADGE COMPONENT
// =============================================================================

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  dot = false,
  children,
  ...props
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}

// =============================================================================
// STATUS INDICATOR
// =============================================================================

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  online: { color: 'bg-success-400', label: 'Online' },
  offline: { color: 'bg-brand-fog', label: 'Offline' },
  busy: { color: 'bg-danger-400', label: 'Busy' },
  away: { color: 'bg-warning-400', label: 'Away' },
};

export function StatusIndicator({
  status,
  showLabel = false,
  className,
}: StatusIndicatorProps): React.ReactElement {
  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('w-2 h-2 rounded-full', config.color)} />
      {showLabel && (
        <span className="text-body-sm text-brand-fog">{config.label}</span>
      )}
    </span>
  );
}

// Export variants
export { badgeVariants };
