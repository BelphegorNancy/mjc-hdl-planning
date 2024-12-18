import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    type = 'button',
    ...props
  }, ref) => {
    const variants = {
      primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border-2 border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center font-medium transition-colors',
          'rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="absolute left-3 h-4 w-4 animate-spin" />
        )}
        <span className={cn(
          'inline-flex items-center gap-2',
          isLoading && 'opacity-0'
        )}>
          {leftIcon && <span className="h-4 w-4">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="h-4 w-4">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;