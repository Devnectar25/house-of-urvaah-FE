import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  Info,
  Map,
  ShoppingBag,
  Sparkles,
  Shield,
  User,
  ArrowRight
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';

export const Sitemap = () => {
  const sections = [
    {
      title: 'Quick Links',
      icon: Sparkles,
      links: [
        { name: 'Home', path: '/' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'About Us', path: '/about' },
        { name: 'Frequently Asked Questions (FAQs)', path: '/faqs' },
        { name: 'Sitemap', path: '/sitemap' },
      ],
    },
    {
      title: 'Women’s Collections',
      icon: ShoppingBag,
      links: [
        { name: 'New In Collection', path: '/new-in' },
        { name: 'Luxury Dresses', path: '/dresses' },
        { name: 'Corset & Structured Tops', path: '/tops' },
        { name: 'Fine Knitwear', path: '/knitwear' },
        { name: 'Architectural Outerwear', path: '/outerwear' },
        { name: 'Tailored Trousers', path: '/trousers' },
        { name: 'Designer Shoes', path: '/shoes' },
        { name: 'Atelier Accessories', path: '/accessories' },
        { name: 'Curated Sale', path: '/sale' },
      ],
    },
    {
      title: 'Client Concierge & Care',
      icon: PhoneCall,
      links: [
        { name: 'Contact Concierge', path: '/contact' },
        { name: 'Order Tracking & History', path: '/account' },
        { name: 'Size & Fit Atelier Guide', path: '/faqs' },
        { name: 'Urvaah Bot AI Stylist', path: '/contact' },
      ],
    },
    {
      title: 'Client Account & Bag',
      icon: User,
      links: [
        { name: 'My Atelier Account', path: '/account' },
        { name: 'Private Wishlist', path: '/wishlist' },
        { name: 'Shopping Bag', path: '/cart' },
        { name: 'Express Checkout', path: '/checkout' },
      ],
    },
    {
      title: 'Legal, Compliance & Policies',
      icon: Shield,
      links: [
        { name: 'Privacy Policy', path: '/privacy-policy' },
        { name: 'Terms of Purchase & Service', path: '/terms-and-conditions' },
        { name: 'Return & Exchange Policy', path: '/return-refund-policy' },
        { name: 'Worldwide Shipping & Delivery Policy', path: '/shipping-policy' },
        { name: 'Cookie Preferences & Policy', path: '/cookie-policy' },
      ],
    },
    {
      title: 'Heritage & Company',
      icon: Info,
      links: [
        { name: 'The Atelier Story', path: '/about' },
        { name: 'Sustainability & Artisans', path: '/about' },
        { name: 'Boutique Locations', path: '/contact' },
        { name: 'Careers & Atelier Apprenticeships', path: '/about' },
      ],
    },
  ];

  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-20 md:pt-32 md:pb-28 overflow-x-hidden select-none">
      <SEOHead
        title="Sitemap & Site Directory | House of Urvaah"
        description="Comprehensive index of House of Urvaah pages, collections, concierge care, client support, and policies."
        keywords="House of Urvaah sitemap, site directory, luxury collections, atelier care"
      />

      {/* Header Section */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mb-14 md:mb-18 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 font-semibold mb-3 flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-neutral-700" />
            SITE ARCHITECTURE & DIRECTORY
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-5">
            SITEMAP
          </h1>
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-5" />
          <p className="max-w-xl text-xs sm:text-sm font-serif leading-relaxed text-neutral-600 font-light text-center">
            A comprehensive index of all ready-to-wear collections, atelier client services, bespoke tailoring inquiries, and brand policies.
          </p>
        </motion.div>
      </section>

      {/* Grid Directory */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {sections.map((section, idx) => {
            const SectionIcon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-[#FAF8F3] border border-neutral-200/80 p-6 sm:p-8 rounded-xs hover:border-black/30 transition-all"
              >
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-neutral-300">
                  <SectionIcon className="w-4 h-4 text-brand-dark stroke-[1.5]" />
                  <h2 className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-brand-dark">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="group flex items-center justify-between text-xs tracking-wider text-neutral-600 hover:text-black transition-colors py-1"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">
                          {link.name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-neutral-300 group-hover:text-black opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Sitemap;
