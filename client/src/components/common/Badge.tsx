import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'accent' | 'cyan' | 'slate' | 'rose' | 'amber';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    brand: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
    accent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    slate: 'bg-surface-50 text-slate-300 border-surface-border',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium tracking-wide',
    md: 'px-2.5 py-0.5 text-xs font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
