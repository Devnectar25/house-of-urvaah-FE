import { useEffect, useRef } from 'react';

// Reference counter tracking how many active modals/drawers currently request body scroll lock
let activeLocksCount = 0;
let initialBodyPaddingRight = '';
let initialHtmlOverflow = '';
let initialHtmlHeight = '';
let initialBodyOverflow = '';
let initialBodyHeight = '';

export const forceUnlockScroll = () => {
  activeLocksCount = 0;
  if (typeof document !== 'undefined') {
    document.body.removeAttribute('data-modal-open');
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.documentElement.style.overscrollBehavior = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.overscrollBehavior = '';
    document.body.style.paddingRight = '';

    const adminScrollEl =
      document.getElementById('admin-content-scroll') ||
      document.querySelector('[data-admin-scroll="true"]') ||
      document.querySelector('.admin-panel-container .overflow-y-auto');
    if (adminScrollEl) {
      adminScrollEl.style.overflow = '';
    }
  }
};

/**
 * useModalScrollLock - Robust reference-counted scroll lock for modals, drawers & lightboxes.
 * Prevents race conditions and permanently stuck scrolls when multiple components open/close.
 *
 * @param {boolean} isOpen - Whether the modal/overlay is currently active.
 * @param {Function} [onClose] - Optional callback when user presses Escape key.
 */
export const useModalScrollLock = (isOpen, onClose) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    if (activeLocksCount === 0) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      document.body.setAttribute('data-modal-open', 'true');

      initialHtmlOverflow = document.documentElement.style.overflow || '';
      initialHtmlHeight = document.documentElement.style.height || '';
      initialBodyOverflow = document.body.style.overflow || '';
      initialBodyHeight = document.body.style.height || '';
      initialBodyPaddingRight = document.body.style.paddingRight || '';

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.overscrollBehavior = 'none';

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      const adminScrollEl =
        document.getElementById('admin-content-scroll') ||
        document.querySelector('[data-admin-scroll="true"]') ||
        document.querySelector('.admin-panel-container .overflow-y-auto');
      if (adminScrollEl) {
        adminScrollEl.style.overflow = 'hidden';
      }
    }

    activeLocksCount++;

    // ESC key listener
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onCloseRef.current === 'function') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      activeLocksCount = Math.max(0, activeLocksCount - 1);

      if (activeLocksCount === 0) {
        document.body.removeAttribute('data-modal-open');
        document.documentElement.style.overflow = initialHtmlOverflow;
        document.documentElement.style.height = initialHtmlHeight;
        document.documentElement.style.overscrollBehavior = '';
        document.body.style.overflow = initialBodyOverflow;
        document.body.style.height = initialBodyHeight;
        document.body.style.overscrollBehavior = '';
        document.body.style.paddingRight = initialBodyPaddingRight;

        const adminScrollEl =
          document.getElementById('admin-content-scroll') ||
          document.querySelector('[data-admin-scroll="true"]') ||
          document.querySelector('.admin-panel-container .overflow-y-auto');
        if (adminScrollEl) {
          adminScrollEl.style.overflow = '';
        }
      }
    };
  }, [isOpen]);
};

export default useModalScrollLock;
