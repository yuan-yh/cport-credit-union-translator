import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// =============================================================================
// BUTTON VARIANTS
// =============================================================================

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cport-navy',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-info-600 text-white',
          'hover:bg-info-400 hover:shadow-lg hover:-translate-y-0.5',
          'focus:ring-info-400',
        ],
        secondary: [
          'bg-cport-blue/20 text-cport-green-light border border-cport-gray',
          'hover:bg-cport-gray hover:border-cport-gray',
          'focus:ring-cport-gray',
        ],
        danger: [
          'bg-danger-600 text-white',
          'hover:bg-danger-400 hover:shadow-lg hover:-translate-y-0.5',
          'focus:ring-danger-400',
        ],
        success: [
          'bg-success-600 text-white',
          'hover:bg-success-400 hover:shadow-lg hover:-translate-y-0.5',
          'focus:ring-success-400',
        ],
        ghost: [
          'bg-transparent text-cport-gray',
          'hover:bg-cport-blue/20/50 hover:text-cport-green-light',
          'focus:ring-cport-gray',
        ],
        outline: [
          'bg-transparent text-cport-green-light border border-cport-gray',
          'hover:bg-cport-blue/20/30 hover:border-cport-gray',
          'focus:ring-cport-gray',
        ],
      },
      size: {
        sm: 'h-9 px-4 text-body-sm rounded-lg',
        md: 'h-11 px-6 text-body rounded-lg',
        lg: 'h-14 px-8 text-body-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// =============================================================================
// LOADING SPINNER
// =============================================================================

function LoadingSpinner(): React.ReactElement {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Export variants for external use
export { buttonVariants };
