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

  return (
    <motion.span
      className={`${styles.delta} ${isPositive ? styles.deltaPositive : styles.deltaNegative}`}
      style={{
        left: `${Math.max(0, Math.min(100, leftPercent))}%`,
      }}
      aria-hidden
      initial={{
        opacity: 0,
        y: isPositive ? 12 : -12,
        scale: 0.6,
        rotate: isPositive ? -8 : 8,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: isPositive ? [12, -4, -20, -30] : [-12, 4, 18, 28],
        scale: [0.6, 1.18, 1, 0.92],
        rotate: isPositive ? [-8, 0, 0, 4] : [8, 0, 0, -4],
      }}
      transition={{
        duration: 0.82,
        ease: "easeOut",
      }}
      onAnimationComplete={onDone}
    >
      <span className={styles.deltaValue}>{label}</span>
    </motion.span>
  );
}

