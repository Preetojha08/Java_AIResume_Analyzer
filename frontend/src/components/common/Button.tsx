import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary-200',
  secondary:
    'bg-white text-primary-700 border border-primary-100 hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-100',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-200',
  danger:
    'bg-rose-600 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rose-200',
};

const sizeStyles: Record<Size, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', loading = false, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150',
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && 'opacity-70 pointer-events-none',
          className,
        )}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
