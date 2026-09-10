import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`prose prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 border-b border-surface-border pb-3 mt-8 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100 border-b border-surface-border/60 pb-2 mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-slate-200 mt-5 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm sm:text-base text-slate-300 space-y-1.5 mb-4 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm sm:text-base text-slate-300 space-y-1.5 mb-4 pl-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-slate-300">{children}</li>,
          a: ({ href, children }) => {
            const isSafe = href && (/^(https?:\/\/|\/|#|mailto:)/i.test(href));
            return (
              <a
                href={isSafe ? href : '#'}
                target={href && /^https?:\/\//i.test(href) ? '_blank' : undefined}
                rel="noreferrer noopener"
                className="text-brand-400 hover:text-brand-300 underline underline-offset-4 transition-colors"
              >
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-500/80 bg-brand-500/5 px-4 py-2 my-4 rounded-r-xl text-slate-300 italic text-sm">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="rounded-md bg-surface-50 px-1.5 py-0.5 font-mono text-xs text-brand-300 border border-slate-700/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative my-4 rounded-xl border border-surface-border bg-surface-300/90 overflow-hidden font-mono text-xs">
                {match && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-100/50 text-[11px] text-slate-400 font-mono">
                    <span>{match[1]}</span>
                  </div>
                )}
                <div className="p-4 overflow-x-auto text-slate-200">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </div>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-surface-border">
              <table className="min-w-full divide-y divide-surface-border text-left text-xs sm:text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-surface-100 px-4 py-2.5 font-semibold text-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-slate-300 border-t border-surface-border/40">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
