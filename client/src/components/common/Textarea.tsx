import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border bg-surface-100/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-surface-border hover:border-slate-700'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-400 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
