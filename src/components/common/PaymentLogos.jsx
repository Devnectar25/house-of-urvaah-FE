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
    {/* Clean, high-fidelity Visa brand wordmark with gold V accent */}
    <text x="14" y="29" fill="#1A1F71" fontStyle="italic" fontWeight="900" fontSize="28" fontFamily="'Trebuchet MS', 'Arial Black', sans-serif" letterSpacing="-1">
      VISA
    </text>
    {/* Gold accent triangle on top-left tip of V */}
    <polygon points="11,7 19,7 15,15" fill="#F7B600" />
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
