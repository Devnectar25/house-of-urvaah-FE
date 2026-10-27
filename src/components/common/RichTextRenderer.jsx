import React, { useMemo } from 'react';

/**
 * Strips potentially dangerous tags and attributes from HTML strings
 * without external heavy dependencies.
 */
function sanitizeHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  let clean = rawHtml;

  // Remove script and iframe tags and their contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  clean = clean.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');

  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href="#"');

  return clean;
}

/**
 * Checks if a string contains HTML tags
 */
function hasHtmlTags(text) {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

const BLOCK_TAG = '(?:h[1-6]|p|ul|ol|li|div|blockquote|table|thead|tbody|tr|td|th|hr)';
// Inline wrappers the editor may put around a block (e.g. <strong><h3>..</h3></strong>)
const INLINE_TAG = '(?:strong|b|em|i|u|span)';
const NEWLINE_BEFORE_BLOCK = new RegExp(`\\s*\\n\\s*(?=(?:<${INLINE_TAG}\\b[^>]*>\\s*)*<\\/?${BLOCK_TAG}\\b)`, 'gi');
const NEWLINE_AFTER_BLOCK = new RegExp(`(<\\/?${BLOCK_TAG}\\b[^>]*>(?:\\s*<\\/${INLINE_TAG}>)*)\\s*\\n\\s*`, 'gi');
// Whitespace between a block tag and an inline wrapper tag right next to it is layout only
const SPACE_BLOCK_THEN_INLINE = new RegExp(`(<\\/?${BLOCK_TAG}\\b[^>]*>)\\s+(?=<\\/?${INLINE_TAG}\\b)`, 'gi');
const SPACE_INLINE_THEN_BLOCK = new RegExp(`(<\\/?${INLINE_TAG}\\b[^>]*>)\\s+(?=<\\/?${BLOCK_TAG}\\b)`, 'gi');

/**
 * The description editor stores text with line breaks mixed with HTML tags. HTML collapses line
 * breaks, so blank lines the admin typed between text (gaps between sections) disappeared. Keep
 * them as <br />. Breaks touching a block tag (heading, list, paragraph) are only source layout,
 * since those tags get their own spacing from CSS, so they are dropped.
 */
function preserveLineBreaks(html) {
  return html
    .replace(/\r\n?/g, '\n')
    .replace(SPACE_BLOCK_THEN_INLINE, '$1')
    .replace(SPACE_INLINE_THEN_BLOCK, '$1')
    .replace(NEWLINE_BEFORE_BLOCK, '')
    .replace(NEWLINE_AFTER_BLOCK, '$1')
    .replace(/\n{3,}/g, '\n\n') // at most one empty line between text
    .replace(/\n/g, '<br />');
}

/**
 * Converts simple markdown formatting (##, ###, *, -) to HTML if plain text with markdown is entered
 */
function markdownToHtml(md) {
  if (!md) return '';

  const lines = md.split(/\r?\n/);
  const result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h2>${line.replace(/^##\s+/, '')}</h2>`);
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h3>${line.replace(/^###\s+/, '')}</h3>`);
    }
    // Bullet list items
    else if (/^[-*•]\s+/.test(line)) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      const itemContent = line.replace(/^[-*•]\s+/, '');
      result.push(`  <li>${itemContent}</li>`);
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      const quoteText = line.replace(/^>\s*/, '');
      result.push(`<blockquote>${quoteText}</blockquote>`);
    }
    // Standard paragraph line
    else {
      if (inList) { result.push('</ul>'); inList = false; }
      // Formatting inside paragraph: bold, italic, underline
      let formatted = line
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>');
      result.push(`<p>${formatted}</p>`);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

/**
 * RichTextRenderer:
 * Renders HTML formatted or markdown product stories and descriptions
 * with store luxury typography, fallback handling, and sanitization.
 */
export default function RichTextRenderer({ content, className = '', fallback = '' }) {
  const renderedHtml = useMemo(() => {
    const raw = (content && String(content).trim()) || fallback || '';
    if (!raw) return '';

    if (hasHtmlTags(raw)) {
      return preserveLineBreaks(sanitizeHtml(raw));
    }

    // If it has markdown headings or bullet points, convert to structured HTML
    if (/^#{2,3}\s+|[-*•]\s+/m.test(raw)) {
      return markdownToHtml(raw);
    }

    // Otherwise standard plain text: wrap in paragraphs for consistent spacing
    return raw
      .split(/\n{2,}/)
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
      .join('');
  }, [content, fallback]);

  if (!renderedHtml) {
    return null;
  }

  return (
    <div
      className={`rich-description-content text-neutral-600 font-sans leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
