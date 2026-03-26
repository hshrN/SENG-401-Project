import React, { useEffect, useRef, useState } from "react";
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

  const HOLD_MS = 1500;
  const [holdingChoice, setHoldingChoice] = useState<"a" | "b" | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const holdSoundRef = useRef<HTMLAudioElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);


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
    activePointerIdRef.current = null;
    setHoldingChoice(null);
    setHoldProgress(0);
    onHoverChoice?.(null);
    if (holdSoundRef.current) {
      holdSoundRef.current.pause();
      holdSoundRef.current.currentTime = 0;
      holdSoundRef.current = null;
    }
  };

  const startHolding = (
    choice: "a" | "b",
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (disabled) return;
    if (holdingChoice !== null) return;

    completedRef.current = false;
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = performance.now();
    setHoldingChoice(choice);
    setHoldProgress(0);
    onHoverChoice?.(choice);

    const audioNode = playSound("button_hold");
    if (audioNode) {
      holdSoundRef.current = audioNode;
    }

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
        if (holdSoundRef.current) {
          holdSoundRef.current.pause();
          holdSoundRef.current.currentTime = 0;
          holdSoundRef.current = null;
        }
        playSound("choice_cost");
        onChoice(choice);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const baseDisabled = Boolean(disabled);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardHeaderEyebrow}>Response</span>
        <h2 className={styles.cardHeaderTitle}>Choose one path</h2>
        <p className={styles.cardHeaderHint}>Hold to confirm your decision</p>
      </div>

      <div className={styles.decisionGrid} role="group" aria-label="Decision options">
        <button
          type="button"
          className={`${styles.decisionCard} ${styles.decisionCardA} ${holdingChoice === "b" ? styles.decisionCardIdle : ""
            }`}
          disabled={baseDisabled || holdingChoice === "b"}
          aria-label={`Option A: ${decision_a}`}
          onMouseEnter={() => {
            onHoverChoice?.("a");
          }}
          onMouseLeave={() => onHoverChoice?.(null)}
          onFocus={() => {
            onHoverChoice?.("a");
          }}
          onBlur={() => onHoverChoice?.(null)}
          onPointerDown={(event) => startHolding("a", event)}
          onPointerUp={(event) => {
            if (activePointerIdRef.current === event.pointerId) stopHolding();
          }}
          onPointerCancel={(event) => {
            if (activePointerIdRef.current === event.pointerId) stopHolding();
          }}
          onLostPointerCapture={(event) => {
            if (activePointerIdRef.current === event.pointerId) stopHolding();
          }}
        >
          <span className={styles.decisionCardKicker}>Option A</span>
          <span className={styles.decisionCardText}>{decision_a}</span>
          {holdingChoice === "a" && (
            <div className={styles.holdBarTrack} aria-hidden>
              <div
                className={`${styles.holdBarFill} ${styles.holdBarFillA}`}
                style={{ width: `${holdProgress * 100}%` }}
              />
            </div>
          )}
        </button>

        <button
          type="button"
          className={`${styles.decisionCard} ${styles.decisionCardB} ${holdingChoice === "a" ? styles.decisionCardIdle : ""
            }`}
          disabled={baseDisabled || holdingChoice === "a"}
          aria-label={`Option B: ${decision_b}`}
          onMouseEnter={() => {
            onHoverChoice?.("b");
          }}
          onMouseLeave={() => onHoverChoice?.(null)}
          onFocus={() => {
            onHoverChoice?.("b");
          }}
          onBlur={() => onHoverChoice?.(null)}
          onPointerDown={(event) => startHolding("b", event)}
          onPointerUp={(event) => {
            if (activePointerIdRef.current === event.pointerId) stopHolding();
          }}
          onPointerCancel={(event) => {
            if (activePointerIdRef.current === event.pointerId) stopHolding();
          }}
          onLostPointerCapture={(event) => {
            if (activePointerIdRef.current === event.pointerId) stopHolding();
          }}
        >
          <span className={styles.decisionCardKicker}>Option B</span>
          <span className={styles.decisionCardText}>{decision_b}</span>
          {holdingChoice === "b" && (
            <div className={styles.holdBarTrack} aria-hidden>
              <div
                className={`${styles.holdBarFill} ${styles.holdBarFillB}`}
                style={{ width: `${holdProgress * 100}%` }}
              />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Card;
