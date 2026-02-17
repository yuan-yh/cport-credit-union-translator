import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// =============================================================================
// INPUT VARIANTS
// =============================================================================

const inputVariants = cva(
  // Base styles
  [
    'w-full bg-cport-blue/20 text-white placeholder:text-cport-gray',
    'border border-cport-gray rounded-lg',
    'transition-all duration-150',
    'focus:outline-none focus:border-info-400 focus:ring-2 focus:ring-info-400/20',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-body-sm',
        md: 'h-11 px-4 text-body',
        lg: 'h-14 px-5 text-body-lg',
      },
      hasError: {
        true: 'border-danger-400 focus:border-danger-400 focus:ring-danger-400/20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// =============================================================================
// INPUT COMPONENT
// =============================================================================

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      hasError,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasErrorState = hasError || !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-sm font-medium text-cport-gray mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cport-gray">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ size, hasError: hasErrorState }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cport-gray">
              {rightIcon}
            </div>
          )}
        </div>

        {(error || hint) && (
          <p
            className={cn(
              'mt-1.5 text-caption',
              error ? 'text-danger-400' : 'text-cport-gray'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// =============================================================================
// TEXTAREA COMPONENT
// =============================================================================

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-sm font-medium text-cport-gray mb-1.5"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-cport-blue/20 text-white placeholder:text-cport-gray',
            'border rounded-lg px-4 py-3 min-h-[100px] resize-y',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2',
            hasError
              ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-400/20'
              : 'border-cport-gray focus:border-info-400 focus:ring-info-400/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {(error || hint) && (
          <p
            className={cn(
              'mt-1.5 text-caption',
              error ? 'text-danger-400' : 'text-cport-gray'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Export variants
export { inputVariants };
