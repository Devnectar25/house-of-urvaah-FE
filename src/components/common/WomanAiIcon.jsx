import React from 'react';

/**
 * WomanAiIcon - Luxury Woman AI Stylist Concierge Icon
 * Depicts an elegant feminine silhouette with chic hair, neckline, and AI sparkles.
 */
export const WomanAiIcon = ({ className = "w-4 h-4", width = 18, height = 18, ...props }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Woman's Head & Chic Hairstyle Silhouette */}
      <path d="M12 3.2C8.5 3.2 6.2 5.8 6.2 9.5c0 2.3.9 4.3 2.3 5.5v1.2c0 1.4 1.6 2.5 3.5 2.5s3.5-1.1 3.5-2.5v-1.2c1.4-1.2 2.3-3.2 2.3-5.5 0-3.7-2.3-6.3-5.8-6.3Z" />

      {/* Chic Hair Parting & Flowing Bangs */}
      <path d="M6.8 9.2C8.4 6.8 10.4 5.4 12 5.4c2.1 0 4.2 1.1 5.2 3.8" />

      {/* Delicate Feminine Smile */}
      <path d="M10.8 13.8c.7.4 1.7.4 2.4 0" />

      {/* Elegant Neckline & Shoulder Silhouette */}
      <path d="M8 19.2C5.5 20 4 21.2 4 22h16c0-.8-1.5-2-4-2.8" />

      {/* AI Sparkle / Magic Star (Top Right) */}
      <path
        d="M20 2.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z"
        fill="currentColor"
        strokeWidth="0.6"
      />

      {/* Micro AI Sparkle Star */}
      <circle cx="16.5" cy="2" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
};

export default WomanAiIcon;
