import React, { useEffect, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import styles from "./StateImageCarousel.module.css";

const FACE_COUNT = 19;
const IMAGE_URLS = Array.from(
  { length: FACE_COUNT },
  (_, i) => `/assets/${i + 1}.png`
);

const ROTATION_TRANSITION = {
  type: "spring" as const,
  stiffness: 80,
  damping: 25,
  mass: 0.5,
};

interface StateImageCarouselProps {
  /** Current state image index 1–19; carousel rotates to this face */
  activeIndex: number;
}

export function StateImageCarousel({ activeIndex }: StateImageCarouselProps) {
  const controls = useAnimation();

  const cylinderWidth = 3200;
  const faceWidth = cylinderWidth / FACE_COUNT;
  const radius = cylinderWidth / (2 * Math.PI);

  const targetRotation = useMemo(
    () => -(activeIndex - 1) * (360 / FACE_COUNT),
    [activeIndex]
  );

  useEffect(() => {
    controls.start({
      rotateY: targetRotation,
      transition: ROTATION_TRANSITION,
    });
  }, [targetRotation, controls]);

  return (
    <div className={styles.wrapper}>
      <motion.div
        className={styles.cylinder}
        style={{
          width: cylinderWidth,
          transformStyle: "preserve-3d",
        }}
        animate={controls}
        initial={{ rotateY: targetRotation }}
      >
        {IMAGE_URLS.map((src, i) => (
          <div
            key={src}
            className={styles.face}
            style={{
              width: faceWidth,
              transform: `rotateY(${i * (360 / FACE_COUNT)}deg) translateZ(${radius}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <img
              src={src}
              alt=""
              className={styles.faceImage}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
