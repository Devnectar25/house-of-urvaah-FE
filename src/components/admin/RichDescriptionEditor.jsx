import React, { useState, useRef, useCallback } from 'react';
import { AlignLeft, List, Eye, Code, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';
import RichTextRenderer from '../common/RichTextRenderer';

export default function RichDescriptionEditor({
  value = '',
  onChange,
  placeholder = 'Comprehensive product story, artisan detailing, styling ideas, and garment drape overview...',
  title = 'OVERVIEW DESCRIPTION & DETAILS',
  badgeText = 'STANDARD SECTION',
  rows = 6,
  id = 'fullDescription',
}) {
  const textareaRef = useRef(null);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'

  /**
   * Helper to insert or wrap text at the current cursor/selection
   */
  const insertFormatting = useCallback((formatType) => {
    const textarea = textareaRef.current;
    const currentVal = value || '';

    // Switch to edit tab if currently in preview
    if (activeTab !== 'edit') {
      setActiveTab('edit');
    }

    if (!textarea) {
      // Fallback if textarea ref is not mounted yet
      let snippet = '';
      if (formatType === 'h2') snippet = '\n<h2>Section Heading</h2>\n';
      else if (formatType === 'h3') snippet = '\n<h3>Subheading Title</h3>\n';
      else if (formatType === 'p') snippet = '\n<p>Enter paragraph text here...</p>\n';
      else if (formatType === 'bold') snippet = '<strong>bold text</strong>';
      else if (formatType === 'list') snippet = '\n<ul>\n  <li>Feature or artisan detail</li>\n  <li>Premium fabric & silhouette</li>\n</ul>\n';
      onChange?.(currentVal + snippet);
      return;
    }

    const start = textarea.selectionStart ?? currentVal.length;
    const end = textarea.selectionEnd ?? currentVal.length;
    const selectedText = currentVal.substring(start, end);

    let replacement = '';
    let newCursorStart = start;
    let newCursorEnd = start;

    switch (formatType) {
      case 'h2': {
        const text = selectedText || 'Section Heading';
        replacement = `\n<h2>${text}</h2>\n`;
        newCursorStart = start + (selectedText ? replacement.length : 5);
        newCursorEnd = start + (selectedText ? replacement.length : 5 + text.length);
        break;
      }
      case 'h3': {
        const text = selectedText || 'Subheading Title';
        replacement = `\n<h3>${text}</h3>\n`;
        newCursorStart = start + (selectedText ? replacement.length : 5);
        newCursorEnd = start + (selectedText ? replacement.length : 5 + text.length);
        break;
      }
      case 'p': {
        const text = selectedText || 'Enter paragraph story, artisan detailing, or styling overview...';
        replacement = `\n<p>${text}</p>\n`;
        newCursorStart = start + (selectedText ? replacement.length : 4);
        newCursorEnd = start + (selectedText ? replacement.length : 4 + text.length);
        break;
      }
      case 'bold': {
        const text = selectedText || 'bold text';
        replacement = `<strong>${text}</strong>`;
        newCursorStart = start + (selectedText ? replacement.length : 8);
        newCursorEnd = start + (selectedText ? replacement.length : 8 + text.length);
        break;
      }
      case 'list': {
        if (selectedText) {
          const lines = selectedText
            .split('\n')
            .map(l => l.replace(/^[-*•]\s*/, '').trim())
            .filter(Boolean);

          if (lines.length > 0) {
            replacement = `\n<ul>\n${lines.map(l => `  <li>${l}</li>`).join('\n')}\n</ul>\n`;
          } else {
            replacement = `\n<ul>\n  <li>${selectedText.trim()}</li>\n</ul>\n`;
          }
          newCursorStart = start + replacement.length;
          newCursorEnd = start + replacement.length;
        } else {
          replacement = '\n<ul>\n  <li>Artisanal hand-finished detailing and tailored seams</li>\n  <li>Crafted from breathable, premium luxury fabric</li>\n  <li>Designed for versatile day-to-evening occasion styling</li>\n</ul>\n';
          newCursorStart = start + replacement.length;
          newCursorEnd = start + replacement.length;
        }
        break;
      }
      default:
        return;
    }

    const updatedValue = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange?.(updatedValue);

    // Re-focus and set selection
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    });
  }, [value, onChange, activeTab]);

  return (
    <div className="space-y-2">
      {/* 1. Header Bar with Blue Icon, Title, and Standard Section Badge */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-0.5">
        <div className="flex items-center gap-2">
          {/* Blue outlined document lines icon matching design */}
          <div className="w-5 h-5 rounded flex items-center justify-center border border-blue-600 bg-white text-blue-600 shrink-0 shadow-2xs">
            <svg
              className="w-3.5 h-3.5 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="7" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-[#002b66] tracking-wide uppercase">
            {title}
          </span>
        </div>

        {badgeText && (
          <span className="px-2.5 py-0.5 rounded border border-blue-200 bg-blue-50/70 text-blue-600 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            {badgeText}
          </span>
        )}
      </div>

      {/* 2. Editor Container with Toolbar and Input/Preview Area */}
      <div className="rounded-xl border border-neutral-200/90 bg-white overflow-hidden shadow-2xs transition-all focus-within:border-brand-dark focus-within:ring-1 focus-within:ring-brand-dark/20">
        {/* Toolbar matching exact screenshot specifications */}
        <div className="bg-neutral-50/90 border-b border-neutral-200/80 px-2.5 sm:px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left formatting buttons */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            {/* H2 Button */}
            <button
              type="button"
              data-no-hover="true"
              onClick={() => insertFormatting('h2')}
              title="Add Heading 2 (<h2>)"
              className="no-global-hover px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200/90 bg-white text-neutral-800 text-xs sm:text-sm font-bold shadow-2xs hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-pointer active:scale-95"
            >
              H2
            </button>

            {/* H3 Button */}
            <button
              type="button"
              data-no-hover="true"
              onClick={() => insertFormatting('h3')}
              title="Add Heading 3 (<h3>)"
              className="no-global-hover px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200/90 bg-white text-neutral-800 text-xs sm:text-sm font-bold shadow-2xs hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-pointer active:scale-95"
            >
              H3
            </button>

            {/* Paragraph Button (Highlighted with blue background & AlignLeft icon as shown in reference) */}
            <button
              type="button"
              data-no-hover="true"
              onClick={() => insertFormatting('p')}
              title="Add Paragraph (<p>)"
              className="no-global-hover px-2.5 sm:px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/90 text-blue-700 text-xs sm:text-sm font-bold shadow-2xs hover:bg-blue-100/80 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <AlignLeft className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Paragraph</span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-neutral-200/80 mx-0.5 sm:mx-1 hidden xs:block" />

            {/* Bold (B) Button */}
            <button
              type="button"
              data-no-hover="true"
              onClick={() => insertFormatting('bold')}
              title="Bold text (<strong>)"
              className="no-global-hover px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200/90 bg-white text-neutral-900 text-xs sm:text-sm font-black shadow-2xs hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-pointer active:scale-95"
            >
              B
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-neutral-200/80 mx-0.5 sm:mx-1 hidden xs:block" />

            {/* Bullet List Button with List icon */}
            <button
              type="button"
              data-no-hover="true"
              onClick={() => insertFormatting('list')}
              title="Bullet List (<ul><li>)"
              className="no-global-hover px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200/90 bg-white text-neutral-800 text-xs sm:text-sm font-semibold shadow-2xs hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <List className="w-3.5 h-3.5 stroke-[2.4] text-neutral-700" />
              <span>Bullet List</span>
            </button>
          </div>

          {/* Right toggle between Edit and Live Preview */}
          <div className="flex items-center gap-1 bg-neutral-200/60 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              data-no-hover="true"
              onClick={() => setActiveTab('edit')}
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs ${
                activeTab === 'edit'
                  ? 'bg-white text-brand-dark shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              data-no-hover="true"
              onClick={() => setActiveTab('preview')}
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'edit' ? (
          <div>
            <textarea
              id={id}
              ref={textareaRef}
              rows={rows}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              className="w-full p-3.5 text-xs sm:text-sm font-sans text-brand-dark bg-white focus:outline-none transition-all resize-y leading-relaxed"
            />
            {/* Quick helper footer */}
            <div className="px-3.5 py-2 bg-neutral-50/60 border-t border-neutral-100 flex flex-wrap items-center justify-between text-[11px] text-neutral-500 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Select text and click <strong className="font-semibold text-neutral-700">H2</strong>, <strong className="font-semibold text-neutral-700">H3</strong>, <strong className="font-semibold text-neutral-700">Paragraph</strong>, or <strong className="font-semibold text-neutral-700">Bullet List</strong> to apply styles.
              </span>
              <span className="tabular-nums font-mono text-[10px] text-neutral-400">
                {value ? value.length : 0} chars
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 bg-neutral-50/40 min-h-[160px] max-h-[360px] overflow-y-auto">
            <div className="mb-3 pb-2 border-b border-neutral-200/60 flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Live Customer Website Preview
              </span>
              <span className="text-[10px] text-neutral-400 bg-white px-2 py-0.5 rounded border border-neutral-200">
                Styled Accordion Output
              </span>
            </div>

            {value && value.trim() ? (
              <RichTextRenderer content={value} />
            ) : (
              <div className="text-xs text-neutral-400 italic py-4 text-center">
                No description added yet. Switch to Editor tab or click the toolbar buttons above to add headings, paragraphs, and bullet points.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
