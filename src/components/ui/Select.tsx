import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

// =============================================================================
// SELECT COMPONENT
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-9 px-3 pr-8 text-body-sm',
  md: 'h-11 px-4 pr-10 text-body',
  lg: 'h-14 px-5 pr-12 text-body-lg',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      label,
      error,
      hint,
      placeholder,
      size = 'md',
      id,
      ...props
    },
    ref
  ) => {
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

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full appearance-none cursor-pointer',
              'bg-cport-blue/20 text-white',
              'border rounded-lg',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2',
              hasError
                ? 'border-danger-400 focus:border-danger-400 focus:ring-danger-400/20'
                : 'border-cport-gray focus:border-info-400 focus:ring-info-400/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              sizeClasses[size],
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cport-gray">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
