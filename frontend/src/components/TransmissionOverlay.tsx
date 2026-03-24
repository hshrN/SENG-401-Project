import React, { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import styles from "./TransmissionOverlay.module.css";

export function TransmissionOverlay({ scenarioText }: { scenarioText: string }) {
  const [typed, setTyped] = useState("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setTyped("");

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const text = scenarioText ?? "";
    if (!text.length) return;

    const speedMs = Math.max(8, 22 - Math.floor(text.length / 40));

    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i < text.length) {
        timeoutRef.current = window.setTimeout(tick, speedMs);
      }
    };

    timeoutRef.current = window.setTimeout(tick, speedMs);

    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [scenarioText]);

  return (
    <div className={styles.transmission} aria-hidden>
      <div className={styles.transmissionRadio}>
        <Radio size={16} />
      </div>

      <p className={styles.scenario}>
        {typed}
        {typed.length < scenarioText.length && <span className={styles.typeCursor}>|</span>}
      </p>
    </div>
  );
}

