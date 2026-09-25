# House of Urvaah - Technical SEO Architecture & Guidelines

This document details the technical SEO implementation, guidelines, and roadmap for **House of Urvaah**.

---

## 1. Core Mandate & Visual Invariance Rule

> [!IMPORTANT]
> **INVIOLABLE RULE:** Technical SEO work must NEVER alter or modify the visual design, layout, color palette, typography, margins, spacing, or component structure of any page or section. 
> SEO operates strictly as an invisible metadata, structural markup, and technical indexability layer. 
> 
> **Locked Sections Constraint:**
> The following sections are marked **PERFECT** and strictly locked from visual or structural modifications:
> - Header (Mobile + Desktop) — Locked
> - Navbar (Mobile + Desktop) — Locked
> - Side Navbar (Mobile + Desktop) — Locked
> - Best Sellers Section (including all product cards) — Locked
> - "TRENDING ON THE GRAM" title & font lockups — Locked
> 
> If an SEO best practice ever requires a visible visual element (such as UI breadcrumb components on pages that lack them), implementation MUST stop and explicit confirmation must be requested from the user first.

---

## 2. Implemented Features & File Locations

### Phase 1: Meta Tags & Social Previews (Open Graph / Twitter Cards) — COMPLETED

| SEO Feature | Details | File Location(s) |
| :--- | :--- | :--- |
| **Headless SEO Component** | `SEOHead.jsx` — Dynamically injects `title`, `meta description`, `keywords`, `robots`, `<link rel="canonical">`, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`), and Twitter cards (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`). Returns `null` with 0 DOM/style footprint. | [`src/components/common/SEOHead.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/components/common/SEOHead.jsx) |
| **Home Page SEO** | Unique title (`House of Urvaah \| Official Online Store & Luxury Atelier`), targeted luxury meta description, keywords, Open Graph image. | [`src/pages/Home.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/Home.jsx) |
| **Product Detail Pages** | Dynamic title based on product name, custom product description, canonical link, category keywords, and **actual product image preview** for `og:image` and `twitter:image`. | [`src/pages/ProductDetail.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/ProductDetail.jsx) |
| **About Us Page** | Custom page title, editorial brand story meta description, Open Graph metadata. | [`src/pages/AboutUs.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/AboutUs.jsx) |
| **Contact Us Page** | Concierge support meta tags, unique title, contact keywords. | [`src/pages/ContactUs.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/ContactUs.jsx) |
| **My Account Page** | Dynamic account metadata with `noindex, nofollow` to protect user privacy & prevent indexing private pages. | [`src/pages/Account.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/Account.jsx) |
| **Legal & Policy Pages** | Custom titles and descriptions for Privacy Policy, Shipping Policy, Return & Refund Policy, Cookie Policy, Terms & Conditions. | [`src/pages/PrivacyPolicy.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/PrivacyPolicy.jsx), [`ShippingPolicy.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/ShippingPolicy.jsx), [`ReturnRefundPolicy.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/ReturnRefundPolicy.jsx), [`CookiePolicy.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/CookiePolicy.jsx), [`TermsAndConditions.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/pages/TermsAndConditions.jsx) |
| **Placeholder Routes** | Added `SEOHead` with `noindex` for stub routes (`/cart`, `/wishlist`). | [`src/App.jsx`](file:///c:/workspace/Urvaah%20latest/house-of-urvaah-FE/src/App.jsx) |

---

## 3. SEO Implementation Phase Checklist

### Phase 1: Meta Tags + Open Graph & Twitter Cards
- [x] Unique `<title>` per page
- [x] Unique `<meta name="description">` per page (150–160 chars)
- [x] `<meta name="keywords">` per page
- [x] Dynamic `<link rel="canonical">` per route
- [x] Full Open Graph support (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
- [x] Dynamic `og:image` using actual product image on Product Detail pages
- [x] Twitter Card meta tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- [x] Noindex protection on private pages (`/account`, `/cart`, `/wishlist`)

### Phase 2: Structured Data (Schema.org / JSON-LD) + Sitemap & Robots.txt
- [ ] Product Schema (JSON-LD) on Product Detail pages (`name`, `image`, `description`, `sku`, `brand`, `offers` with price, currency, availability)
- [ ] Organization Schema (JSON-LD) on Homepage (`name`, `logo`, `url`, `sameAs`)
- [ ] BreadcrumbList Schema (JSON-LD) on product and category routes
- [ ] `sitemap.xml` listing all public routes and products
- [ ] `robots.txt` allowing public crawling and disallowing `/account`, `/cart`, `/checkout`

### Phase 3: Semantic HTML, Alt Text Audit & Performance SEO
- [ ] Audit and ensure single `<h1>` per page with logical `<h2>`/`<h3>` hierarchy without changing CSS styles
- [ ] Descriptive `alt` attributes for all product and editorial images
- [ ] Lazy loading (`loading="lazy"`) for images below the fold
- [ ] Mobile viewport & Core Web Vitals performance review

---
