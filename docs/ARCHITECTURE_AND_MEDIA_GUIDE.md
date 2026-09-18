# House of Urvaah - Architecture & Media Handling Guide

This document outlines the technical architecture, media handling strategies, Git workflow, and future backend integration roadmap for the **House of Urvaah** frontend application.

---

## 1. Git Setup & Authentication

### Git Configuration
* **User Name:** `Devnectar25`
* **User Email:** `devnectar25@gmail.com`
* **Repository Remote:** `https://github.com/Devnectar25/house-of-urvaah-FE.git`

### Authentication Methods
Git operations over HTTPS authenticate separately from commit author configs:
1. **Browser Authentication (Recommended):**
   * Clear old credentials: `git credential-manager erase`
   * Run `git push origin main` -> Select **"Sign in with your browser"** -> Authenticate with the `Devnectar25` GitHub account.
2. **Personal Access Token (PAT):**
   * Generate token on GitHub under **Settings > Developer Settings > Personal Access Tokens (Classic)** with the **`repo`** scope checked.
   * Save token in Windows Credential Manager under `git:https://github.com`.
3. **SSH Key Alternative:**
   * Generate SSH key: `ssh-keygen -t ed25519 -C "devnectar25@gmail.com"`
   * Add key to GitHub account and set remote URL: `git remote set-url origin git@github.com:Devnectar25/house-of-urvaah-FE.git`.

---

## 2. Media Handling Architecture

### Current Setup (Mock / Frontend Development)
During early frontend development, media paths are defined locally and converted dynamically:
* **Local Media Directory:** `public/assets/Images/` and `public/assets/video/`
* **Mock Product Catalog:** [`src/data/mockProducts.js`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/data/mockProducts.js)
* **Supabase Media Helper:** [`src/lib/supabase.js`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/lib/supabase.js) constructs public CDN URLs pointing to `https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media/`.

---

### Production Target Architecture (Backend Integration)

Once the backend service is integrated, the system operates under a clear separation of concerns:

```
┌─────────────────┐       1. GET /api/products       ┌──────────────────┐
│                 │ ───────────────────────────────> │                  │
│    Frontend     │                                  │  Backend Server  │
│  (React / Vite) │ <─────────────────────────────── │  (Node / Express)│
│                 │   2. Returns Product JSON List   └────────┬─────────┘
└────────┬────────┘   (including full image_url)              │
         │                                                    │ 3. Database Query
         │ 4. <img src={product.image_url} />                 ▼
         │                                           ┌──────────────────┐
         └─────────────────────────────────────────> │ Supabase Storage │
              5. Direct Image Download (CDN)         │   (PostgreSQL)   │
                                                     └──────────────────┘
```

#### Responsibilities:
* **Backend Responsibilities:**
  * Handles admin authentication and file uploads (`POST /api/admin/products`).
  * Interacts with Supabase database & storage using private service keys.
  * Stores public image URLs in PostgreSQL.
  * Exposes API endpoints (`GET /api/products`) returning product metadata along with complete `image_url` fields.
* **Frontend Responsibilities:**
  * Fetches product JSON from the Backend API (`GET /api/products`).
  * Directly renders media from the returned `image_url` without manual path manipulation:
    ```jsx
    <img src={product.image_url} alt={product.name} />
    ```
* **Supabase CDN Responsibilities:**
  * Serves static images and videos globally over HTTPS for maximum download speed and caching.

---

## 3. HD Image & Video Optimization Strategy

For a luxury e-commerce brand like **House of Urvaah**, maintaining high-definition visual clarity is essential.

### Optimization Techniques

1. **Supabase On-The-Fly Image Transformations:**
   * **Catalog Grid (Small Cards):** Request resized HD images to save bandwidth:
     `https://.../houseofurvaah-media/Images/Blue02.png?width=800&quality=85`
   * **Product Detail Page (Full HD / Zoom):** Request full resolution:
     `https://.../houseofurvaah-media/Images/Blue02.png?width=2000&quality=95`

2. **Format Conversion (WebP / AVIF):**
   * Convert raw PNG files to WebP format.
   * WebP preserves 100% of HD sharpness while reducing file size by 70–80% (e.g., shrinking a 7MB PNG down to 300KB).

3. **Browser Caching & Lazy Loading:**
   * Use native lazy loading for images below the fold: `<img src={url} loading="lazy" />`.
   * Small catalog sizes benefit heavily from browser caching; after the first visit, page navigation occurs with near 0ms image load latency.

4. **Background Video Optimization:**
   * Compress hero background videos (H.264 / MP4) to under 5MB.
   * Set lightweight attributes: `<video autoPlay loop muted playsInline preload="metadata" />`.

---

## 4. Next Steps & Backend Integration Checklist

- [ ] Connect Backend API endpoints (`GET /api/products`, `GET /api/categories`, `GET /api/banners`).
- [ ] Replace `src/data/mockProducts.js` with API fetch hooks (e.g., React Query / Axios).
- [ ] Remove hardcoded path helpers in `src/lib/supabase.js`.
- [ ] Implement Admin file upload flow on the Backend service.
