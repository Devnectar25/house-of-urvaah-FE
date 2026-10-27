import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  MapPin,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { apiClient } from '../../lib/apiClient';

let cachedPrimaryBoutique = null;
let cachedConcierge = null;

export const Footer = () => {
  const [openSections, setOpenSections] = useState({
    quickLinks: false,
    policies: false,
    connect: false,
  });

  const [primaryBoutique, setPrimaryBoutique] = useState(() => cachedPrimaryBoutique || {
    name: 'House of Urvaah',
    address: 'Mumbai, Maharashtra 400070'
  });

  const [concierge, setConcierge] = useState(() => cachedConcierge || {
    email: 'houseofurvaah@gmail.com',
    phone: '+91 98333 25657',
    hours: 'Monday – Saturday: 10:00 AM – 8:00 PM IST'
  });

  useEffect(() => {
    let isMounted = true;
    apiClient('/api/ui/contact-info')
      .then((res) => {
        if (isMounted && res?.success) {
          if (res.data?.primary_location) {
            const prim = res.data.primary_location;
            const formatted = {
              name: prim.name || 'House of Urvaah',
              address: prim.address || 'Mumbai, Maharashtra 400070'
            };
            cachedPrimaryBoutique = formatted;
            setPrimaryBoutique(formatted);
          }
          if (res.data?.concierge) {
            cachedConcierge = res.data.concierge;
            setConcierge(res.data.concierge);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <footer id="footer" className="bg-white text-brand-dark border-t border-neutral-300 pt-8 sm:pt-10 pb-4 sm:pb-6 px-4 sm:px-8 md:px-10 lg:px-12 font-serif w-full">
      <div className="max-w-[1320px] mx-auto">
        {/* 4-Column Balanced Grid Layout: Logo Block (Left) + 3 Link Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8 lg:gap-8 xl:gap-12 mb-5 sm:mb-6">
          {/* Column 1: LOGO & STORE ADDRESS */}
          <div className="flex flex-col items-center sm:items-start pb-4 sm:pb-0 border-b sm:border-b-0 border-neutral-200" data-allow-guest="true">
            <div className="inline-flex flex-col items-center text-center">
              <Link to="/" data-allow-guest="true" className="inline-flex justify-center -mt-4 sm:-mt-6 lg:-mt-8">
                <Logo className="h-12 sm:h-18 md:h-20 lg:h-24" />
              </Link>
              <div className="mt-2 sm:mt-3 text-neutral-500 text-xs font-sans leading-relaxed tracking-wide text-center">
                <p className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.2em] text-neutral-800 font-semibold mb-1 text-center">
                  VISIT US
                </p>
                <p className="text-center">{primaryBoutique.name?.startsWith('House of') ? primaryBoutique.name : `House of Urvaah • ${primaryBoutique.name}`}</p>
                <p className="whitespace-pre-line text-neutral-600 text-center">
                  {primaryBoutique.address ? primaryBoutique.address
                    .replace(/Eastern winds[\s\S]*?(Mumbai\s*400070|Mumbai\s*-\s*400070)/i, 'Mumbai, Maharashtra 400070')
                    .replace('Mumbai - 400070', 'Mumbai, Maharashtra 400070')
                    .replace('Kala Ghoda Arts District, Colaba Causeway', 'Kala Ghoda Arts District,\nColaba Causeway') : 'Mumbai, Maharashtra 400070'}
                </p>
                <div className="pt-2.5 flex justify-center">
                  <a 
                    href="https://maps.app.goo.gl/2DLR7CdZKmvpQWVq8"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Google Map"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-300 hover:border-black text-[10px] uppercase tracking-widest font-semibold text-neutral-800 hover:text-black transition-all hover:bg-neutral-50 shadow-2xs group cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-neutral-500 group-hover:text-black transition-colors" />
                    <span>View on Google Map</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: QUICK LINKS */}
          <div className="border-b sm:border-b-0 border-neutral-200 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('quickLinks')}
              className="w-full flex justify-between items-center text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark mb-2 sm:mb-5 cursor-pointer sm:cursor-default"
            >
              <span>QUICK LINKS</span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 sm:hidden transition-transform duration-200 ${openSections.quickLinks ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-3 text-xs tracking-wider text-neutral-500 uppercase ${openSections.quickLinks ? 'block pt-2 pb-1' : 'hidden sm:block'}`}>
              <li><Link to="/" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Home</Link></li>
              <li><Link to="/contact" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Contact Us</Link></li>
              <li><Link to="/about" data-allow-guest="true" className="hover:text-black transition-colors block py-1">About Us</Link></li>
              <li><Link to="/sitemap" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Sitemap</Link></li>
              <li><Link to="/faqs" data-allow-guest="true" className="hover:text-black transition-colors block py-1">FAQs</Link></li>
            </ul>
          </div>

          {/* Column 3: POLICIES */}
          <div className="border-b sm:border-b-0 border-neutral-200 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('policies')}
              className="w-full flex justify-between items-center text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark mb-2 sm:mb-5 cursor-pointer sm:cursor-default"
            >
              <span>POLICIES</span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 sm:hidden transition-transform duration-200 ${openSections.policies ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-3 text-xs tracking-wider text-neutral-500 uppercase ${openSections.policies ? 'block pt-2 pb-1' : 'hidden sm:block'}`}>
              <li><Link to="/privacy-policy" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Privacy Policy</Link></li>
              <li><Link to="/shipping-policy" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Shipping &amp; Delivery</Link></li>
              <li><Link to="/return-refund-policy" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Returns &amp; Refunds</Link></li>
              <li><Link to="/terms-and-conditions" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Terms and Conditions</Link></li>
              <li><Link to="/cookie-policy" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: CONNECT */}
          <div className="pb-4 sm:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('connect')}
              className="w-full flex justify-between items-center text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark mb-2 sm:mb-5 cursor-pointer sm:cursor-default"
            >
              <span>CONNECT</span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 sm:hidden transition-transform duration-200 ${openSections.connect ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-4 ${openSections.connect ? 'block pt-2' : 'hidden sm:block'}`}>
              {/* Social Media Links */}
              <div className="flex items-center gap-3 sm:gap-4 text-neutral-700">
                <a 
                  href="https://instagram.com/houseofurvaah" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Instagram" 
                  className="hover:text-black hover:bg-neutral-200 transition-colors p-2.5 min-w-[44px] min-h-[44px] bg-neutral-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.facebook.com/profile.php?id=61590208292411" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Facebook" 
                  className="hover:text-black hover:bg-neutral-200 transition-colors p-2.5 min-w-[44px] min-h-[44px] bg-neutral-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
                  </svg>
                </a>
                <a 
                  href="https://in.pinterest.com/houseofurvaah/?actingBusinessId=1146518155045603369" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Pinterest" 
                  className="hover:text-black hover:bg-neutral-200 transition-colors p-2.5 min-w-[44px] min-h-[44px] bg-neutral-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12C24 5.372 18.627 0 12 0z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/Houseofurvaah" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="X (Twitter)" 
                  className="hover:text-black hover:bg-neutral-200 transition-colors p-2.5 min-w-[44px] min-h-[44px] bg-neutral-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>

              {/* Client Concierge / Customer Care Details */}
              <div className="pt-3.5 border-t border-neutral-200 font-sans">
                <p className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.2em] text-neutral-800 font-semibold mb-2">
                  CLIENT CONCIERGE
                </p>
                <div className="space-y-2 text-xs text-neutral-600">
                  <a
                    href={`mailto:${concierge.email || 'houseofurvaah@gmail.com'}`}
                    className="flex items-center gap-2 hover:text-black transition-colors group"
                  >
                    <Mail className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors shrink-0" />
                    <span className="truncate">{concierge.email || 'houseofurvaah@gmail.com'}</span>
                  </a>
                  <a
                    href={`https://wa.me/${(concierge.phone || '919833325657').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-black transition-colors group"
                  >
                    <Phone className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors shrink-0" />
                    <span>{concierge.phone || '+91 98333 25657'}</span>
                  </a>
                  <div className="flex items-start gap-2 text-[11px] text-neutral-400 pt-0.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{concierge.hours || 'Mon – Sat: 10:00 AM – 8:00 PM IST'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Attribution */}
        <div className="pt-3 sm:pt-4 border-t border-neutral-300 w-full flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-neutral-400 tracking-widest uppercase">
          <span>© 2026 HOUSE OF URVAAH. ALL RIGHTS RESERVED.</span>
          <span className="hidden sm:inline text-neutral-300">|</span>
          <span>
            DESIGN AND DEVELOPED BY{' '}
            <a
              href="https://devnectar.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-black font-semibold transition-colors underline decoration-neutral-300 underline-offset-2 hover:decoration-black normal-case"
            >
              devNectar
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};
