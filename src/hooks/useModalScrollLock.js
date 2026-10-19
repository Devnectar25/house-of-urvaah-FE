import { useEffect, useRef } from 'react';

// Reference counter tracking how many active modals/drawers currently request body scroll lock
let activeLocksCount = 0;
let initialBodyPaddingRight = '';
let initialHtmlOverflow = '';
let initialHtmlHeight = '';
let initialBodyOverflow = '';
let initialBodyHeight = '';
let initialBodyPosition = '';
let initialBodyTop = '';
let initialBodyLeft = '';
let initialBodyRight = '';
let initialBodyWidth = '';
let lockedScrollY = 0;

// Global stack for Escape key handlers to ensure only the topmost modal closes on ESC
const escapeHandlersStack = [];

if (typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && escapeHandlersStack.length > 0) {
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        const topHandler = escapeHandlersStack[escapeHandlersStack.length - 1];
        if (typeof topHandler === 'function') {
          topHandler(e);
        }
      }
    },
    true
  );
}

export const forceUnlockScroll = () => {
  activeLocksCount = 0;
  escapeHandlersStack.length = 0;
  if (typeof document !== 'undefined') {
    const restoreY = lockedScrollY;
    document.body.removeAttribute('data-modal-open');
    document.documentElement.removeAttribute('data-modal-open');
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.documentElement.style.overscrollBehavior = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.overscrollBehavior = '';
    document.body.style.paddingRight = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';

    const adminScrollEl =
      document.getElementById('admin-content-scroll') ||
      document.querySelector('[data-admin-scroll="true"]') ||
      document.querySelector('.admin-panel-container .overflow-y-auto');
    if (adminScrollEl) {
      adminScrollEl.style.overflow = '';
    }

    if (restoreY) {
      window.scrollTo(0, restoreY);
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
      lockedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      document.body.setAttribute('data-modal-open', 'true');
      document.documentElement.setAttribute('data-modal-open', 'true');

      initialHtmlOverflow = document.documentElement.style.overflow || '';
      initialHtmlHeight = document.documentElement.style.height || '';
      initialBodyOverflow = document.body.style.overflow || '';
      initialBodyHeight = document.body.style.height || '';
      initialBodyPaddingRight = document.body.style.paddingRight || '';
      initialBodyPosition = document.body.style.position || '';
      initialBodyTop = document.body.style.top || '';
      initialBodyLeft = document.body.style.left || '';
      initialBodyRight = document.body.style.right || '';
      initialBodyWidth = document.body.style.width || '';

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.documentElement.style.overscrollBehavior = 'none';

      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.overscrollBehavior = 'none';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';

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

    // Prevent background wheel and touch scrolling when target has no scroll room
    const handleActiveWheelOrTouch = (e) => {
      let target = e.target;
      let canScroll = false;

      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;

        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          if (e.deltaY) {
            const isScrollingDown = e.deltaY > 0;
            const isScrollingUp = e.deltaY < 0;
            const atTop = target.scrollTop <= 0;
            const atBottom = Math.ceil(target.scrollTop + target.clientHeight) >= target.scrollHeight;

            if ((isScrollingDown && !atBottom) || (isScrollingUp && !atTop)) {
              canScroll = true;
              break;
            }
          } else {
            canScroll = true;
            break;
          }
        }
        target = target.parentElement;
      }

      if (!canScroll) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleActiveWheelOrTouch, { passive: false });
    window.addEventListener('touchmove', handleActiveWheelOrTouch, { passive: false });

    // Register this modal's close handler to the top of the ESC key stack
    const currentCloseHandler = () => {
      if (typeof onCloseRef.current === 'function') {
        onCloseRef.current();
      }
    };
    escapeHandlersStack.push(currentCloseHandler);

    return () => {
      window.removeEventListener('wheel', handleActiveWheelOrTouch);
      window.removeEventListener('touchmove', handleActiveWheelOrTouch);

      // Pop/remove this modal's handler from the ESC stack
      const stackIndex = escapeHandlersStack.lastIndexOf(currentCloseHandler);
      if (stackIndex !== -1) {
        escapeHandlersStack.splice(stackIndex, 1);
      }

      activeLocksCount = Math.max(0, activeLocksCount - 1);

      if (activeLocksCount === 0) {
        const restoreY = lockedScrollY;
        document.body.removeAttribute('data-modal-open');
        document.documentElement.removeAttribute('data-modal-open');
        document.documentElement.style.overflow = initialHtmlOverflow;
        document.documentElement.style.height = initialHtmlHeight;
        document.documentElement.style.overscrollBehavior = '';
        document.body.style.overflow = initialBodyOverflow;
        document.body.style.height = initialBodyHeight;
        document.body.style.overscrollBehavior = '';
        document.body.style.paddingRight = initialBodyPaddingRight;
        document.body.style.position = initialBodyPosition;
        document.body.style.top = initialBodyTop;
        document.body.style.left = initialBodyLeft;
        document.body.style.right = initialBodyRight;
        document.body.style.width = initialBodyWidth;

        const adminScrollEl =
          document.getElementById('admin-content-scroll') ||
          document.querySelector('[data-admin-scroll="true"]') ||
          document.querySelector('.admin-panel-container .overflow-y-auto');
        if (adminScrollEl) {
          adminScrollEl.style.overflow = '';
        }

        window.scrollTo(0, restoreY);
      }
    };
  }, [isOpen]);
};

export default useModalScrollLock;
