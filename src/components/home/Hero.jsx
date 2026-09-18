import React from 'react';
import { getSupabaseMediaUrl } from '../../lib/supabase';

export const Hero = () => {
  const supabaseVideoSrc = getSupabaseMediaUrl('/assets/video/Hero-section-video-two.mp4');
  const localVideoSrc = '/assets/video/Hero-section-video-two.mp4';

  return (
    <section className="relative w-full h-screen overflow-hidden bg-white text-brand-dark font-serif select-none">
      {/* Full-bleed Looping Cinematic Video Background (ZARA Style) */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter brightness-[0.98] contrast-[1.02]"
        >
          <source src={supabaseVideoSrc} type="video/mp4" />
          <source src={localVideoSrc} type="video/mp4" />
        </video>

        {/* Subtle Scrim Gradient at top for header icon legibility */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/25 via-black/5 to-transparent pointer-events-none" />
      </div>

      {/* Midpoint Full-Width Hairline Structural Rule */}
      <div className="absolute top-1/2 inset-x-0 z-10 -translate-y-1/2 pointer-events-none">
        <div className="w-full h-[1px] bg-black/20 md:bg-black/15" />
      </div>
    </section>
  );
};
