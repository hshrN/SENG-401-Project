import React from "react";
import styles from "./GradientBackground.module.css";

type GradientBackgroundProps = {
  idPrefix: string;
};

export default function GradientBackground({ idPrefix }: GradientBackgroundProps) {
  const lg1 = `${idPrefix}-lg1`;
  const lg2 = `${idPrefix}-lg2`;
  const rg1 = `${idPrefix}-rg1`;
  const blur1 = `${idPrefix}-blur1`;
  const blur2 = `${idPrefix}-blur2`;
  const blur3 = `${idPrefix}-blur3`;

  return (
    <div className={styles.gradientBg} aria-hidden>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={lg1} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(5, 46, 34, 0.9)" />
            <stop offset="100%" stopColor="rgba(22, 163, 74, 0.5)" />
          </linearGradient>
          <linearGradient id={lg2} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.4)" />
            <stop offset="50%" stopColor="rgba(5, 46, 34, 0.6)" />
            <stop offset="100%" stopColor="rgba(22, 101, 52, 0.5)" />
          </linearGradient>
          <radialGradient id={rg1} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.5)" />
            <stop offset="100%" stopColor="rgba(5, 46, 34, 0.3)" />
          </radialGradient>
          <filter id={blur1} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="35" />
          </filter>
          <filter id={blur2} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
          <filter id={blur3} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="45" />
          </filter>
        </defs>
        <g className={styles.float1}>
          <ellipse cx="200" cy="500" rx="250" ry="180" fill={`url(#${lg1})`} filter={`url(#${blur1})`} transform="rotate(-30 200 500)" />
          <rect x="500" y="100" width="300" height="250" rx="80" fill={`url(#${lg2})`} filter={`url(#${blur2})`} transform="rotate(15 650 225)" />
        </g>
        <g className={styles.float2}>
          <circle cx="650" cy="450" r="150" fill={`url(#${rg1})`} filter={`url(#${blur3})`} opacity="0.7" />
          <ellipse cx="50" cy="150" rx="180" ry="120" fill="rgba(34, 197, 94, 0.25)" filter={`url(#${blur2})`} opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
