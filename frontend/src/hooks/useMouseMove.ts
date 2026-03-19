import { useCallback, useRef, useState, type MouseEvent } from "react";

export function useMouseMove(maxTiltDeg: number = 8) {
  const [tilt, setTilt] = useState({ tiltX: 0, tiltY: 0 });
  const rafRef = useRef<number | null>(null);
  const latestRef = useRef({ tiltX: 0, tiltY: 0 });

  const commit = useCallback(() => {
    rafRef.current = null;
    setTilt(latestRef.current);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = (e.clientX - rect.left) / rect.width; // 0..1
      const y = (e.clientY - rect.top) / rect.height; // 0..1

      const normX = (x - 0.5) * 2; // -1..1
      const normY = (y - 0.5) * 2; // -1..1

      // Tilt toward cursor: moving right => tilt toward right.
      const nextTiltX = -normY * maxTiltDeg;
      const nextTiltY = normX * maxTiltDeg;

      latestRef.current = { tiltX: nextTiltX, tiltY: nextTiltY };
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(commit);
      }
    },
    [commit, maxTiltDeg]
  );

  const onMouseLeave = useCallback(() => {
    latestRef.current = { tiltX: 0, tiltY: 0 };
    setTilt({ tiltX: 0, tiltY: 0 });
  }, []);

  return {
    tiltX: tilt.tiltX,
    tiltY: tilt.tiltY,
    onMouseMove,
    onMouseLeave,
  };
}

