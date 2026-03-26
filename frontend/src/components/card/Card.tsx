import React, { useCallback, useEffect, useRef, useState } from "react";
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

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getHoldSpectrumColor(progress: number) {
  const safe = clampProgress(progress);
  const hue = 6 + safe * 134;
  const lightness = 49 + safe * 8;
  return `hsl(${hue}, 92%, ${lightness}%)`;
}

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
  const hoverChoiceRef = useRef(onHoverChoice);

  useEffect(() => {
    hoverChoiceRef.current = onHoverChoice;
  }, [onHoverChoice]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (holdSoundRef.current) {
        holdSoundRef.current.pause();
        holdSoundRef.current.currentTime = 0;
        holdSoundRef.current = null;
      }
    };
  }, []);

  const stopHolding = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    completedRef.current = false;
    activePointerIdRef.current = null;
    setHoldingChoice(null);
    setHoldProgress(0);
    hoverChoiceRef.current?.(null);
    if (holdSoundRef.current) {
      holdSoundRef.current.pause();
      holdSoundRef.current.currentTime = 0;
      holdSoundRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (disabled) stopHolding();
  }, [disabled, stopHolding]);

  useEffect(() => {
    stopHolding();
  }, [decision_a, decision_b, stopHolding]);

  const startHolding = (
    choice: "a" | "b",
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (disabled) return;
    if (holdingChoice !== null) return;

    event.preventDefault();
    completedRef.current = false;
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = performance.now();
    setHoldingChoice(choice);
    setHoldProgress(0.01);
    hoverChoiceRef.current?.(choice);

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
        hoverChoiceRef.current?.(null);
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
  const holdPercent = Math.round(holdProgress * 100);
  const holdProgressA = holdingChoice === "a" ? holdProgress : 0;
  const holdProgressB = holdingChoice === "b" ? holdProgress : 0;
  const holdColorA = getHoldSpectrumColor(holdProgressA);
  const holdColorB = getHoldSpectrumColor(holdProgressB);

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
            hoverChoiceRef.current?.("a");
          }}
          onMouseLeave={() => hoverChoiceRef.current?.(null)}
          onFocus={() => {
            hoverChoiceRef.current?.("a");
          }}
          onBlur={() => hoverChoiceRef.current?.(null)}
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
          <div
            className={`${styles.holdBarTrack} ${
              holdingChoice === "a" ? styles.holdBarTrackActive : ""
            }`}
            aria-hidden
          >
            <div
              className={`${styles.holdBarFill} ${styles.holdBarFillA}`}
              style={{
                transform: `scaleX(${Math.max(holdProgressA, 0.001)})`,
                background: `linear-gradient(90deg, ${getHoldSpectrumColor(
                  Math.max(holdProgressA - 0.55, 0),
                )} 0%, ${getHoldSpectrumColor(
                  Math.max(holdProgressA - 0.2, 0),
                )} 55%, ${holdColorA} 100%)`,
                boxShadow: `0 0 16px ${holdColorA}`,
              }}
            />
            <span className={styles.holdBarLabel}>
              {holdingChoice === "a" ? `Signing ${holdPercent}%` : "Sign"}
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.decisionCard} ${styles.decisionCardB} ${holdingChoice === "a" ? styles.decisionCardIdle : ""
            }`}
          disabled={baseDisabled || holdingChoice === "a"}
          aria-label={`Option B: ${decision_b}`}
          onMouseEnter={() => {
            hoverChoiceRef.current?.("b");
          }}
          onMouseLeave={() => hoverChoiceRef.current?.(null)}
          onFocus={() => {
            hoverChoiceRef.current?.("b");
          }}
          onBlur={() => hoverChoiceRef.current?.(null)}
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
          <div
            className={`${styles.holdBarTrack} ${
              holdingChoice === "b" ? styles.holdBarTrackActive : ""
            }`}
            aria-hidden
          >
            <div
              className={`${styles.holdBarFill} ${styles.holdBarFillB}`}
              style={{
                transform: `scaleX(${Math.max(holdProgressB, 0.001)})`,
                background: `linear-gradient(90deg, ${getHoldSpectrumColor(
                  Math.max(holdProgressB - 0.55, 0),
                )} 0%, ${getHoldSpectrumColor(
                  Math.max(holdProgressB - 0.2, 0),
                )} 55%, ${holdColorB} 100%)`,
                boxShadow: `0 0 16px ${holdColorB}`,
              }}
            />
            <span className={styles.holdBarLabel}>
              {holdingChoice === "b" ? `Signing ${holdPercent}%` : "Sign"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Card;
