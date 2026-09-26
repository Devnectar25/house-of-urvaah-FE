import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';

const STEAL_DEALS = [
  {
    id: 'steal-1',
    label: 'EVERYTHING UNDER',
    price: '₹5,000',
    icon: ShoppingBag,
    link: '#sale'
  },
  {
    id: 'steal-2',
    label: 'TOPS UNDER',
    price: '₹2,000',
    icon: ShoppingBag,
    link: '#sale'
  },
  {
    id: 'steal-3',
    label: 'JEWELLERY UNDER',
    price: '₹1,000',
    icon: ShoppingBag,
    link: '#sale'
  }
];

export const StealDeals = () => {
  return (
    <section id="steal-deals" className="relative pt-8 pb-16 md:pt-10 md:pb-20 bg-white font-serif scroll-mt-24 overflow-hidden">
      
      {/* Top-Left Soft Organic Background Accent Blob */}
      <div className="absolute -top-16 -left-16 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#F0E6D8]/35 blur-3xl pointer-events-none z-0" />

      {/* Bottom-Right Soft Organic Background Accent Blob */}
      <div className="absolute -bottom-16 -right-16 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#F0E6D8]/35 blur-3xl pointer-events-none z-0" />

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* Left-Aligned Title Block */}
        <motion.div
          className="text-left mb-3 md:mb-4 relative z-10 pl-0 sm:pl-2 md:pl-4"
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Small Uppercase Kicker Label */}
          <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-serif block mb-1">
            THE URVAAH
          </span>

          {/* Main Heading in Le Jour Serif */}
          <h2 className="section-heading font-serif tracking-[0.2em] uppercase text-brand-dark">
            PRICE DROP ERA
          </h2>
        </motion.div>

        {/* Horizontally Centered Subtext Row */}
        <motion.div
          className="text-center w-full mb-8 md:mb-12 relative z-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-xs sm:text-sm font-serif tracking-[0.2em] uppercase text-neutral-500">
            STYLE MORE, SPEND LESS.
          </p>
        </motion.div>

        {/* Three Rounded Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-6xl mx-auto px-2">
          {STEAL_DEALS.map((deal, idx) => {
            const IconComponent = deal.icon;
            return (
              <motion.a
                key={deal.id}
                href={deal.link}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                whileHover={{ y: -8, scale: 1.015 }}
                className="group relative block aspect-[3/3.2] sm:aspect-[3/4] w-full max-w-[340px] sm:max-w-none mx-auto rounded-[20px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-[#FAF6EE] via-[#F3ECE0] to-[#E9DFCF] border-2 border-[#E2D5C4] hover:border-neutral-700"
              >
                {/* Subtle Inner Organic Blob / Layered Texture */}
                <div className="absolute inset-0 bg-radial from-[#FFFFFF]/90 via-transparent to-[#E2D4C3]/40 opacity-80 pointer-events-none" />
                <div className="absolute inset-3.5 rounded-[12px] border border-white/80 pointer-events-none" />

                {/* Card Content - Vertically Centered */}
                <div className="relative z-10 flex flex-col items-center justify-between h-full py-8 sm:py-12 px-5 sm:px-6 text-center select-none">
                  
                  {/* Top: Icon + Divider */}
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 backdrop-blur-sm border border-white flex items-center justify-center text-neutral-900 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-5 h-5 sm:w-7 sm:h-7 stroke-[1.8]" />
                    </div>
                    <div className="w-10 sm:w-12 h-[1px] bg-neutral-900/20 my-3 sm:my-5" />
                  </div>

                  {/* Middle: Label & Price */}
                  <div className="flex flex-col items-center my-auto">
                    <span className="text-xs sm:text-base md:text-lg tracking-[0.18em] uppercase text-neutral-800 font-serif font-semibold mb-2 sm:mb-3">
                      {deal.label}
                    </span>
                    <span className="text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-neutral-900 tracking-tight">
                      {deal.price}
                    </span>
                  </div>

                  {/* Bottom: EXPLORE NOW Link */}
                  <div className="pb-2">
                    <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-serif tracking-[0.2em] uppercase text-neutral-900 group-hover:text-black border-b border-neutral-900/60 group-hover:border-black transition-colors pb-0.5 font-bold">
                      <span>EXPLORE NOW</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>

                </div>
              </motion.a>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default StealDeals;

