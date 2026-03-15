import React, { useEffect, useRef } from "react";
import {
  LayoutGroup,
  motion,
  useAnimate,
  type Transition,
} from "framer-motion";
import styles from "./ScoreOrbit.module.css";

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
  stageSize?: number;
  orbitRadius?: number;
  children: React.ReactNode;
}

export function ScoreOrbit({
  items,
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
              className={styles.orbitItem}
              style={{
                opacity: i === 0 ? 1 : 0,
                y: -orbitRadius,
              }}
              layoutId={`orbit-item-${item.id}`}
            >
              <OrbitMetricCard item={item} />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </LayoutGroup>
  );
}

function OrbitMetricCard({ item }: { item: OrbitMetric }) {
  const isLow = item.value <= 30;
  return (
    <div className={styles.orbitCard}>
      <div className={styles.orbitLabel}>{item.name}</div>
      <div className={styles.orbitRow}>
        <div className={styles.orbitTrack}>
          <div
            className={`${styles.orbitFill} ${isLow ? styles.orbitFillLow : styles.orbitFillHigh}`}
            style={{
              width: `${Math.max(0, Math.min(100, item.value))}%`,
            }}
          />
        </div>
        <span className={styles.orbitValue}>{item.value}</span>
      </div>
    </div>
  );
}
