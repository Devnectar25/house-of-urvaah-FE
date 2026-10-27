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

// Safety net for storefront pages: third-party overlays (Razorpay checkout, SweetAlert) save and
// restore the page's overflow themselves and can put back a locked state after our modals have
// already unlocked, leaving the page frozen. When nothing is actually open, clear any leftover lock.
// Something on screen actually covers the page: a fixed layer (modal, drawer, menu, alert, payment
// window) that is visible and spans most of the viewport. A lock with nothing like this on screen
// is a leftover (e.g. a component that thinks its modal is open but renders nothing).
const isOverlayVisible = () => {
  if (document.querySelector('.swal2-container')) return true;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return [...document.body.querySelectorAll('*')].some((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width >= vw * 0.5 && r.height >= vh * 0.6;
  });
};
const isPageLocked = () => {
  const b = document.body.style;
  const h = document.documentElement.style;
  return b.overflow === 'hidden' || b.position === 'fixed' || h.overflow === 'hidden';
};
let watchdogTimer = null;
const checkStuckScroll = () => {
  watchdogTimer = null;
  if (window.location.pathname.startsWith('/admin')) return; // admin layout manages its own sidebar lock
  if (isPageLocked() && !isOverlayVisible()) {
    lockedScrollY = 0; // keep the current position, only remove the lock
    // eslint-disable-next-line no-use-before-define
    forceUnlockScroll();
  }
};
if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
  const schedule = () => {
    if (watchdogTimer) clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(checkStuckScroll, 400);
  };
  const startWatchdog = () => {
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    // one call per node: a second observe() on the same node replaces the first one's options
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], childList: true });
  };
  if (document.body) startWatchdog();
  else window.addEventListener('DOMContentLoaded', startWatchdog, { once: true });
}

export const forceUnlockScroll = (resetToTop = false) => {
  activeLocksCount = 0;
  escapeHandlersStack.length = 0;
  if (typeof document !== 'undefined') {
    const restoreY = resetToTop ? 0 : lockedScrollY;
    lockedScrollY = 0;
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

    if (resetToTop) {
      window.scrollTo(0, 0);
    } else if (restoreY) {
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

      // A page that is already locked (another overlay, payment window, alert) must never be
      // remembered as its "normal" state, or closing this modal would leave it frozen
      const unlocked = (v) => (v === 'hidden' || v === 'fixed' ? '' : v);
      initialHtmlOverflow = unlocked(document.documentElement.style.overflow || '');
      initialHtmlHeight = document.documentElement.style.height === '100%' ? '' : (document.documentElement.style.height || '');
      initialBodyOverflow = unlocked(document.body.style.overflow || '');
      initialBodyHeight = document.body.style.height === '100%' ? '' : (document.body.style.height || '');
      initialBodyPaddingRight = document.body.style.paddingRight || '';
      initialBodyPosition = unlocked(document.body.style.position || '');
      initialBodyTop = initialBodyPosition ? (document.body.style.top || '') : '';
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
