# Frontend Changelog & Summary of Changes

## Overview
This document outlines all recent changes implemented across the frontend codebase (`house-of-urvaah-FE`), consolidated and merged into `main` via PR #90 (Merge commit `9e3727b`).

---

## 1. Product Detail Page (PDP)
- **File**: `src/pages/ProductDetail.jsx`
- **Change**: Product description accordion (`Product Details & Description`) is now open and visible by default upon page load (`useState(true)` instead of `false`).
- **Impact**: Customers immediately see full product dimensions, materials, care instructions, and specifications without needing to manually toggle open the description accordion.

---

## 2. Checkout & Payment Failure Handling
- **File**: `src/pages/Checkout.jsx`
- **Changes**:
  - Implemented Razorpay payment failure handling: when a payment fails, is canceled by the user, or dismisses without authorization, it calls `/api/payments/failure` with the order ID and payment failure details.
  - Stopped failed/aborted transactions from progressing into order confirmation.
  - Redirects user or displays an error banner with a retry payment option rather than false "Order Confirmed" success screens.
- **Impact**: Prevents phantom/unpaid orders from showing as confirmed to customers and syncing as confirmed in admin order tracking.

---

## 3. Product Cards & Quick View Modal
- **Files**: `src/components/common/ProductCard.jsx`, `src/components/common/QuickViewModal.jsx`
- **Changes**:
  - Resolved merge conflicts cleanly between master and feature branches.
  - Added support for out-of-stock badges, stock alert triggers, and dynamic color/size variations.
  - Integrated cart drawer notification when items are added from quick-view or product card.

---

## 4. Admin Management Additions
- **File**: `src/pages/admin/AdminNewsletter.jsx` (New)
  - Dedicated admin interface for managing newsletter subscribers, exporting contact lists, and monitoring delivery.
- **File**: `src/pages/admin/AdminErrorMonitoring.jsx` (New)
  - Comprehensive dashboard for frontend error tracking and telemetry logs.
- **File**: `src/pages/admin/AdminOrders.jsx`
  - Integrated invoice generation and download triggers, order item tracking, and refund status syncing.
- **File**: `src/components/common/InvoiceModal.jsx` (New)
  - Modal component allowing admins and users to preview, format, and download GST-compliant order invoices directly.
- **File**: `src/pages/admin/modify-ui/AdminTrendingGram.jsx`
  - Enhanced UI customization editor for managing trending Instagram reels and posts.

---

## 5. Error Tracking & Utilities
- **File**: `src/services/errorTracker.js` (New)
  - Centralized frontend client-side error reporter that logs unhandled exceptions and React component errors to the backend error logging endpoint.
- **File**: `src/components/common/ErrorBoundary.jsx` (New)
  - Graceful fallback UI for uncaught runtime errors preventing full-page whiteout.
- **File**: `src/utils/emailValidator.js` (New)
  - Strict RFC-compliant email syntax validation helper with disposable domain filtering.

---

## 6. Build & CI/CD Stability
- **Build Verification**: Executed `npm run build` using Vite v8.3.0.
  - Transformed 2,437 modules successfully.
  - Zero syntax or unresolved module errors.
  - Output generated cleanly in `dist/`.
