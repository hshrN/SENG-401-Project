import React from "react";
import { motion } from "framer-motion";
import styles from "./DeltaPop.module.css";

export function DeltaPop({
  delta,
  leftPercent,
  onDone,
}: {
  delta: number;
  leftPercent: number;
  onDone: () => void;
}) {
  const isPositive = delta > 0;
  const magnitude = Math.abs(delta);
  const label = isPositive ? `+${magnitude}` : `-${magnitude}`;

  const color = isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";

  return (
    <motion.span
      className={styles.delta}
      style={{
        left: `${Math.max(0, Math.min(100, leftPercent))}%`,
        color,
        textShadow: isPositive
          ? "0 0 10px rgba(34, 197, 94, 0.35)"
          : "0 0 10px rgba(239, 68, 68, 0.35)",
      }}
      aria-hidden
      initial={{
        opacity: 0,
        y: isPositive ? 8 : -8,
        scale: 0.95,
      }}
      animate={{
        opacity: 0,
        y: isPositive ? -22 : 22,
        scale: 1,
      }}
      transition={{
        duration: 0.65,
        ease: "easeOut",
      }}
      onAnimationComplete={onDone}
    >
      {label}
    </motion.span>
  );
}

