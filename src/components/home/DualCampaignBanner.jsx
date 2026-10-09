import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSupabaseMediaUrl, CDN_BASE_URL } from '../../lib/supabase';
import { apiClient } from '../../lib/apiClient';

const SUPABASE_CDN = CDN_BASE_URL || 'https://fhbdceauisvlcpmuzpmf.supabase.co/storage/v1/object/public/houseofurvaah-media';

const DEFAULT_BLUE_IMAGES = [
  `${SUPABASE_CDN}/Images/Blue_Halter.jpg`,
  `${SUPABASE_CDN}/Images/Blue02.png`,
  `${SUPABASE_CDN}/Images/Blue03.png`
];

const DEFAULT_PEACH_IMAGES = [
  `${SUPABASE_CDN}/Images/Peach02.png`,
  `${SUPABASE_CDN}/Images/Peach01.png`,
  `${SUPABASE_CDN}/Images/Peach03.png`
];

const DEFAULT_BROWN_IMAGES = [
  `${SUPABASE_CDN}/Images/Brown_Floral.jpg`,
  `${SUPABASE_CDN}/Images/Brown02.png`,
  `${SUPABASE_CDN}/Images/Brown03.png`
];

const DEFAULT_CORSET_IMAGES = [
  `${SUPABASE_CDN}/Images/Corset01.png`,
  `${SUPABASE_CDN}/Images/Corset02.png`,
  `${SUPABASE_CDN}/Images/Corset04.png`
];

// Helper to extract active images list directly from Supabase CDN
const getBannerImages = (bannerData, defaultImages) => {
  if (Array.isArray(bannerData?.images) && bannerData.images.length > 0) {
    const valid = bannerData.images.filter(Boolean);
    if (valid.length > 0) return valid.map(getSupabaseMediaUrl);
  }
  if (bannerData?.image) {
    return [getSupabaseMediaUrl(bannerData.image)];
  }
  return defaultImages;
};

export const DualCampaignBanner = () => {
  const navigate = useNavigate();

  // Dynamic banner data for all 4 positions from admin configuration
  const [topLeftData, setTopLeftData] = useState(null);
  const [bottomLeftData, setBottomLeftData] = useState(null);
  const [topRightData, setTopRightData] = useState(null);
  const [bottomRightData, setBottomRightData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    apiClient('/api/ui/dual-campaign')
      .then((res) => {
        if (!isMounted || !res?.success || !Array.isArray(res.data)) return;
        const topLeft = res.data.find((b) => (b.position === 'top_left' || b.position === 'left') && b.is_active);
        const bottomLeft = res.data.find((b) => b.position === 'bottom_left' && b.is_active);
        const topRight = res.data.find((b) => (b.position === 'top_right' || b.position === 'right') && b.is_active);
        const bottomRight = res.data.find((b) => b.position === 'bottom_right' && b.is_active);

        if (topLeft) setTopLeftData(topLeft);
        if (bottomLeft) setBottomLeftData(bottomLeft);
        if (topRight) setTopRightData(topRight);
        if (bottomRight) setBottomRightData(bottomRight);
      })
      .catch((err) => {
        console.warn('Could not load dynamic dual campaign banners, using defaults:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active image sets for each of the 4 sections from Supabase CDN
  const blueImages = getBannerImages(topLeftData, DEFAULT_BLUE_IMAGES);
  const peachImages = getBannerImages(bottomLeftData, DEFAULT_PEACH_IMAGES);
  const brownImages = getBannerImages(topRightData, DEFAULT_BROWN_IMAGES);
  const corsetImages = getBannerImages(bottomRightData, DEFAULT_CORSET_IMAGES);

  // Auto-carousel transition indices
  const [blueIndex, setBlueIndex] = useState(0);
  const [peachIndex, setPeachIndex] = useState(0);
  const [brownIndex, setBrownIndex] = useState(0);
  const [corsetIndex, setCorsetIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlueIndex((prev) => (prev + 1) % (blueImages.length || 1));
      setPeachIndex((prev) => (prev + 1) % (peachImages.length || 1));
      setBrownIndex((prev) => (prev + 1) % (brownImages.length || 1));
      setCorsetIndex((prev) => (prev + 1) % (corsetImages.length || 1));
    }, 2500); // crossfade every 2.5 seconds
    return () => clearInterval(interval);
  }, [blueImages.length, peachImages.length, brownImages.length, corsetImages.length]);

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
          {/* 1. Top Left Image: Auto Carousel -> Navigates to Blue Co-ord set (bs-102) */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate(topLeftData?.link || '/product/bs-102')}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100 cursor-pointer"
          >
            {blueImages.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`Editorial Campaign Top Left ${i}`}
                className={`absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
                  i === blueIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            ))}
          </motion.div>

          {/* 2. Bottom Left Image: Auto Carousel -> Navigates to Silk Top (bs-104) */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate(bottomLeftData?.link || '/product/bs-104')}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100 cursor-pointer"
          >
            {peachImages.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`Editorial Campaign Bottom Left ${i}`}
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
          RIGHT COLUMN: Vertical Stack of Brown images + Corset images
          ========================================================
        */}
        <div className="flex flex-col gap-0 w-full">
          {/* 3. Top Right Image: Auto Carousel -> Navigates to Blazer (bs-101) */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            onClick={() => navigate(topRightData?.link || '/product/bs-101')}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100 cursor-pointer"
          >
            {brownImages.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`Editorial Campaign Top Right ${i}`}
                className={`absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.98] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
                  i === brownIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            ))}
          </motion.div>

          {/* 4. Bottom Right Image: Auto Carousel -> Navigates to Corset Set (bs-103) */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            onClick={() => navigate(bottomRightData?.link || '/product/bs-103')}
            className="group relative w-full h-[65vh] sm:h-[90vh] md:h-[125vh] lg:h-[135vh] overflow-hidden bg-neutral-100 cursor-pointer"
          >
            {corsetImages.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`Editorial Campaign Bottom Right ${i}`}
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
