import React, { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useAnimate,
  type Transition,
} from "framer-motion";
import { Activity, AlertTriangle, Leaf, Users } from "lucide-react";
import styles from "./ScoreOrbit.module.css";
import { DeltaPop } from "../deltaPop/DeltaPop";

export type OrbitMetric = {
  id: number;
  name: string;
  value: number;
};

const transition: Transition = {
  delay: 0,
  stiffness: 300,
  damping: 35,
  type: "spring",
  restSpeed: 0.01,
  restDelta: 0.01,
};

const spinConfig = {
  duration: 30,
  ease: "linear" as const,
  repeat: Infinity,
};

const qsa = (root: Element, sel: string) => Array.from(root.querySelectorAll(sel));
const angleOf = (el: Element) => Number((el as HTMLElement).dataset.angle ?? 0);
const armOfItem = (item: Element) =>
  (item as HTMLElement).closest("[data-arm]") as HTMLElement | null;

const delay = (fn: () => void, ms: number) => setTimeout(fn, ms);

interface ScoreOrbitProps {
  items: OrbitMetric[];
  ghostItems?: OrbitMetric[];
  stageSize?: number;
  orbitRadius?: number;
  children: React.ReactNode;
}

export function ScoreOrbit({
  items,
  ghostItems,
  stageSize = 360,
  orbitRadius = 120,
  children,
}: ScoreOrbitProps) {
  const step = 360 / Math.max(1, items.length);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stopsRef = useRef<Array<() => void>>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };
  const registerTimeout = (t: ReturnType<typeof setTimeout>) => {
    timeoutsRef.current.push(t);
  };

  useEffect(() => {
    const root = scope.current;
    if (!root || items.length === 0) return;

    const arms = qsa(root, "[data-arm]");
    const orbitEls = qsa(root, "[data-orbit-item]");
    const stops: Array<() => void> = [];
    stopsRef.current = stops;

    // orbit placement: set initial rotation on arms and counter-rotation on items
    const orbitPlacementSequence = [
      ...arms.map((el) => [
        el,
        { rotate: angleOf(el) },
        { ...transition, at: 0 },
      ]),
      ...orbitEls.map((el) => [
        el,
        {
          rotate: -(armOfItem(el) ? angleOf(armOfItem(el)!) : 0),
          opacity: 1,
        },
        { ...transition, at: 0 },
      ]),
    ];

    registerTimeout(
      delay(() => animate(orbitPlacementSequence as [Element, Record<string, unknown>, Transition][]), 700)
    );

    // start continuous spin
    registerTimeout(
      delay(() => {
        arms.forEach((el) => {
          const angle = angleOf(el);
          const ctrl = animate(el, { rotate: [angle, angle + 360] }, spinConfig);
          stops.push(() => ctrl.stop());
        });
        orbitEls.forEach((el) => {
          const arm = armOfItem(el);
          const angle = arm ? angleOf(arm) : 0;
          const ctrl = animate(
            el,
            { rotate: [-angle, -angle - 360] },
            spinConfig
          );
          stops.push(() => ctrl.stop());
        });
      }, 1300)
    );

    return () => {
      clearTimeouts();
      stops.forEach((stop) => stop());
    };
  }, [items.length, scope, animate]);

  return (
    <LayoutGroup>
      <motion.div
        ref={scope}
        className={styles.stage}
        style={{ width: stageSize, height: stageSize }}
        initial={false}
      >
        <div className={styles.center}>
          <div className={styles.centerContent}>{children}</div>
        </div>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            data-arm
            className={styles.arm}
            style={{ zIndex: items.length - i }}
            data-angle={i * step}
            layoutId={`orbit-arm-${item.id}`}
          >
            <motion.div
              data-orbit-item
              data-metric-id={item.id}
              className={styles.orbitItem}
              style={{
                opacity: i === 0 ? 1 : 0,
                y: -orbitRadius,
              }}
              layoutId={`orbit-item-${item.id}`}
            >
              <OrbitMetricCard
                item={item}
                ghostValue={ghostItems?.find((g) => g.id === item.id)?.value}
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </LayoutGroup>
  );
}

function valueToColor(value: number): string {
  // Piecewise interpolation across red -> yellow -> green.
  // 0-30 => red, 30-50 => red->yellow, 50-70 => yellow->green, 70-100 => green
  const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
  const v = clamp(value, 0, 100);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const redHue = 0; // red
  const yellowHue = 55; // yellow-ish
  const greenHue = 140; // green

  if (v <= 30) return `hsl(${redHue}, 85%, 48%)`;
  if (v <= 50) {
    const t = (v - 30) / 20;
    return `hsl(${lerp(redHue, yellowHue, t)}, 85%, 48%)`;
  }
  if (v <= 70) {
    const t = (v - 50) / 20;
    return `hsl(${lerp(yellowHue, greenHue, t)}, 85%, 48%)`;
  }
  return `hsl(${greenHue}, 85%, 48%)`;
}

function OrbitMetricCard({
  item,
  ghostValue,
}: {
  item: OrbitMetric;
  ghostValue?: number;
}) {
  const currentPercent = Math.max(0, Math.min(100, item.value));
  const fillColor = valueToColor(item.value);

  const isCritical = item.value < 20;
  const shouldPulse =
    typeof ghostValue === "number" && Math.abs(ghostValue - item.value) >= 1;

  // Show delta pop when the metric changes (after a player click).
  const prevValueRef = useRef<number | null>(null);
  const [deltaToShow, setDeltaToShow] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    prevValueRef.current = item.value;

    if (prev === null || prev === undefined) return;

    const delta = item.value - prev;
    if (delta === 0) return;

    setDeltaToShow(delta);
  }, [item.value]);

  return (
    <div className={`${styles.orbitCard} ${isCritical ? styles.orbitCardCritical : ""}`}>
      <div className={styles.orbitLabel}>
        <motion.span
          className={styles.metricIcon}
          aria-hidden
          animate={{ opacity: [0.55, 1, 0.75], scale: [0.98, 1.05, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: "mirror" }}
        >
          {item.id === 1 ? <Leaf size={14} /> : item.id === 2 ? <Users size={14} /> : <Activity size={14} />}
        </motion.span>
        <span>{item.name}</span>
        {isCritical && (
          <motion.span
            className={styles.criticalIcon}
            aria-hidden
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 0.25, repeat: Infinity, repeatType: "mirror" }}
          >
            <AlertTriangle size={14} />
          </motion.span>
        )}
      </div>
      {isCritical && (
        <motion.div
          className={styles.systemCritical}
          aria-hidden
          animate={{ opacity: [0.4, 1, 0.6, 1] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatType: "mirror" }}
        >
          System Critical
        </motion.div>
      )}
      <div className={styles.orbitRow}>
        <div className={styles.orbitTrack}>
          <motion.div
            className={`${styles.orbitFill} ${shouldPulse ? styles.orbitFillPulse : ""}`}
            animate={{
              width: `${currentPercent}%`,
              backgroundColor: fillColor,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              mass: 0.6,
            }}
          />

          <AnimatePresence>
            {deltaToShow !== null && deltaToShow !== 0 && (
              <DeltaPop
                key={`${item.id}-${item.value}`}
                delta={deltaToShow}
                leftPercent={currentPercent}
                onDone={() => setDeltaToShow(null)}
              />
            )}
          </AnimatePresence>
        </div>
        <span className={styles.orbitValue}>{item.value}</span>
      </div>
    </div>
  );
}
