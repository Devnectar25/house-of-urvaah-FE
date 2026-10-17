import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Scissors, Feather, Video, Ruler } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { getSupabaseMediaUrl } from '../lib/supabase';

const DISTINCTIVE_STANDARDS = [
  {
    icon: Sparkles,
    title: 'Indian touch, trendy cut',
    desc: "Every piece blends an Indian detail, like embroidery, potli trim, zari or a gharara, with a silhouette you'd actually wear today.",
  },
  {
    icon: RefreshCw,
    title: 'Made to be worn more than once',
    desc: 'Our pieces do more: a kurti that works as a dress, a gharara set with a hook-on peplum, a corset that goes with a saree, skirt or jeans.',
  },
  {
    icon: Scissors,
    title: 'Details that make it fit and feel right',
    desc: 'Our co-ord sets and kurti dresses are lined, with adjustable tie-backs or lace-ups and side zips where the design needs them.',
  },
  {
    icon: Feather,
    title: 'Fabrics chosen for how they wear',
    desc: 'Breathable cora cotton for Indian weather, raw tissue silk with gold embroidery for occasions, and sequin and embroidered fabrics for evenings.',
  },
  {
    icon: Video,
    title: 'True to fabric',
    desc: 'Every product page has an unfiltered video, so what arrives matches what you saw.',
  },
  {
    icon: Ruler,
    title: 'Fit that listens',
    desc: "Sizes from XS or S to L, with custom sizing on selected pieces. Message us your measurements and we'll help you choose.",
  },
];

export const AboutUs = () => {
  // Ensure page scrolls to top on navigation mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-28 sm:pt-32 md:pt-36 pb-0 overflow-x-hidden select-none">
      <SEOHead
        title="About Us | House of Urvaah — Contemporary Women's Fashion"
        description="Learn about House of Urvaah: our passion for refined editorial fashion, timeless craftsmanship, and our mission to empower women with elevated wardrobes."
        keywords="About House of Urvaah, luxury fashion brand, contemporary tailoring, sustainable fashion atelier, brand story"
        ogImage="/assets/Images/Corset01.png"
      />
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mb-4 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          {/* Page Title Heading */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-4">
            ABOUT HOUSE OF URVAAH
          </h1>

          {/* Divider Line */}
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-4" />

          {/* Subtitle / Tagline */}
          <p className="max-w-2xl text-sm sm:text-base md:text-lg font-serif leading-relaxed text-neutral-700 tracking-wide font-light text-center">
            Thoughtfully designed for every girl who loves to dress up.
          </p>
        </motion.div>
      </section>

      {/* 2. TWO-COLUMN EDITORIAL STORY & MISSION BLOCK */}
      <section className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 mb-6 md:mb-10">
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
                House of Urvaah is a women&apos;s clothing brand with an Indian soul and a trendy, bold cut. We&apos;re not festive-only and we&apos;re not traditional-only. We make the clothes in between: a gharara paired with a crop top, a kurti that&apos;s also a dress, a corset top you can wear with a saree or jeans.
              </p>
              <p className="text-sm sm:text-base font-serif text-neutral-700 leading-relaxed font-light mb-4">
                House of Urvaah is made for girls who love to dress up, whether that&apos;s for college, the office, a vacation, a night out or an occasion.
              </p>
              <p className="text-sm sm:text-base font-serif text-neutral-700 leading-relaxed font-light">
                Every piece starts with a thoughtful detail: a lace-up back, a potli hem, heart butti embroidery, a hook-on peplum. Because trendy and Indian were never meant to be a choice.
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
                To make Indian-rooted fashion feel as current as the girls who wear it.
              </p>
              <p className="text-sm sm:text-base font-serif text-neutral-700 leading-relaxed font-light">
                We design clothes that are thoughtfully made, honestly shown and easy to love, so every girl who loves to dress up can find something that feels like her.
              </p>
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
              src={getSupabaseMediaUrl('Images/Corset01.png')}
              alt="House of Urvaah Editorial Portrait"
              className="w-full h-full object-contain filter brightness-[0.97] transition-all duration-700 ease-out group-hover:opacity-0 group-hover:scale-105"
            />
            {/* Hover Image: Corset03 */}
            <img
              src={getSupabaseMediaUrl('Images/Corset03.png')}
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

      {/* 3. DISTINCTIVE STANDARDS GRID */}
      <section className="w-full bg-[#F5F5F0] py-8 md:py-12 border-t border-neutral-200/80 mb-0 overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-10 md:mb-12">
            <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 mb-2 block">
              OUR PROMISE
            </span>
            <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark">
              OUR DISTINCTIVE STANDARDS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {DISTINCTIVE_STANDARDS.map((standard, index) => {
              const IconComponent = standard.icon;
              return (
                <motion.div
                  key={standard.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="flex flex-col items-center text-center p-6 sm:p-8 bg-white border border-neutral-200/80 rounded-xs shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF4E8] flex items-center justify-center mb-4 text-neutral-900 border border-neutral-300/60 shrink-0">
                    <IconComponent className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm sm:text-base font-serif tracking-[0.1em] uppercase font-medium text-[#111111] mb-2.5">
                    {standard.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-serif text-neutral-600 leading-relaxed font-light">
                    {standard.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
