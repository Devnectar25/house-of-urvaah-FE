import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { apiClient } from '../../lib/apiClient';

export const Hero = () => {
  const fallbackVideoSrc = getSupabaseMediaUrl('HOU_desktop');
  const fallbackMobileVideoSrc = getSupabaseMediaUrl('HOU_mobile');
  const localFallbackSrc = '/assets/video/Hero-section-video-two.mp4';
  const videoRef = useRef(null);

  const [heroSlides, setHeroSlides] = useState([]);
  const [activeSlideIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchHeroSlides = async () => {
    try {
      const res = await apiClient('/api/ui/hero');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setHeroSlides(res.data);
      }
    } catch (err) {
      console.warn('[Hero] Failed to fetch dynamic hero slides:', err.message);
    }
  };

  useEffect(() => {
    fetchHeroSlides();

    // Event listener & polling for live updates when Admin changes Hero Section
    const handleUpdate = () => fetchHeroSlides();
    window.addEventListener('urvaah_hero_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(fetchHeroSlides, 3000);

    return () => {
      window.removeEventListener('urvaah_hero_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const activeSlide = heroSlides[activeSlideIndex] || null;

  const desktopMediaUrl = activeSlide?.desktop_image
    ? getSupabaseMediaUrl(activeSlide.desktop_image)
    : fallbackVideoSrc;

  const mobileMediaUrl = activeSlide?.mobile_image
    ? getSupabaseMediaUrl(activeSlide.mobile_image)
    : fallbackMobileVideoSrc;

  const currentMediaUrl = isMobile ? mobileMediaUrl : desktopMediaUrl;

  const isVideo = isMobile
    ? (activeSlide?.mobile_image ? (activeSlide.media_type === 'video' || activeSlide.mobile_image.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)) : true)
    : (activeSlide ? (activeSlide.media_type === 'video' || (activeSlide.desktop_image && activeSlide.desktop_image.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i))) : true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentMediaUrl, isMobile]);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-white text-brand-dark font-serif select-none">
      {/* Full-bleed Looping Cinematic Media Background */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        {isVideo ? (
          <video
            ref={videoRef}
            key={`${currentMediaUrl}_${isMobile ? 'mobile' : 'desktop'}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover filter brightness-[0.98] contrast-[1.02]"
          >
            <source src={currentMediaUrl} type="video/mp4" />
            {!isMobile && <source src={localFallbackSrc} type="video/mp4" />}
          </video>
        ) : (
          <img
            src={currentMediaUrl}
            alt={activeSlide?.heading || 'Hero Banner'}
            className="w-full h-full object-cover filter brightness-[0.98] contrast-[1.02]"
          />
        )}

        {/* Subtle Scrim Gradient at top for header icon legibility */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/25 via-black/5 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
