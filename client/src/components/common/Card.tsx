import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border border-surface-border bg-surface-200 p-5 transition-all duration-150 ${
        hoverEffect ? 'hover:border-slate-600 hover:bg-surface-100/60' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
