import React from "react";

// Foundation "F" monogram inside a circular wordmark, vector-only.
export default function BrandMark({ className = "w-10 h-10", showRing = true, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {showRing && (
        <g fill="none" stroke={color} strokeWidth="1.4">
          <circle cx="60" cy="60" r="56" opacity="0.35" />
        </g>
      )}
      {/* Stylized F: two cantilevered horizontal bars with vertical spine */}
      <g fill={color}>
        <rect x="42" y="36" width="6" height="48" />
        <rect x="42" y="36" width="34" height="6" />
        <rect x="42" y="56" width="26" height="6" />
        {/* Cantilever cap on top */}
        <rect x="70" y="36" width="6" height="14" />
        <rect x="62" y="56" width="6" height="10" />
      </g>
      {/* Dots */}
      <g fill={color}>
        <circle cx="14" cy="60" r="1.6" />
        <circle cx="106" cy="60" r="1.6" />
      </g>
    </svg>
  );
}
