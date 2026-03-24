import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./RadialActionMenu.module.css";

export type RadialMenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
};

type RadialActionMenuProps = {
  items: RadialMenuItem[];
  size?: number;
  iconSize?: number;
  triggerIcon: React.ReactNode;
  triggerAriaLabel?: string;
};

const FAN_START_DEG = -20;
const FAN_END_DEG = 95;

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

export function RadialActionMenu({
  items,
  size = 230,
  iconSize = 18,
  triggerIcon,
  triggerAriaLabel = "Open menu",
}: RadialActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const triggerSize = 40;
  const triggerCenter = triggerSize / 2;

  const { iconRingRadius, arcRadius } = useMemo(() => {
    const iconRing = Math.max(70, size * 0.34);
    const guideArc = iconRing + 16;
    return {
      iconRingRadius: iconRing,
      arcRadius: guideArc,
    };
  }, [size]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const fanSpan = FAN_END_DEG - FAN_START_DEG;
  const arcStart = polarToCartesian(arcRadius, FAN_START_DEG);
  const arcEnd = polarToCartesian(arcRadius, FAN_END_DEG);
  const largeArcFlag = fanSpan > 180 ? 1 : 0;
  const arcPath = `M ${triggerCenter + arcStart.x} ${triggerCenter + arcStart.y} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 1 ${triggerCenter + arcEnd.x} ${triggerCenter + arcEnd.y}`;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ width: size, height: size }}
    >
      <button
        type="button"
        className={styles.trigger}
        aria-label={triggerAriaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {triggerIcon}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.menuSurface}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <svg className={styles.wedges} width={size} height={size} aria-hidden>
              <path d={arcPath} className={styles.arcGuide} />
            </svg>

            {items.map((it, index) => {
              const t = items.length <= 1 ? 0.5 : index / (items.length - 1);
              const midDeg = FAN_START_DEG + fanSpan * t;
              const { x, y } = polarToCartesian(iconRingRadius, midDeg);
              const left = triggerCenter + x;
              const top = triggerCenter + y;

              return (
                <motion.button
                  key={it.id}
                  type="button"
                  className={styles.itemButton}
                  style={{ left, top, width: iconSize * 2.2, height: iconSize * 2.2 }}
                  aria-label={it.label}
                  initial={{ opacity: 0, scale: 0.7, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.7, x: -8 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  onClick={() => {
                    it.onSelect();
                    setOpen(false);
                  }}
                >
                  <span className={styles.itemIcon} aria-hidden>
                    {it.icon}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

