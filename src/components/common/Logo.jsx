import React from 'react';
import { getSupabaseMediaUrl } from '../../lib/supabase';

export const Logo = ({ className = "h-14 md:h-18", variant = "dark" }) => {
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={getSupabaseMediaUrl('logo.png')}
        alt="House of Urvaah"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/assets/logo.png';
        }}
        className="h-full w-auto object-contain transition-all duration-300 hover:opacity-90 shrink-0"
        style={{
          imageRendering: '-webkit-optimize-contrast',
          filter: variant === 'light' 
            ? 'invert(1) brightness(2)' 
            : 'brightness(0) contrast(200%)'
        }}
      />
    </div>
  );
};

export default Logo;
