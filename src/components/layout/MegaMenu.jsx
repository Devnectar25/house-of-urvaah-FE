import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../data/mockProducts';

export const MegaMenu = ({ categoryId, onClose }) => {
  const category = CATEGORIES.find((cat) => cat.id === categoryId);

  if (!category) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white text-brand-dark shadow-2xl border-t border-neutral-100 z-40 py-10 px-8 md:px-16"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Title & Count */}
        <div className="col-span-3 pr-6 border-r border-neutral-100">
          <h3 className="text-xl font-serif tracking-wider uppercase mb-2 font-normal">
            {category.name}
          </h3>
          <p className="text-xs text-neutral-400 tracking-widest uppercase mb-6">
            {category.itemCount}
          </p>
          <a
            href={`#${category.id}`}
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-brand-dark hover:text-neutral-500 transition-colors group"
          >
            EXPLORE ALL {category.name}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Middle Columns: Subcategories */}
        <div className="col-span-5 grid grid-cols-2 gap-6 pl-4">
          <div>
            <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold mb-4">
              CATEGORIES
            </h4>
            <ul className="space-y-3">
              {category.subcategories.slice(0, 4).map((sub, idx) => (
                <li key={idx}>
                  <a
                    href={`#${category.id}`}
                    onClick={onClose}
                    className={`text-xs tracking-wider uppercase transition-colors block ${
                      sub.featured
                        ? 'font-semibold text-brand-dark hover:text-neutral-500'
                        : 'text-neutral-600 hover:text-black font-normal'
                    }`}
                  >
                    {sub.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-widest text-neutral-400 uppercase font-semibold mb-4">
              COLLECTIONS
            </h4>
            <ul className="space-y-3">
              {category.subcategories.slice(4).map((sub, idx) => (
                <li key={idx}>
                  <a
                    href={`#${category.id}`}
                    onClick={onClose}
                    className={`text-xs tracking-wider uppercase transition-colors block ${
                      sub.featured
                        ? 'font-semibold text-brand-dark hover:text-neutral-500'
                        : 'text-neutral-600 hover:text-black font-normal'
                    }`}
                  >
                    {sub.name}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`#${category.id}`}
                  onClick={onClose}
                  className="text-xs font-semibold text-brand-accent tracking-wider uppercase hover:underline"
                >
                  RUNWAY SPECIALS
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Campaign Promo Banner */}
        <div className="col-span-4 pl-6 border-l border-neutral-100">
          {category.promo && (
            <div className="relative group overflow-hidden bg-neutral-100 aspect-[4/3] cursor-pointer">
              <img
                src={category.promo.image}
                alt={category.promo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/30 p-6 flex flex-col justify-end text-white">
                <span className="text-[9px] tracking-widest uppercase text-white/80 font-serif mb-1">
                  {category.promo.subtitle}
                </span>
                <h4 className="text-sm font-semibold tracking-widest uppercase mb-2">
                  {category.promo.title}
                </h4>
                <span className="text-[10px] font-semibold tracking-widest uppercase underline underline-offset-4">
                  VIEW CAMPAIGN
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
