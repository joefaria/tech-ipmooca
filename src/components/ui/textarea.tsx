import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  charCount?: number;
  maxChars?: number;
}

export function Textarea({ charCount, maxChars = 500, className = '', ...props }: TextareaProps) {
  const nearLimit = charCount !== undefined && charCount > maxChars * 0.8;

  return (
    <div className="relative">
      <textarea
        className={`w-full min-h-[120px] px-4 py-3 rounded-2xl border border-gray-200
          bg-gray-50 text-gray-900 text-base resize-none outline-none
          focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100
          placeholder:text-gray-400 transition-all duration-150 ${className}`}
        maxLength={maxChars}
        {...props}
      />
      {charCount !== undefined && (
        <span className={`absolute bottom-3 right-4 text-xs tabular-nums transition-colors
          ${nearLimit ? 'text-amber-500' : 'text-gray-400'}`}>
          {maxChars - charCount}
        </span>
      )}
    </div>
  );
}
