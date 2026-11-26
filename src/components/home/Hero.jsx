import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseMediaUrl } from '../../lib/supabase';
import { apiClient } from '../../lib/apiClient';
import { startVisiblePolling } from '../../lib/livePolling';

// TESTING ONLY: set to a local path (e.g. '/assets/video/testing-video.mp4') to force
// that video on phones instead of the admin's mobile slides. Keep null in production.
const MOBILE_TEST_VIDEO = null;

const MOBILE_QUERY = '(max-width: 767px)';
const getIsMobile = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_QUERY).matches
    : false;

/**
 * Home page hero. Desktop and mobile hero slides are fully independent records:
 *  - phones (< 768px) request ONLY active mobile slides  -> /api/ui/hero?device=mobile
 *  - tablets / laptops / desktops request ONLY active desktop slides -> ?device=desktop
 * Only the current device's media is ever rendered, so phones never download desktop
 * videos and vice versa. With no active slide for a device, that device's default
 * House of Urvaah video is used.
 */
export const Hero = () => {
  const fallbackVideoSrc = getSupabaseMediaUrl('HOU_desktop');
  const fallbackMobileVideoSrc = getSupabaseMediaUrl('HOU_mobile');
  const localFallbackSrc = '/assets/video/Hero-section-video-two.mp4';
  const videoRef = useRef(null);

  const [isMobile, setIsMobile] = useState(getIsMobile);
  const device = isMobile ? 'mobile' : 'desktop';
  const deviceRef = useRef(device);
  deviceRef.current = device;

  // Slides are tagged with the device they were fetched for, so a slide list from the
  // other device is never shown (or downloaded) while a new fetch is in flight.
  const [heroData, setHeroData] = useState({ device: null, slides: [] });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchHeroSlides = async () => {
      const forDevice = deviceRef.current;
      try {
        const res = await apiClient(`/api/ui/hero?device=${forDevice}`);
        if (cancelled || forDevice !== deviceRef.current) return;
        const slides = res && res.success && Array.isArray(res.data)
          ? res.data.filter((s) => s.device === forDevice && s.is_active !== false && s.media_url)
          : [];
        setHeroData({ device: forDevice, slides });
      } catch (err) {
        if (cancelled || forDevice !== deviceRef.current) return;
        console.warn('[Hero] Failed to fetch hero slides:', err.message);
        // Show the device default instead of waiting forever
        setHeroData((prev) => (prev.device === forDevice ? prev : { device: forDevice, slides: [] }));
      }
    };

    fetchHeroSlides();

    // Event listener & polling for live updates when Admin changes Hero Section
    const handleUpdate = () => fetchHeroSlides();
    window.addEventListener('urvaah_hero_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const stopLivePolling = startVisiblePolling(fetchHeroSlides);

    return () => {
      cancelled = true;
      window.removeEventListener('urvaah_hero_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      stopLivePolling();
    };
  }, [device]);

  const useMobileTest = isMobile && !!MOBILE_TEST_VIDEO;
  const isLoaded = useMobileTest || heroData.device === device;
  const activeSlide = isLoaded && !useMobileTest ? heroData.slides[0] || null : null;

  const currentMediaUrl = useMobileTest
    ? MOBILE_TEST_VIDEO
    : activeSlide
      ? getSupabaseMediaUrl(activeSlide.media_url)
      : (isMobile ? fallbackMobileVideoSrc : fallbackVideoSrc);

  // Each slide renders by its own media_type; the device defaults are videos
  const isVideo = useMobileTest || !activeSlide || activeSlide.media_type !== 'image';

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentMediaUrl, isMobile, isLoaded]);

  // Hero = exactly one screen on every device (dvh tracks the real visible
  // height on phones, incl. browser bars). Media is object-cover + centred,
  // so there is never blank space; only the outer edges of a 9:16 video
  // (outside the 880x1800 safe zone) can be trimmed on some phones.
  return (
    <section className="relative w-full h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-white text-brand-dark font-serif select-none">
      {/* Full-bleed Looping Cinematic Media Background */}
      <div className="absolute inset-0 z-0 bg-[#ede1e0]">
        {!isLoaded ? null : isVideo ? (
          <video
            ref={videoRef}
            key={`${currentMediaUrl}_${device}`}
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
            {!isMobile && !activeSlide && <source src={localFallbackSrc} type="video/mp4" />}
          </video>
        ) : (
          <img
            key={`${currentMediaUrl}_${device}`}
            src={currentMediaUrl}
            alt={activeSlide?.heading || 'House of Urvaah'}
            fetchPriority="high"
            className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02]"
          />
        )}

        {/* Subtle Scrim Gradient at top for header icon legibility (desktop only) */}
        <div className="hidden md:block absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/25 via-black/5 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
