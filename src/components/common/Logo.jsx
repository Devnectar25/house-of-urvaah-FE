import React from 'react';

export const Logo = ({ className = "h-14 md:h-18", variant = "dark" }) => {
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/assets/logo.png"
        alt="House of Urvaah"
        className="h-full w-auto object-contain mix-blend-multiply transition-opacity duration-300 hover:opacity-85"
      />
    </div>
  );
};

export default Logo;
