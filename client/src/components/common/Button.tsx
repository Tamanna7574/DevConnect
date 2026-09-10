import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm font-semibold gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-brand-600 hover:bg-brand-500 text-white font-medium border border-brand-500/50 shadow-sm focus:ring-brand-500 active:bg-brand-700',
    secondary:
      'bg-surface-50 hover:bg-surface-border text-slate-100 border border-surface-border focus:ring-slate-500',
    outline:
      'border border-surface-border hover:border-slate-500 bg-transparent text-slate-200 hover:bg-surface-50/50 focus:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-surface-50 text-slate-300 hover:text-white focus:ring-slate-400',
    danger:
      'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/50 shadow-sm focus:ring-rose-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
