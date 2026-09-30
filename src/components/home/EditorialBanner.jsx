import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import { supabase, BUCKET_NAME, getSupabaseMediaUrl } from '../../lib/supabase';

const EDITORIAL_VIDEOS = [
  {
    id: 'blush-pink',
    name: 'Blush Pink Embroidered Floral Co-Ord Set',
    tag: 'PETAL THREADWORK',
    defaultPath: 'videos/Blush Pink Embroidered Floral Co-Ord Set_h264.mp4',
    matcher: (fileName) => {
      const lower = fileName.toLowerCase();
      return lower.includes('blush') && lower.includes('pink') && lower.includes('h264');
    }
  },
  {
    id: 'mocha-brown',
    name: 'Mocha Brown Embroidered Co-Ord Set',
    tag: 'HERITAGE WEAVE',
    defaultPath: 'videos/Mocha Brown Embroidered Co-Ord Set_h264.mp4',
    matcher: (fileName) => {
      const lower = fileName.toLowerCase();
      return lower.includes('mocha') && lower.includes('brown') && lower.includes('h264');
    }
  },
  {
    id: 'teal',
    name: 'Teal Embroidered Floral Co-Ord Set',
    tag: 'OCEAN BLOOM',
    defaultPath: 'videos/Teal Embroidered Floral Co-Ord Set_h264.mp4',
    matcher: (fileName) => {
      const lower = fileName.toLowerCase();
      return lower.includes('teal') && lower.includes('h264');
    }
  }
];

const appendVersion = (url) => {
  if (!url) return url;
  return url.includes('?') ? `${url}&v=2` : `${url}?v=2`;
};

const getInitialVideoUrl = (path) => {
  try {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    if (data?.publicUrl) return appendVersion(data.publicUrl);
  } catch (err) {
    console.warn('Initial public URL lookup failed:', err);
  }
  return appendVersion(getSupabaseMediaUrl(path));
};

export const EditorialBanner = () => {
  const [videos, setVideos] = useState(() =>
    EDITORIAL_VIDEOS.map((item) => ({
      ...item,
      url: getInitialVideoUrl(item.defaultPath)
    }))
  );

  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const [videoLoaded, setVideoLoaded] = useState({});
  const [videoErrors, setVideoErrors] = useState({});

  // Dynamically resolve video URLs from the Supabase houseofurvaah-media bucket by matching names
  useEffect(() => {
    let isMounted = true;

    const resolveVideosFromBucket = async () => {
      try {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).list('videos');
        if (data && !error && data.length > 0) {
          const updated = EDITORIAL_VIDEOS.map((item) => {
            const matchedFile = data.find((f) => item.matcher(f.name));
            const path = matchedFile ? `videos/${matchedFile.name}` : item.defaultPath;
            const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
            const resolvedUrl = urlData?.publicUrl || getSupabaseMediaUrl(path);
            return {
              ...item,
              url: appendVersion(resolvedUrl)
            };
          });
          if (isMounted) {
            setVideos(updated);
          }
        }
      } catch (err) {
        console.warn('Error fetching editorial video list from Supabase:', err);
      }
    };

    resolveVideosFromBucket();
    return () => {
      isMounted = false;
    };
  }, []);

  // Intersection Observer to autoplay when in view and pause when scrolled out
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRefs.current.forEach((video) => {
              if (video && video.paused) {
                video.muted = true;
                video.defaultMuted = true;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.catch((err) => {
                    // Autoplay restriction or unready state: handled gracefully without triggering error banner
                    console.debug('[EditorialVideo] Play promise caught:', err.name);
                  });
                }
              }
            });
          } else {
            videoRefs.current.forEach((video) => {
              if (video && !video.paused) {
                video.pause();
              }
            });
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '60px 0px'
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section id="editorial" className="my-16 py-12 bg-brand-sand text-brand-dark overflow-hidden font-serif scroll-mt-20">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Editorial 3-Video Frame */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 relative w-full"
          >
            {/* Unified Frame Container blending seamlessly into section background (bg-brand-sand) */}
            <div
              style={{ '--frame-color': 'var(--brand-sand, #F5F5F0)' }}
              className="relative w-full bg-brand-sand rounded-sm overflow-hidden p-1.5 sm:p-2 border border-brand-sand shadow-none"
            >
              {/* 3 Videos side by side (horizontal scroll on small mobile, 3-col grid on sm+) */}
              <div className="flex sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none">
                {videos.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative flex-shrink-0 w-[72vw] sm:w-auto snap-center aspect-[9/16] overflow-hidden bg-[#EBEBE6] group select-none"
                  >
                    {/* Individual Video Tag */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-1 text-[8px] sm:text-[9px] md:text-[9.5px] tracking-[0.22em] sm:tracking-[0.25em] font-serif uppercase text-brand-dark shadow-sm pointer-events-none select-none whitespace-nowrap">
                      {item.tag}
                    </div>

                    {/* Warm sand neutral loading skeleton/background (4% darker than section bg) */}
                    {!videoLoaded[item.id] && !videoErrors[item.id] && (
                      <div className="absolute inset-0 bg-[#EBEBE6] animate-pulse flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border border-neutral-300 border-t-neutral-600 animate-spin" />
                      </div>
                    )}

                    {/* Fallback placeholder if video fails to load */}
                    {videoErrors[item.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#EBEBE6] text-neutral-600 text-center font-serif">
                        <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center mb-2">
                          <span className="text-xs text-neutral-700">✕</span>
                        </div>
                        <span className="text-[11px] text-neutral-800 tracking-wider uppercase font-serif">
                          {item.name}
                        </span>
                        <span className="text-[9px] text-neutral-500 mt-1">Preview temporarily unavailable</span>
                      </div>
                    ) : (
                      <video
                        key={item.url}
                        ref={(el) => {
                          videoRefs.current[idx] = el;
                          if (el) {
                            el.muted = true;
                            el.defaultMuted = true;
                          }
                        }}
                        src={item.url}
                        autoPlay
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        onLoadedData={() =>
                          setVideoLoaded((prev) => ({ ...prev, [item.id]: true }))
                        }
                        onCanPlay={(e) => {
                          const v = e.currentTarget;
                          if (v.paused) {
                            v.muted = true;
                            v.defaultMuted = true;
                            const p = v.play();
                            if (p !== undefined) {
                              p.catch((err) => {
                                console.debug('[EditorialVideo] Autoplay promise caught on canplay:', err.name);
                              });
                            }
                          }
                        }}
                        onError={(e) => {
                          const video = e.currentTarget;
                          const err = video.error;
                          console.error(`[EditorialVideo Error] Video "${item.name}":`, {
                            code: err ? err.code : 'UNKNOWN',
                            message: err ? err.message : 'No error message available',
                            url: item.url,
                            networkState: video.networkState,
                            readyState: video.readyState
                          });
                          setVideoErrors((prev) => ({ ...prev, [item.id]: true }));
                        }}
                        className={`w-full h-full object-cover transition-opacity duration-700 ${
                          videoLoaded[item.id] ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ aspectRatio: '9 / 16' }}
                      >
                        <source
                          src={item.url}
                          type="video/mp4"
                          onError={(e) => {
                            const parentVideo = e.currentTarget.parentElement;
                            const err = parentVideo?.error;
                            console.error(`[EditorialVideo Source Error] Video "${item.name}":`, {
                              code: err ? err.code : 'UNKNOWN',
                              message: err ? err.message : 'Source failed to load',
                              url: item.url
                            });
                            setVideoErrors((prev) => ({ ...prev, [item.id]: true }));
                          }}
                        />
                      </video>
                    )}

                    {/* Gradient Scrim for caption legibility */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pt-14 pb-3.5 px-2.5 sm:px-3 flex flex-col justify-end text-center pointer-events-none z-10">
                      <span className="font-serif text-[10px] sm:text-[11px] text-white/95 uppercase tracking-wider leading-snug line-clamp-2 drop-shadow-sm">
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
            <h2 className="section-heading-lg font-serif tracking-[0.1em] text-brand-dark mb-5 md:mb-6">
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
                  data-no-hover="true"
                  className="no-global-hover w-full relative inline-flex items-center justify-center font-medium text-xs px-6 py-3 tracking-widest uppercase border border-brand-dark text-brand-dark group overflow-hidden transition-colors duration-400 select-none cursor-pointer"
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
