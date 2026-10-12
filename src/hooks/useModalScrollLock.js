import { useEffect } from 'react';

/**
 * useModalScrollLock - Completely and bulletproofly prevents background page scrolling
 * when a modal, overlay, drawer, or lightbox is active.
 *
 * It locks:
 * 1. `document.documentElement.style.overflow = 'hidden'` (the root HTML element)
 * 2. `document.body.style.overflow = 'hidden'` (the document body)
 * 3. `overscrollBehavior = 'none'` on both html and body
 * 4. Layout shift compensation via scrollbar width padding
 * 5. AdminLayout content scroll container (#admin-content-scroll) if inside Admin portal
 * 6. Active non-passive wheel & touchmove event listeners that intercept wheel/touch events:
 *    - Allows internal scrolling ONLY on elements that actually have scrollable content room.
 *    - Disallows/cancels wheel events if the target has nowhere to scroll, completely preventing
 *      scroll chaining / background scrolling.
 * 7. Optional ESC key close listener.
 *
 * @param {boolean} isOpen - Whether the modal/overlay is open.
 * @param {Function} [onClose] - Optional callback to invoke when the Escape key is pressed.
 */
export const useModalScrollLock = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    // 1. Lock document.documentElement and document.body
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 2. Lock AdminLayout inner scroll container (#admin-content-scroll or data-admin-scroll="true")
    const adminScrollEl =
      document.getElementById('admin-content-scroll') ||
      document.querySelector('[data-admin-scroll="true"]') ||
      document.querySelector('.admin-panel-container .overflow-y-auto');

    let prevAdminOverflow = '';
    if (adminScrollEl) {
      prevAdminOverflow = adminScrollEl.style.overflow;
      adminScrollEl.style.overflow = 'hidden';
    }

    // 3. Active wheel & touchmove listener to block background scroll bleeding
    const handleActiveWheel = (e) => {
      let target = e.target;
      let canScroll = false;

      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;

        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          const isScrollingDown = e.deltaY > 0;
          const isScrollingUp = e.deltaY < 0;
          const atTop = target.scrollTop <= 0;
          const atBottom = Math.ceil(target.scrollTop + target.clientHeight) >= target.scrollHeight;

          if ((isScrollingDown && !atBottom) || (isScrollingUp && !atTop)) {
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

    const handleActiveTouchMove = (e) => {
      let target = e.target;
      let canScroll = false;

      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;

        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          canScroll = true;
          break;
        }
        target = target.parentElement;
      }

      if (!canScroll) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleActiveWheel, { passive: false });
    window.addEventListener('touchmove', handleActiveTouchMove, { passive: false });

    // 4. Optional ESC key dismiss listener
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 5. Restore original state upon cleanup
    return () => {
      window.removeEventListener('wheel', handleActiveWheel);
      window.removeEventListener('touchmove', handleActiveTouchMove);
      window.removeEventListener('keydown', handleKeyDown);

      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.body.style.paddingRight = prevBodyPaddingRight;

      if (adminScrollEl) {
        adminScrollEl.style.overflow = prevAdminOverflow;
      }
    };
  }, [isOpen, onClose]);
};

export default useModalScrollLock;
