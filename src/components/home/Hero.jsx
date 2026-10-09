import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { apiClient } from '../../lib/apiClient';

export const Hero = () => {
  const fallbackVideoSrc = getSupabaseMediaUrl('HOU_desktop');
  const localFallbackSrc = '/assets/video/Hero-section-video-two.mp4';
  const videoRef = useRef(null);

  const [heroSlides, setHeroSlides] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

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

  const currentMediaUrl = activeSlide?.desktop_image
    ? getSupabaseMediaUrl(activeSlide.desktop_image)
    : fallbackVideoSrc;

  const isVideo = activeSlide
    ? activeSlide.media_type === 'video' || (activeSlide.desktop_image && activeSlide.desktop_image.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i))
    : true;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentMediaUrl]);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-white text-brand-dark font-serif select-none">
      {/* Full-bleed Looping Cinematic Media Background */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        {isVideo ? (
          <video
            ref={videoRef}
            key={currentMediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover filter brightness-[0.98] contrast-[1.02]"
          >
            <source src={currentMediaUrl} type="video/mp4" />
            <source src={localFallbackSrc} type="video/mp4" />
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
