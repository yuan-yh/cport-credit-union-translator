import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// =============================================================================
// CARD VARIANTS
// =============================================================================

const cardVariants = cva(
  // Base styles
  [
    'rounded-2xl border transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-cport-slate border-cport-gray/30',
        ],
        elevated: [
          'bg-cport-slate border-cport-gray/30',
          'shadow-xl',
        ],
        outline: [
          'bg-transparent border-cport-gray',
        ],
        interactive: [
          'bg-cport-slate border-cport-gray/30',
          'hover:bg-cport-blue/20 hover:border-cport-gray',
          'cursor-pointer',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

// =============================================================================
// CARD COMPONENT
// =============================================================================

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// =============================================================================
// CARD HEADER
// =============================================================================

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}: CardHeaderProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 pb-4 border-b border-cport-gray/30',
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-h3 font-semibold text-white truncate">{title}</h3>
        )}
        {subtitle && (
          <p className="text-body-sm text-cport-gray mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// =============================================================================
// CARD BODY
// =============================================================================

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className, ...props }: CardBodyProps): React.ReactElement {
  return <div className={cn('py-4', className)} {...props} />;
}

// =============================================================================
// CARD FOOTER
// =============================================================================

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({
  className,
  ...props
}: CardFooterProps): React.ReactElement {
  return (
    <div
      className={cn(
        'pt-4 border-t border-cport-gray/30 flex items-center gap-3',
        className
      )}
      {...props}
    />
  );
}

// Export variants
export { cardVariants };
