/**
 * printHelper.js - Reliable isolated document printing utility.
 * Creates a clean hidden iframe with all current page stylesheets copied over,
 * preventing body scroll locks, fixed overlays, and max-height clipping from breaking print layouts.
 */

export const printElement = (element, options = {}) => {
  const {
    title = 'Print Document',
    pageStyle = '',
    onComplete = null
  } = options;

  if (!element || typeof document === 'undefined') {
    if (typeof window !== 'undefined') window.print();
    return;
  }

  try {
    // 1. Gather all stylesheet links and style tags from current document
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    // 2. Create isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.name = `print_frame_${Date.now()}`;
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
      window.print();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
          ${styleTags}
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            ${pageStyle}
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    const executePrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print():', err);
        window.print();
      } finally {
        if (typeof onComplete === 'function') {
          onComplete();
        }
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    };

    // Allow browser 250ms to parse copied styles, images, and fonts before triggering dialog
    setTimeout(executePrint, 250);
  } catch (err) {
    console.error('printElement error, using fallback:', err);
    window.print();
  }
};
