import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AlignLeft, List, Eye, Code, Sparkles, RotateCcw, Italic, Underline, Quote, Type } from 'lucide-react';
import RichTextRenderer from '../common/RichTextRenderer';

/**
 * RichDescriptionEditor:
 * A visual WYSIWYG editor for luxury product descriptions.
 * - In Visual Mode: users type and format text directly without seeing raw HTML tags (<p>, <h2>, <strong>, etc.)
 * - In HTML Code Mode: users can view and tweak the raw HTML source
 * - In Preview Mode: live storefront customer accordion preview
 * - Plain Text button: cleanly strips all HTML tags to revert to clean plain text with one click
 */
export default function RichDescriptionEditor({
  value = '',
  onChange,
  placeholder = 'Comprehensive product story, artisan detailing, styling ideas, and garment drape overview...',
  title = 'OVERVIEW DESCRIPTION & DETAILS',
  badgeText = 'RICH EDITOR',
  rows = 6,
  id = 'fullDescription',
}) {
  const visualEditorRef = useRef(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'code' | 'preview'

  // Formatting active states for toolbar feedback
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h2: false,
    h3: false,
    list: false,
    quote: false,
  });

  // Decode HTML entities if text was previously stored with &lt; &gt;
  const normalizedValue = useMemo(() => {
    if (!value || typeof value !== 'string') return '';
    if (/&lt;(?:h[1-6]|p|ul|ol|li|strong|b|em|i|u|span|blockquote|div)[\s\S]*&gt;/i.test(value)) {
      try {
        const doc = new DOMParser().parseFromString(value, 'text/html');
        return doc.documentElement.textContent || value;
      } catch (e) {
        return value;
      }
    }
    return value;
  }, [value]);

  // Sync external value changes into the contentEditable element
  useEffect(() => {
    if (activeTab === 'visual' && visualEditorRef.current && !isTypingRef.current) {
      const currentHtml = visualEditorRef.current.innerHTML;
      if (currentHtml !== normalizedValue) {
        visualEditorRef.current.innerHTML = normalizedValue;
      }
    }
  }, [normalizedValue, activeTab]);

  // Query formatting state under the cursor
  const updateActiveFormats = useCallback(() => {
    try {
      const isBold = document.queryCommandState('bold');
      const isItalic = document.queryCommandState('italic');
      const isUnderline = document.queryCommandState('underline');
      const isList = document.queryCommandState('insertUnorderedList');
      const block = (document.queryCommandValue('formatBlock') || '').toLowerCase();

      setActiveFormats({
        bold: Boolean(isBold),
        italic: Boolean(isItalic),
        underline: Boolean(isUnderline),
        list: Boolean(isList),
        h2: block.includes('h2'),
        h3: block.includes('h3'),
        quote: block.includes('blockquote'),
      });
    } catch (e) {
      // Ignored if queryCommandState is unavailable
    }
  }, []);

  // Handle user typing inside the visual editor
  const handleVisualInput = useCallback(() => {
    if (!visualEditorRef.current) return;
    isTypingRef.current = true;
    let html = visualEditorRef.current.innerHTML;
    const textContent = (visualEditorRef.current.textContent || '').trim();

    // Reset when empty so placeholder displays
    if (!textContent && (!html || html === '<br>' || html === '<p><br></p>' || html === '<div><br></div>')) {
      html = '';
      visualEditorRef.current.innerHTML = '';
    }

    onChange?.(html);
    updateActiveFormats();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 150);
  }, [onChange, updateActiveFormats]);

  // Execute standard editor commands
  const executeCommand = useCallback((command, val = null) => {
    if (activeTab !== 'visual') {
      setActiveTab('visual');
    }
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    try {
      document.execCommand(command, false, val);
    } catch (e) {
      console.warn('execCommand failed:', e);
    }
    handleVisualInput();
  }, [activeTab, handleVisualInput]);

  // Block formatting (H2, H3, P, Blockquote)
  const formatBlock = useCallback((tagName) => {
    if (activeTab !== 'visual') {
      setActiveTab('visual');
    }
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    try {
      document.execCommand('formatBlock', false, `<${tagName}>`);
    } catch (e) {
      try {
        document.execCommand('formatBlock', false, tagName);
      } catch (err) {
        console.warn('formatBlock failed:', err);
      }
    }
    handleVisualInput();
  }, [activeTab, handleVisualInput]);

  // Toggle Heading 2 or Heading 3
  const toggleHeading = useCallback((level) => {
    const isCurrent = level === 'h2' ? activeFormats.h2 : activeFormats.h3;
    if (isCurrent) {
      formatBlock('p');
    } else {
      formatBlock(level);
    }
  }, [activeFormats, formatBlock]);

  // Toggle Semibold font weight
  const toggleSemibold = useCallback(() => {
    if (activeTab !== 'visual') setActiveTab('visual');
    if (visualEditorRef.current) visualEditorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    let parent = selection.anchorNode;
    while (parent && parent !== visualEditorRef.current) {
      if (parent.nodeType === 1 && (parent.classList?.contains('semibold') || parent.style?.fontWeight === '600')) {
        const text = parent.innerText || parent.textContent;
        const textNode = document.createTextNode(text);
        parent.parentNode.replaceChild(textNode, parent);
        handleVisualInput();
        return;
      }
      parent = parent.parentNode;
    }

    const span = document.createElement('span');
    span.className = 'semibold';
    span.style.fontWeight = '600';
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
    } catch (e) {
      document.execCommand('bold', false, null);
    }
    handleVisualInput();
  }, [activeTab, handleVisualInput]);

  // Toggle Uppercase on selected text
  const transformUppercase = useCallback(() => {
    if (activeTab !== 'visual') setActiveTab('visual');
    if (visualEditorRef.current) visualEditorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const selectedText = selection.toString();
    const isAllUpper = selectedText === selectedText.toUpperCase();
    const transformed = isAllUpper ? selectedText.toLowerCase() : selectedText.toUpperCase();
    try {
      document.execCommand('insertText', false, transformed);
    } catch (e) {
      // fallback
    }
    handleVisualInput();
  }, [activeTab, handleVisualInput]);

  // Toggle Bullet List
  const toggleBulletList = useCallback(() => {
    executeCommand('insertUnorderedList');
  }, [executeCommand]);

  // Toggle Quote
  const toggleQuote = useCallback(() => {
    if (activeFormats.quote) {
      formatBlock('p');
    } else {
      formatBlock('blockquote');
    }
  }, [activeFormats.quote, formatBlock]);

  // Clear all HTML tags and revert to clean plain text
  const clearFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      document.execCommand('removeFormat', false, null);
      handleVisualInput();
      return;
    }

    // Strip all HTML tags across the entire content
    const raw = value || (visualEditorRef.current ? visualEditorRef.current.innerHTML : '');
    const cleanText = raw
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    const paragraphs = cleanText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p}</p>`)
      .join('\n');

    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = paragraphs;
    }
    onChange?.(paragraphs);
  }, [value, handleVisualInput, onChange]);

  return (
    <div className="space-y-2">
      {/* 1. Header Bar with Blue Icon, Title, and Badge */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-0.5">
        <div className="flex items-center gap-2">
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

      {/* 2. Editor Container with Toolbar and Viewport */}
      <div className="rounded-xl border border-neutral-200/90 bg-white overflow-hidden shadow-2xs transition-all focus-within:border-brand-dark focus-within:ring-1 focus-within:ring-brand-dark/20">
        {/* Toolbar */}
        <div className="bg-neutral-50/90 border-b border-neutral-200/80 px-2.5 sm:px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left formatting buttons */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
            {/* H2 Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleHeading('h2')}
              title="Heading 2 (H2)"
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                activeFormats.h2
                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              H2
            </button>

            {/* H3 Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleHeading('h3')}
              title="Heading 3 (H3)"
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                activeFormats.h3
                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              H3
            </button>

            {/* Paragraph Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => formatBlock('p')}
              title="Standard Paragraph (<p>)"
              className="no-global-hover px-2 sm:px-2.5 py-1 rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
            >
              <AlignLeft className="w-3.5 h-3.5 stroke-[2]" />
              <span className="hidden xs:inline">Paragraph</span>
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-neutral-200 mx-0.5 hidden xs:block" />

            {/* Bold Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('bold')}
              title="Bold (Ctrl+B)"
              className={`no-global-hover px-2 py-1 rounded-md border text-xs font-black transition-all cursor-pointer ${
                activeFormats.bold
                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              B
            </button>

            {/* Semibold Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleSemibold}
              title="Semibold (font-weight 600)"
              className="no-global-hover px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 text-xs font-semibold transition-all cursor-pointer"
            >
              Semibold
            </button>

            {/* Italic Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('italic')}
              title="Italic (Ctrl+I)"
              className={`no-global-hover px-2 py-1 rounded-md border text-xs italic transition-all cursor-pointer flex items-center justify-center ${
                activeFormats.italic
                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('underline')}
              title="Underline (Ctrl+U)"
              className={`no-global-hover px-2 py-1 rounded-md border text-xs transition-all cursor-pointer flex items-center justify-center ${
                activeFormats.underline
                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Uppercase TT Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={transformUppercase}
              title="Uppercase Toggle"
              className="no-global-hover px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 text-[11px] font-bold tracking-wider transition-all cursor-pointer"
            >
              TT
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-neutral-200 mx-0.5 hidden xs:block" />

            {/* Bullet List Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleBulletList}
              title="Bullet List (•)"
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activeFormats.list
                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <List className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="hidden sm:inline">List</span>
            </button>

            {/* Quote Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleQuote}
              title="Quote / Callout"
              className={`no-global-hover px-2 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activeFormats.quote
                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quote</span>
            </button>

            {/* Plain Text Button */}
            <button
              type="button"
              data-no-hover="true"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearFormatting}
              title="Strip HTML tags & revert to clean plain text"
              className="no-global-hover px-2 py-1 rounded-md border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Plain Text</span>
            </button>
          </div>

          {/* Right tab switcher: Visual Editor | HTML Code | Live Preview */}
          <div className="flex items-center gap-1 bg-neutral-200/60 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              data-no-hover="true"
              onClick={() => setActiveTab('visual')}
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs ${
                activeTab === 'visual'
                  ? 'bg-white text-brand-dark shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Type className="w-3 h-3" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              data-no-hover="true"
              onClick={() => setActiveTab('code')}
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs ${
                activeTab === 'code'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>HTML</span>
            </button>
            <button
              type="button"
              data-no-hover="true"
              onClick={() => setActiveTab('preview')}
              className={`no-global-hover px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs ${
                activeTab === 'preview'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'visual' && (
          <div className="relative">
            <div
              id={id}
              ref={visualEditorRef}
              contentEditable={true}
              data-placeholder={placeholder}
              onInput={handleVisualInput}
              onKeyUp={updateActiveFormats}
              onMouseUp={updateActiveFormats}
              className="rich-description-content visual-editor w-full p-4 text-xs sm:text-sm font-sans text-brand-dark bg-white focus:outline-none transition-all leading-relaxed"
              spellCheck="true"
              style={{ outline: 'none' }}
            />
            {/* Quick helper footer */}
            <div className="px-3.5 py-2 bg-neutral-50/70 border-t border-neutral-100 flex flex-wrap items-center justify-between text-[11px] text-neutral-500 gap-2">
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <strong className="font-semibold text-neutral-700">Visual Mode:</strong> Clean formatted text. No HTML tags shown. Use toolbar or shortcuts (Ctrl+B, Ctrl+I).
              </span>
              <span className="tabular-nums font-mono text-[10px] text-neutral-400">
                {visualEditorRef.current ? (visualEditorRef.current.textContent || '').length : (value || '').replace(/<[^>]+>/g, '').length} chars
              </span>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div>
            <textarea
              id={`${id}-code`}
              rows={rows}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="HTML source code: <p>...</p>"
              className="w-full p-3.5 text-xs font-mono text-neutral-800 bg-neutral-50 focus:outline-none transition-all resize-y leading-relaxed"
            />
            <div className="px-3.5 py-2 bg-neutral-50/70 border-t border-neutral-100 flex flex-wrap items-center justify-between text-[11px] text-neutral-500 gap-2">
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <strong className="font-semibold text-neutral-700">HTML Source Mode:</strong> Directly inspect or edit raw HTML tags. Switch back to Visual mode at any time.
              </span>
              <span className="tabular-nums font-mono text-[10px] text-neutral-400">
                {(value || '').length} chars
              </span>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-4 sm:p-5 bg-neutral-50/40 min-h-[160px] max-h-[380px] overflow-y-auto">
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
              <div className="text-xs text-neutral-400 italic py-6 text-center">
                No description added yet. Switch to Visual Editor tab to start writing.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
