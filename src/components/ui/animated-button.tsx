'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  glow?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-glow shadow-[0_14px_34px_rgba(124,58,237,0.2)] border border-transparent',
  secondary:
    'bg-card text-text border border-border hover:border-primary/25 hover:bg-card-hover',
  ghost:
    'bg-transparent text-text-muted hover:text-text hover:bg-card',
  danger:
    'bg-red text-white hover:brightness-95 shadow-lg border border-transparent',
  outline:
    'bg-primary/5 text-primary border border-primary/25 hover:bg-primary/10',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'h-10 w-10 rounded-xl flex items-center justify-center',
};

const glowStyles: Record<ButtonVariant, string> = {
  primary: 'shadow-[0_16px_42px_rgba(124,58,237,0.24)]',
  secondary: '',
  ghost: '',
  danger: 'shadow-[0_16px_42px_rgba(220,38,38,0.2)]',
  outline: 'shadow-[0_14px_34px_rgba(124,58,237,0.12)]',
};

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      glow = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled || isLoading ? {} : { scale: 1.01, y: -1 }}
        whileTap={disabled || isLoading ? {} : { scale: 0.98, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center font-medium',
          'transition-all duration-200 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          variantStyles[variant],
          sizeStyles[size],
          glow && glowStyles[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
            {children && <span className="ml-1.5">{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
