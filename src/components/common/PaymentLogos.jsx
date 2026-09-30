import React from 'react';

/**
 * Official, license-safe vector brand logos for accepted payment methods.
 * Rendered in original brand colors with proper aspect ratio scaling.
 */

export const UpiLogo = ({ className = "h-4 w-auto" }) => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="UPI">
    {/* UPI Dual Chevron Arrow Symbol */}
    <g transform="translate(4, 4)">
      <polygon points="12,2 26,16 12,30 5,30 19,16 5,2" fill="#F58220" />
      <polygon points="20,2 34,16 20,30 13,30 27,16 13,2" fill="#75BF44" />
    </g>
    {/* UPI Text */}
    <text x="44" y="26" fill="#000000" fontStyle="italic" fontWeight="900" fontSize="22" fontFamily="sans-serif" letterSpacing="0.5">
      UPI
    </text>
  </svg>
);

export const VisaLogo = ({ className = "h-4 w-auto" }) => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Visa">
    <path
      d="M47.7 27.6h5.8l3.6-21.9h-5.8l-3.6 21.9zm17.4-21.3c-1.2-.4-3-.9-5.3-.9-5.8 0-9.9 3.1-10 7.5-.1 3.3 2.9 5.1 5.2 6.2 2.3 1.1 3.1 1.9 3.1 2.9 0 1.5-1.8 2.2-3.5 2.2-2.3 0-3.6-.3-5.5-1.2l-.8-.4-.9 5.4c1.5.7 4.2 1.3 7 1.3 6.6 0 10.9-3.2 11-8.3 0-2.8-1.7-4.9-5.3-6.6-2.2-1.1-3.6-1.9-3.5-3 0-1 .1-1.7 2.8-1.7 1.6 0 2.8.3 3.7.7l.4.2.8-5.3zm21.3.1h-4.5c-1.4 0-2.4.4-3 1.8l-8.5 20.3h6.1l1.2-3.4h7.5l.7 3.4h5.4L86.4 6.4zm-6.9 13.7l3.1-8.4 1.8 8.4h-4.9zM36.1 6.4L30.4 22c-.3 1.4-1.5 2-2.8 2H18.1l-.2.8 9.7 2.1c1.8.4 3.4 0 3.9-1.9L37 6.4h-6.1l5.2 0z"
      fill="#1A1F71"
    />
  </svg>
);

export const MastercardLogo = ({ className = "h-4 w-auto" }) => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Mastercard">
    <circle cx="48" cy="20" r="16" fill="#EB001B" />
    <circle cx="72" cy="20" r="16" fill="#F79E1B" />
    <path
      d="M60 7.42a15.93 15.93 0 0 0-6 12.58c0 4.88 2.2 9.24 6 12.58a15.93 15.93 0 0 0 6-12.58c0-4.88-2.2-9.24-6-12.58z"
      fill="#FF5F00"
    />
  </svg>
);

export const RupayLogo = ({ className = "h-4 w-auto" }) => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="RuPay">
    {/* RuPay Text */}
    <text x="6" y="27" fill="#002B49" fontStyle="italic" fontWeight="900" fontSize="22" fontFamily="sans-serif" letterSpacing="0">
      RuPay
    </text>
    {/* RuPay Orange & Green Slash Arrows */}
    <g transform="translate(86, 8)">
      <polygon points="0,0 12,0 7,22 0,22" fill="#F58220" />
      <polygon points="12,0 22,0 17,22 8,22" fill="#00B359" />
    </g>
  </svg>
);
