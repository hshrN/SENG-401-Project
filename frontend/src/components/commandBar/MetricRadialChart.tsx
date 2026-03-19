import React, { useEffect, useId, useMemo } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

type MetricRadialChartProps = {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  duration?: number;
  progressColor: string;
  trackColor?: string;
  showCenterValue?: boolean;
  showCornerLabels?: boolean;
};

export function MetricRadialChart({
  value,
  size = 58,
  strokeWidth = 6,
  duration = 0.75,
  progressColor,
  trackColor = "rgba(255, 255, 255, 0.14)",
  showCenterValue = true,
  showCornerLabels = true,
}: MetricRadialChartProps) {
  const reactId = useId();
  const safeValue = Math.max(0, Math.min(100, value));
  const center = size / 2;
  const radius = Math.max(0, center - strokeWidth / 2 - 2);
  const arcLength = Math.PI * radius; // semi-circle

  const startX = center - radius;
  const endX = center + radius;
  const midY = center;
  // Sweep flag chosen to render the semicircle on the top half of the widget.
  const arcPath = `M ${startX} ${midY} A ${radius} ${radius} 0 0 1 ${endX} ${midY}`;

  const animatedValue = useMotionValue(0);
  const dashOffset = useTransform(animatedValue, [0, 100], [arcLength, 0]);

  useEffect(() => {
    const controls = animate(animatedValue, safeValue, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [safeValue, duration, animatedValue]);

  const safeInt = useMemo(() => Math.round(safeValue), [safeValue]);

  const glowId = `metricGlow-${String(reactId).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const gradientId = `metricProgGrad-${String(reactId).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const valueGradId = `metricTextGrad-${String(reactId).replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const labelFontSize = Math.max(8, size * 0.12);
  const centerFontSize = Math.max(12, size * 0.22);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <filter id={glowId}>
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={progressColor} floodOpacity="0.35" />
        </filter>

        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={progressColor} stopOpacity="1" />
          <stop offset="55%" stopColor={progressColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id={valueGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="50%" stopColor="#9ca3af" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Track arc */}
      <path
        d={arcPath}
        fill="transparent"
        stroke={trackColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${arcLength}`}
        strokeDashoffset={0}
      />

      {/* Progress arc (semi-circle gauge) */}
      <motion.path
        d={arcPath}
        fill="transparent"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${arcLength}`}
        strokeDashoffset={dashOffset}
        style={{ filter: `url(#${glowId})` }}
      />

      {/* (Intentionally no crosshair here; keeps the widget clean.) */}

      {showCornerLabels && (
        <>
          <text
            x={startX}
            y={size - 6}
            textAnchor="start"
            fill="rgba(255,255,255,0.35)"
            fontSize={labelFontSize}
            fontWeight={700}
          >
            0%
          </text>
          <text
            x={endX}
            y={size - 6}
            textAnchor="end"
            fill="rgba(255,255,255,0.35)"
            fontSize={labelFontSize}
            fontWeight={700}
          >
            100%
          </text>
        </>
      )}

      {showCenterValue && (
        <text
          x={center}
          y={center + strokeWidth * 0.55}
          textAnchor="middle"
          fill={`url(#${valueGradId})`}
          fontSize={centerFontSize}
          fontWeight={900}
        >
          {safeInt}%
        </text>
      )}
    </svg>
  );
}

