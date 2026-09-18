import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';

export const EditorialBanner = () => {
  return (
    <section id="editorial" className="my-16 py-12 bg-brand-sand text-brand-dark overflow-hidden font-serif scroll-mt-20">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Editorial Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 relative aspect-[16/10] md:aspect-[2/1] overflow-hidden bg-neutral-200"
          >
            <img
              src="/assets/Images/Outfit_Collage.png"
              alt="Editorial Campaign Lookbook"
              className="w-full h-full object-cover object-center filter brightness-95"
            />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] tracking-[0.3em] font-serif uppercase">
              LOOKBOOK NO. 14 — W26
            </div>
          </motion.div>

          {/* Right Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col justify-center px-4 md:px-8 py-4"
          >
            <span className="text-[11px] md:text-xs tracking-[0.25em] uppercase text-neutral-500 font-serif mb-2">
              EDITORIAL VISION
            </span>
            <h2 className="section-heading-lg text-brand-dark mb-5 md:mb-6">
              THE ART OF<br />
              REFINED<br />
              TAILORING
            </h2>
            <p className="text-xs md:text-sm text-neutral-600 tracking-wider leading-relaxed mb-6 font-light max-w-sm">
              Defined by oversized silhouettes, fluid draping, and uncompromised material integrity. Designed for timeless elegance across seasonal transitions.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
              <a href="#lookbook" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full justify-center">
                  DISCOVER THE COLLECTION
                </Button>
              </a>
              <a href="#campaign" className="inline-block w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full relative inline-flex items-center justify-center font-medium text-xs px-6 py-3 tracking-widest uppercase border border-brand-dark text-brand-dark group overflow-hidden transition-colors duration-400 select-none cursor-pointer"
                >
                  {/* Revealed background fill underneath */}
                  <span className="absolute inset-0 bg-brand-dark pointer-events-none" />

                  {/* Top-Left Triangular Curtain */}
                  <span
                    className="absolute inset-0 bg-[#F5F5F0] pointer-events-none transition-transform duration-400 ease-in-out group-hover:-translate-x-full group-hover:-translate-y-full"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                  />

                  {/* Bottom-Right Triangular Curtain */}
                  <span
                    className="absolute inset-0 bg-[#F5F5F0] pointer-events-none transition-transform duration-400 ease-in-out group-hover:translate-x-full group-hover:translate-y-full"
                    style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
                  />

                  {/* Button Text Label */}
                  <span className="relative z-10 text-brand-dark group-hover:text-white transition-colors duration-400 ease-in-out">
                    VIEW CAMPAIGN FILM
                  </span>
                </button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
