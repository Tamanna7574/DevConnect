import React from 'react';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
    '2xl': 'w-24 h-24 text-2xl font-bold',
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-slate-700/80 shadow-inner ${sizeStyles[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-tr from-brand-700 to-indigo-500 text-white flex items-center justify-center border border-indigo-400/30 shadow-md ${sizeStyles[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
