import React from 'react';

export interface MuteJarLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'filled' | 'outline' | 'glass';
  animated?: boolean;
}

/**
 * Mute Jar Official Brand Icon
 * A round pause button with distinct, vibrant red vertical pause stripes.
 * Consistent across headers, menu bars, app shortcuts, dialogs, and dock representations.
 */
export const MuteJarLogo: React.FC<MuteJarLogoProps> = ({
  className = 'w-8 h-8',
  size,
  variant = 'filled',
  animated = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={`shrink-0 select-none ${animated ? 'hover:scale-105 active:scale-95 transition-transform' : ''} ${className}`}
      style={style}
      role="img"
      aria-label="Mute Jar round pause logo with red stripes"
    >
      <defs>
        {/* Subtle drop shadow for 3D button feel */}
        <filter id="mj-btn-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.25" />
        </filter>

        {/* Outer Circular Button Gradient */}
        <linearGradient id="mj-btn-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Vibrant Red Pause Stripes Gradient */}
        <linearGradient id="mj-red-stripe-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff4d4f" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>

        {/* Inner subtle rim highlight */}
        <linearGradient id="mj-rim-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#475569" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Outer Button Circle Base */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="url(#mj-btn-grad)"
        stroke="url(#mj-rim-grad)"
        strokeWidth="3.5"
        filter="url(#mj-btn-shadow)"
      />

      {/* Subtle Inner Concentric Glow Ring */}
      <circle
        cx="50"
        cy="50"
        r="39"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.08"
        strokeWidth="1.2"
      />

      {/* Red Pause Stripes Group */}
      <g>
        {/* Left Red Pause Stripe */}
        <rect
          x="35"
          y="28"
          width="10.5"
          height="44"
          rx="5.25"
          fill="url(#mj-red-stripe-grad)"
        />
        {/* Left Stripe Specular Gloss */}
        <rect
          x="36.5"
          y="30"
          width="3.5"
          height="18"
          rx="1.75"
          fill="#ffffff"
          fillOpacity="0.3"
        />

        {/* Right Red Pause Stripe */}
        <rect
          x="54.5"
          y="28"
          width="10.5"
          height="44"
          rx="5.25"
          fill="url(#mj-red-stripe-grad)"
        />
        {/* Right Stripe Specular Gloss */}
        <rect
          x="56"
          y="30"
          width="3.5"
          height="18"
          rx="1.75"
          fill="#ffffff"
          fillOpacity="0.3"
        />
      </g>
    </svg>
  );
};
