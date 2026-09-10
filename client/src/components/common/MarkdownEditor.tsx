import React, { useState } from 'react';
import { Bold, Italic, Code, Link2, List, Heading, Eye, Edit3, Terminal } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  minHeight?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  label,
  error,
  placeholder = 'Write your technical blog in Markdown...',
  minHeight = 'min-h-[350px]',
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  const insertSnippet = (before: string, after = '') => {
    const textarea = document.getElementById('markdown-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'text';
    const replacement = `${before}${selectedText}${after}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        {label && <label className="block text-xs font-medium text-slate-300">{label}</label>}
        {/* Tab switcher */}
        <div className="flex items-center bg-surface-100 rounded-lg p-0.5 border border-surface-border">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'write'
                ? 'bg-surface-50 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-surface-50 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>

      <div
        className={`rounded-2xl border bg-surface-100/80 overflow-hidden transition-all duration-200 ${
          error ? 'border-rose-500/80' : 'border-surface-border'
        }`}
      >
        {mode === 'write' && (
          <>
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-surface-border bg-surface-200/50">
              <button
                type="button"
                onClick={() => insertSnippet('**', '**')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('*', '*')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('### ')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition-colors"
                title="Heading"
              >
                <Heading className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('`', '`')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition-colors"
                title="Inline Code"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('```typescript\n', '\n```')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition-colors"
                title="Code Block"
              >
                <Terminal className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('[', '](https://)')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition-colors"
                title="Link"
              >
                <Link2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('- ')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-50 transition-colors"
                title="List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <textarea
              id="markdown-editor-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full p-4 bg-transparent text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none resize-y ${minHeight}`}
            />
          </>
        )}

        {mode === 'preview' && (
          <div className={`p-6 overflow-y-auto ${minHeight}`}>
            {value.trim() ? (
              <MarkdownViewer content={value} />
            ) : (
              <p className="text-xs text-slate-500 italic">No markdown content to preview yet.</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
};
