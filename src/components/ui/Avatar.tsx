import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// =============================================================================
// AVATAR VARIANTS
// =============================================================================

const avatarVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center',
    'rounded-full font-medium',
    'bg-brand-harbor text-white',
  ],
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-caption',
        sm: 'w-8 h-8 text-body-sm',
        md: 'w-10 h-10 text-body',
        lg: 'w-12 h-12 text-body-lg',
        xl: 'w-16 h-16 text-h3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// =============================================================================
// AVATAR COMPONENT
// =============================================================================

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  initials?: string;
  alt?: string;
  className?: string;
}

export function Avatar({
  src,
  initials,
  alt,
  size,
  className,
}: AvatarProps): React.ReactElement {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={cn(avatarVariants({ size }), 'object-cover', className)}
      />
    );
  }

  return (
    <span className={cn(avatarVariants({ size, className }))}>
      {initials || '?'}
    </span>
  );
}

// Export variants
export { avatarVariants };
