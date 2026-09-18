import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseMediaUrl } from '../../lib/supabase';

export const DualCampaignBanner = () => {
  // Auto-carousel state for the first section (Left Column Top)
  const blueImages = [
    '/assets/Images/Blue_Halter.jpg',
    '/assets/Images/Blue02.png',
    '/assets/Images/Blue03.png'
  ].map(getSupabaseMediaUrl);
  const [blueIndex, setBlueIndex] = useState(0);

  // Auto-carousel state for the second section (Right Column Top)
  const brownImages = [
    '/assets/Images/Brown_Floral.jpg',
    '/assets/Images/Brown02.png',
    '/assets/Images/Brown03.png'
  ].map(getSupabaseMediaUrl);
  const [brownIndex, setBrownIndex] = useState(0);

  // Auto-carousel state for the third section (Left Column Bottom)
  const peachImages = [
    '/assets/Images/Peach02.png',
    '/assets/Images/Peach01.png',
    '/assets/Images/Peach03.png'
  ].map(getSupabaseMediaUrl);
  const [peachIndex, setPeachIndex] = useState(0);

  // Auto-carousel state for the fourth section (Right Column Bottom)
  const corsetImages = [
    '/assets/Images/Corset01.png',
    '/assets/Images/Corset02.png',
    '/assets/Images/Corset04.png'
  ].map(getSupabaseMediaUrl);
  const [corsetIndex, setCorsetIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlueIndex((prev) => (prev + 1) % blueImages.length);
      setBrownIndex((prev) => (prev + 1) % brownImages.length);
      setPeachIndex((prev) => (prev + 1) % peachImages.length);
      setCorsetIndex((prev) => (prev + 1) % corsetImages.length);
    }, 2500); // crossfade every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full bg-white overflow-hidden font-serif select-none">
      {/* 2-Column Full-Bleed Edge-to-Edge Grid (Zero Gap, Zero Margin, Zero Padding) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 w-full p-0 m-0">
        {/* 
          ========================================================
          LEFT COLUMN: Vertical Stack of Blue images + Peach images
          ========================================================
        */}
        <div className="flex flex-col gap-0 w-full">
          {/* 1. Top Left Image: Auto Carousel of Blue images */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100"
          >
            {blueImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Editorial Campaign Blue ${i}`}
                className={`absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
                  i === blueIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            ))}
          </motion.div>

          {/* 2. Bottom Left Image: Auto Carousel of Peach images */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100"
          >
            {peachImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Editorial Campaign Peach ${i}`}
                className={`absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
                  i === peachIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            ))}
          </motion.div>
        </div>

        {/* 
          ========================================================
          RIGHT COLUMN: Vertical Stack of Brown images + Corset04
          ========================================================
        */}
        <div className="flex flex-col gap-0 w-full">
          {/* 3. Top Right Image: Auto Carousel of Brown images */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100"
          >
            {brownImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Editorial Campaign Brown ${i}`}
                className={`absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
                  i === brownIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            ))}
          </motion.div>

          {/* 4. Bottom Right Image: Auto Carousel of Corset images */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100"
          >
            {corsetImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Editorial Campaign Corset ${i}`}
                className={`absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
                  i === corsetIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
