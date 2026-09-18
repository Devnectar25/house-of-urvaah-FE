import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scissors, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutUs = () => {
  // Ensure page scrolls to top on navigation mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-20 md:pt-32 md:pb-28 overflow-x-hidden select-none">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          {/* Page Title Heading */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-6">
            ABOUT HOUSE OF URVAAH
          </h1>

          {/* Divider Line */}
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-6" />

          {/* Subtitle / Tagline */}
          <p className="max-w-2xl text-base sm:text-lg md:text-xl font-serif leading-relaxed text-neutral-700 tracking-wide font-light text-center">
            Your trusted destination for contemporary women's fashion, crafted with timeless elegance
          </p>
        </motion.div>
      </section>

      {/* 2. TWO-COLUMN EDITORIAL STORY & MISSION BLOCK */}
      <section className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 mb-14 md:mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left: Official Narrative (Our Story & Our Mission) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center space-y-7 lg:pr-4 order-2 lg:order-1"
          >
            {/* OUR STORY */}
            <div>
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mb-2 block">
                ABOUT US
              </span>
              <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark mb-5">
                OUR STORY
              </h2>
              <p className="text-sm sm:text-base font-serif text-neutral-700 leading-relaxed font-light mb-4">
                Founded with a passion for refined, editorial fashion,{' '}
                <span
                  className="font-script lowercase font-normal text-[1.15em] mx-1 inline-block"
                  style={{ fontFamily: "'Parfumerie Script', cursive" }}
                >
                  house of
                </span>{' '}
                <span className="font-serif uppercase tracking-widest font-semibold">URVAAH</span>{' '}
                brings together the artistry of thoughtful design with modern craftsmanship. We believe that true style lies in the balance of fluid silhouettes, fine fabrics, and understated detail.
              </p>
              <p className="text-sm sm:text-base font-serif text-neutral-700 leading-relaxed font-light">
                Our journey began with a simple mission: to make elevated, wardrobe-defining pieces accessible to every woman who seeks confidence through what she wears. Today, we serve style-conscious customers who trust us for genuine quality, considered design, and pieces that transcend passing trends.
              </p>
            </div>

            <div className="w-full h-[1px] bg-neutral-200" />

            {/* OUR MISSION */}
            <div>
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mb-2 block">
                PURPOSE & VISION
              </span>
              <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark mb-5">
                OUR MISSION
              </h2>
              <p className="text-sm sm:text-base font-serif text-neutral-700 leading-relaxed font-light mb-4">
                To empower every woman to express her individuality through clothing that feels as good as it looks — designed with intention, made to last, and styled for every chapter of her life.
              </p>
              <p className="text-sm sm:text-base font-serif text-neutral-700 leading-relaxed font-light">
                We strive to be more than just a fashion label – we're your partner in building a wardrobe that reflects who you are, one collection at a time.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/#best-sellers"
                className="inline-flex items-center gap-3 text-xs font-serif tracking-[0.25em] uppercase font-semibold text-[#111111] border-b border-[#111111] pb-1 hover:opacity-60 transition-opacity"
              >
                EXPLORE THE COLLECTION <ArrowRight className="w-4 h-4 stroke-[1.5]" />
              </Link>
            </div>
          </motion.div>

          {/* Right: Full-length Portrait Fashion Shot */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative aspect-[3/4] sm:aspect-[4/5] max-h-[480px] sm:max-h-[520px] lg:max-h-[560px] w-full mx-auto overflow-hidden bg-neutral-200 border border-neutral-200/80 rounded-xs group shadow-lg order-1 lg:order-2"
          >
            {/* Primary Image: Corset01 */}
            <img
              src="/assets/Images/Corset01.png"
              alt="House of Urvaah Editorial Portrait"
              className="w-full h-full object-contain filter brightness-[0.97] transition-all duration-700 ease-out group-hover:opacity-0 group-hover:scale-105"
            />
            {/* Hover Image: Corset03 */}
            <img
              src="/assets/Images/Corset03.png"
              alt="House of Urvaah Editorial Portrait Hover"
              className="absolute inset-0 w-full h-full object-contain filter brightness-[0.97] opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 border border-white/80">
              <span className="text-[10px] tracking-[0.25em] font-serif uppercase text-neutral-800">
                AUTUMN / WINTER 2026 — ATELIER NO. 01
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. THREE-PILLAR GRID (BRAND VALUES) */}
      <section className="w-full bg-[#F5F5F0] py-14 md:py-20 border-y border-neutral-200/80 mb-14 md:mb-20 overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-10 md:mb-14">
            <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mb-3 block">
              CORE PILLARS
            </span>
            <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark">
              DISTINCTIVE STANDARDS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
            {/* Pillar 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center p-8 bg-white border border-neutral-200/80 rounded-xs shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-[#FAF4E8] flex items-center justify-center mb-6 text-neutral-900 border border-neutral-300/60">
                <Sparkles className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-base sm:text-lg font-serif tracking-[0.2em] uppercase font-medium text-[#111111] mb-3">
                CURATED EXCLUSIVITY
              </h3>
              <p className="text-xs sm:text-sm font-serif text-neutral-600 leading-relaxed font-light">
                Produced in intentionally limited atelier runs to preserve unmatched distinction and prevent overproduction.
              </p>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col items-center text-center p-8 bg-white border border-neutral-200/80 rounded-xs shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-[#FAF4E8] flex items-center justify-center mb-6 text-neutral-900 border border-neutral-300/60">
                <Scissors className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-base sm:text-lg font-serif tracking-[0.2em] uppercase font-medium text-[#111111] mb-3">
                REFINED TAILORING
              </h3>
              <p className="text-xs sm:text-sm font-serif text-neutral-600 leading-relaxed font-light">
                Architectural shoulder shaping, hand-finished seams, and rich European textiles engineered for fluid drape.
              </p>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center text-center p-8 bg-white border border-neutral-200/80 rounded-xs shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-[#FAF4E8] flex items-center justify-center mb-6 text-neutral-900 border border-neutral-300/60">
                <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-base sm:text-lg font-serif tracking-[0.2em] uppercase font-medium text-[#111111] mb-3">
                CONSCIOUS LUXURY
              </h3>
              <p className="text-xs sm:text-sm font-serif text-neutral-600 leading-relaxed font-light">
                Ethically sourced materials and sustainable atelier practices crafting heirloom investment pieces built to endure.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. ATELIER SIGN-OFF SECTION */}
      <section className="w-full max-w-[1000px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Closing Quote */}
          <blockquote className="text-lg sm:text-2xl md:text-3xl font-serif font-light text-neutral-800 leading-relaxed italic mb-8 max-w-2xl">
            "Simplicity is not the absence of clutter, but the mastery of proportion, poise, and purpose."
          </blockquote>

          {/* Founder / Atelier Signature Lockup */}
          <div className="text-2xl sm:text-3xl text-[#111111] my-3">
            <span
              className="font-script lowercase text-3xl sm:text-4xl mr-2 inline-block font-['Parfumerie_Script']"
              style={{ fontFamily: "'Parfumerie Script', cursive" }}
            >
              house of
            </span>
            <span className="font-serif uppercase tracking-widest">URVAAH</span>
          </div>

          {/* Atelier & Design Studio Eyebrow */}
          <span className="text-[11px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mt-4 block">
            ATELIER & DESIGN STUDIO
          </span>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutUs;
