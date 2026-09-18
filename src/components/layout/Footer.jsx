import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ChevronDown } from 'lucide-react';
import { Logo } from '../common/Logo';

export const Footer = () => {
  const [openSections, setOpenSections] = useState({
    help: false,
    company: false,
    policies: false,
    connect: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <footer className="bg-white text-brand-dark border-t border-neutral-300 pt-12 sm:pt-16 pb-12 px-4 sm:px-10 md:px-12 lg:px-16 font-serif w-full">
      <div className="max-w-[1800px] mx-auto">
        {/* 5-Column Grid Layout: Logo Block (Left) + 4 Link Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 mb-12 sm:mb-16">
          {/* Column 1: LOGO & BRAND TAGLINE */}
          <div className="flex flex-col items-start pr-0 lg:pr-6 pb-4 sm:pb-0 border-b sm:border-b-0 border-neutral-200">
            <Logo className="h-12 sm:h-18 md:h-20 lg:h-24" />
            <p className="text-[10px] sm:text-[11px] md:text-xs tracking-[0.25em] text-neutral-400 uppercase mt-3 sm:mt-5 font-serif leading-relaxed">
              PARIS — NEW YORK — MUMBAI — TOKYO
            </p>
          </div>

          {/* Column 2: HELP & SUPPORT */}
          <div className="border-b sm:border-b-0 border-neutral-200 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('help')}
              className="w-full flex justify-between items-center text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark mb-2 sm:mb-5 cursor-pointer sm:cursor-default"
            >
              <span>HELP & SUPPORT</span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 sm:hidden transition-transform duration-200 ${openSections.help ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-3 text-xs tracking-wider text-neutral-500 uppercase ${openSections.help ? 'block pt-2 pb-1' : 'hidden sm:block'}`}>
              <li><Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} className="hover:text-black transition-colors block py-1">Contact Us</Link></li>
              <li><a href="#track" className="hover:text-black transition-colors block py-1">Track Order</a></li>
              <li><a href="#returns" className="hover:text-black transition-colors block py-1">Returns & Exchanges</a></li>
              <li><a href="#shipping" className="hover:text-black transition-colors block py-1">Shipping Information</a></li>
              <li><a href="#size-guide" className="hover:text-black transition-colors block py-1">Size Guide</a></li>
              <li><a href="#faqs" className="hover:text-black transition-colors block py-1">FAQs</a></li>
            </ul>
          </div>

          {/* Column 3: COMPANY */}
          <div className="border-b sm:border-b-0 border-neutral-200 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('company')}
              className="w-full flex justify-between items-center text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark mb-2 sm:mb-5 cursor-pointer sm:cursor-default"
            >
              <span>COMPANY</span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 sm:hidden transition-transform duration-200 ${openSections.company ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-3 text-xs tracking-wider text-neutral-500 uppercase ${openSections.company ? 'block pt-2 pb-1' : 'hidden sm:block'}`}>
              <li><Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} className="hover:text-black transition-colors block py-1">About Us</Link></li>
              <li><a href="#sustainability" className="hover:text-black transition-colors block py-1">Join Life / Sustainability</a></li>
              <li><a href="#careers" className="hover:text-black transition-colors block py-1">Careers</a></li>
              <li><a href="#stores" className="hover:text-black transition-colors block py-1">Store Locator</a></li>
              <li><a href="#press" className="hover:text-black transition-colors block py-1">Press Room</a></li>
            </ul>
          </div>

          {/* Column 4: POLICIES */}
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
              <li><a href="#privacy" className="hover:text-black transition-colors block py-1">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-black transition-colors block py-1">Terms of Purchase</a></li>
              <li><a href="#cookies" className="hover:text-black transition-colors block py-1">Cookie Settings</a></li>
              <li><a href="#accessibility" className="hover:text-black transition-colors block py-1">Accessibility</a></li>
            </ul>
          </div>

          {/* Column 5: CONNECT & LOCATION */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection('connect')}
              className="w-full flex justify-between items-center text-xs font-semibold tracking-[0.2em] uppercase text-brand-dark mb-2 sm:mb-5 cursor-pointer sm:cursor-default"
            >
              <span>CONNECT</span>
              <ChevronDown className={`w-4 h-4 text-neutral-500 sm:hidden transition-transform duration-200 ${openSections.connect ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-4 ${openSections.connect ? 'block pt-2' : 'hidden sm:block'}`}>
              <div className="flex items-center gap-3 sm:gap-4 text-neutral-700 mb-6">
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
                  href="https://facebook.com/houseofurvaah" 
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
                  href="https://pinterest.com/houseofurvaah" 
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
                  href="https://tiktok.com/@houseofurvaah" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="TikTok" 
                  className="hover:text-black hover:bg-neutral-200 transition-colors p-2.5 min-w-[44px] min-h-[44px] bg-neutral-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.38a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.64a6.34 6.34 0 0 0 10.82 4.5 6.27 6.27 0 0 0 1.83-4.5V9.03a8.16 8.16 0 0 0 4.94 1.64V7.21a4.85 4.85 0 0 1-1-.52z"/>
                  </svg>
                </a>
              </div>

              <h5 className="text-[10px] tracking-widest uppercase text-neutral-400 font-semibold mb-2">
                COUNTRY / REGION
              </h5>
              <div className="inline-flex items-center gap-2 border border-neutral-300 px-3 py-2.5 min-h-[44px] text-xs font-medium tracking-wider cursor-pointer hover:border-black transition-colors">
                <Globe className="w-3.5 h-3.5" />
                <span>INDIA (INR ₹)</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-8 border-t border-neutral-300 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] sm:text-[11px] text-neutral-400 tracking-widest uppercase text-center md:text-left">
          <p>© 2026 HOUSE OF URAAH. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <span>SITEMAP</span>
            <span>PRIVACY STATEMENT</span>
            <span>TERMS & CONDITIONS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
