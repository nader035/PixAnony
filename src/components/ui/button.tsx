import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-bg shadow-[0_14px_34px_rgba(44,40,58,0.16)] hover:bg-primary-glow',
  secondary: 'border-transparent bg-surface text-text hover:bg-card-hover',
  ghost: 'border-transparent bg-transparent text-text-muted hover:bg-card-hover hover:text-text',
  outline: 'border-primary/25 bg-primary/5 text-primary hover:bg-primary/10',
  danger: 'border-transparent bg-red text-white hover:brightness-95',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-full px-3 text-sm',
  md: 'h-11 rounded-full px-4 text-sm',
  lg: 'h-12 rounded-full px-5 text-base',
  icon: 'h-10 w-10 rounded-full p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, leftIcon, rightIcon, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 border font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
        sizes[size],
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  ),
);

Button.displayName = 'Button';
