import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ArrowRight,
  Check
} from 'lucide-react';
import { Logo } from '../common/Logo';

export const Footer = () => {
  const [openSections, setOpenSections] = useState({
    quickLinks: false,
    policies: false,
    connect: false,
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@') || !newsletterEmail.includes('.')) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address.');
      return;
    }
    setNewsletterStatus('success');
    setNewsletterEmail('');
    setNewsletterMessage('');
    setTimeout(() => setNewsletterStatus('idle'), 4000);
  };

  return (
    <footer id="footer" className="bg-white text-brand-dark border-t border-neutral-300 pt-8 sm:pt-10 pb-4 sm:pb-6 px-4 sm:px-8 md:px-10 lg:px-12 font-serif w-full">
      <div className="max-w-[1320px] mx-auto">
        {/* 4-Column Grid Layout: Logo Block (Left) + 3 Link Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 xl:gap-10 mb-5 sm:mb-6">
          {/* Column 1: LOGO & BRAND TAGLINE */}
          <div className="lg:col-span-4 flex flex-col items-start pr-0 lg:pr-6 pb-4 sm:pb-0 border-b sm:border-b-0 border-neutral-200" data-allow-guest="true">
            <Link to="/" data-allow-guest="true">
              <Logo className="h-12 sm:h-18 md:h-20 lg:h-24" />
            </Link>
            <p className="text-[10px] sm:text-[11px] md:text-xs tracking-[0.25em] text-neutral-400 uppercase mt-3 sm:mt-5 font-serif leading-relaxed">
              PARIS — NEW YORK — MUMBAI — TOKYO
            </p>
          </div>

          {/* Column 2: QUICK LINKS */}
          <div className="lg:col-span-2 border-b sm:border-b-0 border-neutral-200 pb-4 sm:pb-0">
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
          <div className="lg:col-span-3 border-b sm:border-b-0 border-neutral-200 pb-4 sm:pb-0">
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
              <li><Link to="/terms-and-conditions" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Terms and Conditions</Link></li>
              <li><Link to="/cookie-policy" data-allow-guest="true" className="hover:text-black transition-colors block py-1">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: CONNECT & LOCATION */}
          <div className="lg:col-span-3">
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

              </div>

              {/* Newsletter Subscription */}
              <div className="pt-2">
                <h5 className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900 mb-2">
                  NEWSLETTER
                </h5>
                <p className="text-xs text-neutral-600 leading-relaxed font-normal mb-3.5">
                  Subscribe for atelier updates, private sales & runway invitations.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="relative flex items-center bg-[#FAF8F3] hover:bg-white border border-neutral-300 hover:border-neutral-400 focus-within:border-neutral-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-neutral-900/10 rounded-full transition-all duration-300 shadow-2xs group">
                    <input
                      type="email"
                      placeholder="ENTER YOUR EMAIL"
                      value={newsletterEmail}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterStatus === 'error') setNewsletterStatus('idle');
                      }}
                      className="w-full bg-transparent text-xs tracking-wider uppercase outline-none py-3 pl-4 pr-12 placeholder:text-neutral-400 font-medium text-neutral-900 min-h-[46px]"
                      aria-label="Newsletter email address"
                    />
                    <button
                      type="submit"
                      aria-label="Subscribe to newsletter"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>

                  {newsletterStatus === 'error' && (
                    <p className="text-xs text-rose-600 font-medium tracking-wide px-2">
                      {newsletterMessage}
                    </p>
                  )}

                  {newsletterStatus === 'success' && (
                    <div className="p-2.5 bg-neutral-900 text-white text-xs tracking-wider uppercase font-medium flex items-center gap-2 rounded-full px-3.5 shadow-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                      <span>Thank you for subscribing</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Attribution */}
        <div className="pt-3 sm:pt-4 border-t border-neutral-300 w-full flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-neutral-400 tracking-widest uppercase">
          <span>© 2026 HOUSE OF URVAAH. ALL RIGHTS RESERVED.</span>
          <span className="hidden sm:inline text-neutral-300">|</span>
          <span>
            POWERED BY{' '}
            <a
              href="https://devnectar.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-black font-semibold transition-colors underline decoration-neutral-300 underline-offset-2 hover:decoration-black"
            >
              DEVNECTAR
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};
