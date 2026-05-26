import React from 'react';

/**
 * PeelImageHolder - Reusable React component for a tall vertical image frame
 * with a realistic page-curl/peel effect at the bottom-right corner.
 *
 * Features:
 * - Tall vertical frame with smooth semicircle arch at top
 * - Straight vertical sides
 * - Large rounded bottom-left corner
 * - Realistic peel/page-curl at bottom-right
 * - Red gradient underside for the peel
 * - Soft shadow under the peel
 * - Responsive SVG scaling
 * - Flat, unwarped image
 *
 * @param {Object} props
 * @param {string} props.imageSrc - Image source URL/path
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.className - Optional CSS class for styling
 * @returns {React.ReactElement}
 */
export default function PeelImageHolder({ imageSrc, alt = 'Image', className = '' }) {
  return (
    <svg
      viewBox="0 0 320 520"
      className={`peel-image-holder ${className}`}
      role="img"
      aria-label={alt}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        maxWidth: '100%',
      }}
    >
      <defs>
        {/* Main frame clipping path - arch top, straight sides, rounded bottom-left */}
        <clipPath id="peelFrameClip">
          <path
            d="
              M 50 180
              Q 50 60 160 40
              Q 270 60 270 180
              L 270 420
              Q 270 480 210 500
              L 110 500
              Q 50 480 50 420
              Z
            "
          />
        </clipPath>

        {/* Red gradient for peel underside */}
        <linearGradient id="peelRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b5f" stopOpacity="1" />
          <stop offset="55%" stopColor="#c51f32" stopOpacity="1" />
          <stop offset="100%" stopColor="#6f0f1d" stopOpacity="1" />
        </linearGradient>

        {/* Shadow filter for peel depth */}
        <filter id="peelShadowFilter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          <feOffset dx="3" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main frame with clipped image */}
      <g clipPath="url(#peelFrameClip)">
        <image
          href={imageSrc}
          x="0"
          y="0"
          width="320"
          height="520"
          preserveAspectRatio="xMidYMid slice"
        />
      </g>

      {/* Peel shadow underneath */}
      <path
        className="peel-shadow"
        d="M 260 480 Q 295 510 310 485 Q 300 470 270 460 Z"
        fill="rgba(0, 0, 0, 0.15)"
        filter="url(#peelShadowFilter)"
      />

      {/* Peel underside (red curved shape) */}
      <path
        className="peel-back"
        d="M 260 480 Q 295 510 310 485 Q 300 470 270 460 Z"
        fill="url(#peelRedGradient)"
        opacity="0.92"
      />

      {/* Peel highlight for 3D effect */}
      <path
        className="peel-highlight"
        d="M 265 478 Q 285 495 300 475 Q 290 468 275 465"
        fill="none"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1.5"
        opacity="0.7"
      />
    </svg>
  );
}

// Export named export for flexibility
export { PeelImageHolder };
