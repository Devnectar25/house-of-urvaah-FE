import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { apiClient } from '../../lib/apiClient';
import { startVisiblePolling } from '../../lib/livePolling';

// TESTING ONLY: when set, the mobile hero plays this local 1080x1920 (9:16) test
// video (green = safe zone, red/blue = edges that may trim on some phones)
// instead of the admin/Supabase one. Set to null before going live.
const MOBILE_TEST_VIDEO = '/assets/video/testing-video.mp4';

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
    const stopLivePolling = startVisiblePolling(fetchHeroSlides);

    return () => {
      window.removeEventListener('urvaah_hero_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      stopLivePolling();
    };
  }, []);

  const activeSlide = heroSlides[activeSlideIndex] || null;

  const isVideoMedia = (url) => {
    if (!url || typeof url !== 'string') return false;
    const clean = url.split('?')[0].toLowerCase().trim();
    return (
      clean.endsWith('.mp4') ||
      clean.endsWith('.webm') ||
      clean.endsWith('.mov') ||
      clean.endsWith('.m4v') ||
      clean.includes('/videos/') ||
      clean.includes('/video/')
    );
  };

  const desktopMediaUrl = activeSlide?.desktop_image
    ? getSupabaseMediaUrl(activeSlide.desktop_image)
    : fallbackVideoSrc;

  const mobileMediaUrl = activeSlide?.mobile_image
    ? getSupabaseMediaUrl(activeSlide.mobile_image)
    : (activeSlide?.desktop_image ? getSupabaseMediaUrl(activeSlide.desktop_image) : fallbackMobileVideoSrc);

  const useMobileTest = isMobile && !!MOBILE_TEST_VIDEO;
  const currentMediaUrl = useMobileTest
    ? MOBILE_TEST_VIDEO
    : (isMobile ? mobileMediaUrl : desktopMediaUrl);

  const isVideo = useMobileTest ? true : isMobile
    ? (activeSlide?.mobile_image
        ? (activeSlide.media_type === 'video' || isVideoMedia(activeSlide.mobile_image))
        : (activeSlide?.desktop_image ? (activeSlide.media_type === 'video' || isVideoMedia(activeSlide.desktop_image)) : true))
    : (activeSlide ? (activeSlide.media_type === 'video' || isVideoMedia(activeSlide.desktop_image)) : true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentMediaUrl, isMobile]);

  // Hero = exactly one screen on every device (dvh tracks the real visible
  // height on phones, incl. browser bars). Media is object-cover + centred,
  // so there is never blank space; only the outer edges of a 9:16 video
  // (outside the 880x1800 safe zone) can be trimmed on some phones.
  return (
    <section className="relative w-full h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-white text-brand-dark font-serif select-none">
      {/* Full-bleed Looping Cinematic Media Background */}
      <div className="absolute inset-0 z-0 bg-[#ede1e0]">
        {isVideo ? (
          <video
            ref={videoRef}
            key={`${currentMediaUrl}_${isMobile ? 'mobile' : 'desktop'}`}
            src={currentMediaUrl}
            autoPlay
            muted
            loop
            playsInline
            webkit-playsinline="true"
            preload="auto"
            className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02]"
          >
            <source src={currentMediaUrl} type="video/mp4" />
            {!isMobile && <source src={localFallbackSrc} type="video/mp4" />}
          </video>
        ) : (
          <img
            src={currentMediaUrl}
            alt={activeSlide?.heading || 'Hero Banner'}
            className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02]"
          />
        )}

        {/* Subtle Scrim Gradient at top for header icon legibility (desktop only) */}
        <div className="hidden md:block absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/25 via-black/5 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
