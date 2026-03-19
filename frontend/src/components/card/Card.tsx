import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import styles from "./Card.module.css";
import { useAudio } from "../../context/AudioContext";

type CardProps = {
  decision_a: string;
  decision_b: string;
  onChoice: (choice: "a" | "b") => void;
  // Used by the parent to preview the outcome when hovering decision buttons.
  onHoverChoice?: (choice: "a" | "b" | null) => void;
  disabled?: boolean;
};

const Card = ({
  decision_a,
  decision_b,
  onChoice,
  onHoverChoice,
  disabled,
}: CardProps) => {
  const { playSound } = useAudio();

  const HOLD_MS = 2000;
  const [holdingChoice, setHoldingChoice] = useState<"a" | "b" | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const lastHoverSoundAtRef = useRef(0);

  const maybeBlip = () => {
    const now = Date.now();
    if (now - lastHoverSoundAtRef.current < 450) return;
    lastHoverSoundAtRef.current = now;
    // Using the existing SFX asset as a stand-in for a light “blip”.
    playSound("button_click");
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stopHolding = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    completedRef.current = false;
    setHoldingChoice(null);
    setHoldProgress(0);
    onHoverChoice?.(null);
  };

  const startHolding = (choice: "a" | "b") => {
    if (disabled) return;
    if (holdingChoice !== null) return;

    completedRef.current = false;
    startRef.current = performance.now();
    setHoldingChoice(choice);
    setHoldProgress(0);

    const tick = () => {
      const start = startRef.current ?? performance.now();
      const now = performance.now();
      const p = Math.min(1, (now - start) / HOLD_MS);
      setHoldProgress(p);

      if (p >= 1 && !completedRef.current) {
        completedRef.current = true;
        setHoldingChoice(null);
        setHoldProgress(0);
        onHoverChoice?.(null);
        playSound("button_click");
        onChoice(choice);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const buttonsDisabled = Boolean(disabled) || holdingChoice !== null;
  const circle = 2 * Math.PI * 18;
  const dashOffset = circle * (1 - holdProgress);

  return (
    <div className={styles.card}>
      <div className={styles.buttons}>
        <button
          className={styles.choiceBtn}
          disabled={buttonsDisabled}
          onMouseEnter={() => {
            maybeBlip();
            onHoverChoice?.("a");
          }}
          onMouseLeave={() => onHoverChoice?.(null)}
          onFocus={() => {
            maybeBlip();
            onHoverChoice?.("a");
          }}
          onBlur={() => onHoverChoice?.(null)}
          onPointerDown={() => startHolding("a")}
          onPointerUp={() => stopHolding()}
          onPointerCancel={() => stopHolding()}
          onPointerLeave={() => stopHolding()}
        >
          {holdingChoice === "a" && (
            <div className={styles.holdRing} aria-hidden>
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle
                  cx="27"
                  cy="27"
                  r="18"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="3"
                  fill="transparent"
                />
                <motion.circle
                  cx="27"
                  cy="27"
                  r="18"
                  stroke="rgba(52,211,153,0.9)"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={circle}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
          {decision_a}
        </button>
        <button
          className={styles.choiceBtn}
          disabled={buttonsDisabled}
          onMouseEnter={() => {
            maybeBlip();
            onHoverChoice?.("b");
          }}
          onMouseLeave={() => onHoverChoice?.(null)}
          onFocus={() => {
            maybeBlip();
            onHoverChoice?.("b");
          }}
          onBlur={() => onHoverChoice?.(null)}
          onPointerDown={() => startHolding("b")}
          onPointerUp={() => stopHolding()}
          onPointerCancel={() => stopHolding()}
          onPointerLeave={() => stopHolding()}
        >
          {holdingChoice === "b" && (
            <div className={styles.holdRing} aria-hidden>
              <svg width="54" height="54" viewBox="0 0 54 54">
                <circle
                  cx="27"
                  cy="27"
                  r="18"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="3"
                  fill="transparent"
                />
                <motion.circle
                  cx="27"
                  cy="27"
                  r="18"
                  stroke="rgba(239,68,68,0.9)"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={circle}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
          {decision_b}
        </button>
      </div>
    </div>
  );
};

export default Card;