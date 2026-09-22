# House of Urvaah - Frontend Application

> **Luxury Female Apparel & Fashion E-Commerce**  
> Built with React 19, Vite, Tailwind CSS, and Framer Motion.

---

## 🌟 Overview
This repository contains the client-facing Single-Page Application (SPA) for **House of Urvaah**. The application delivers a high-fashion shopping experience with full-bleed hero videos, editorial lookbooks, curated collections, interactive cart drawers, and responsive layouts across mobile and desktop.

For full full-stack system architecture, refer to the [Root Project Documentation](../PROJECT_DOCUMENTATION.md).

---

## 🛠️ Technology Stack
- **Framework:** [React 19](https://react.dev/) (`^19.2.8`)
- **Build System:** [Vite](https://vitejs.dev/) (`^7.x`)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (`^3.4.17`), PostCSS, Autoprefixer
- **Animations:** [Framer Motion](https://www.framer.com/motion/) (`^13.2.0`)
- **Icons:** [Lucide React](https://lucide.dev/) (`^1.40.0`)
- **Routing:** [React Router DOM](https://reactrouter.com/) (`^7.18.3`)
- **Cloud Media CDN:** Supabase Storage (`@supabase/supabase-js`)

---

## 📁 Directory Structure
```text
src/
├── main.jsx              # React app entry point
├── App.jsx               # Master route configuration & shell layout
├── App.css / index.css   # Global typography & design system tokens
├── lib/
│   └── supabase.js       # CDN URL constructor for media
├── pages/
│   ├── Home.jsx          # Luxury homepage experience
│   ├── ProductDetail.jsx # Garment details, sizes, and galleries
│   ├── AboutUs.jsx       # Brand heritage and craftsmanship
│   └── ContactUs.jsx     # Client concierge and store details
├── components/
│   ├── common/           # Shared UI elements (Logo, Buttons, Modals)
│   ├── layout/           # Header, Navbar, MobileMenu, Footer
│   └── home/             # Hero, Parallax, BestSellers, Editorial blocks
├── data/
│   └── mockProducts.js   # Initial luxury catalog & media lookbooks
└── services/             # Backend API interaction services
```

---

## 🔒 Locked Sections Registry
Certain sections have been approved and marked as **PERFECT** by the client and must not be edited or restyled:
- **Header & Navbar (Desktop + Mobile)**
- **Side Navbar & Drawer**
- **Best Sellers Section (All 4 garment cards)**

See [`LOCKED_SECTIONS.md`](./LOCKED_SECTIONS.md) for details.

---

## ⚙️ Environment Configuration
Create a `.env` file in the root of `house-of-urvaah-FE`:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000

# Supabase Storage & CDN
VITE_SUPABASE_PROJECT_REF=fhbdceauisvlcpmuzpmf
VITE_SUPABASE_URL=https://fhbdceauisvlcpmuzpmf.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_STORAGE_BUCKET=houseofurvaah-media
VITE_SUPABASE_CDN_URL=https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media
```

---

## 🚀 Getting Started

```powershell
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```
Application runs at: `http://localhost:5173`
