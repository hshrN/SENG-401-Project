import React, { useEffect, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import { Target } from "lucide-react";
import styles from "./StateImageCarousel.module.css";
import { CARD_FACE_COUNT, CARD_FACE_URLS } from "../../utils/cardFaceState";

const IMAGE_URLS = CARD_FACE_URLS;
const FACE_COUNT = CARD_FACE_COUNT;

const ROTATION_TRANSITION = {
  type: "spring" as const,
  stiffness: 80,
  damping: 25,
  mass: 0.5,
};

interface StateImageCarouselProps {
  /** Current state image index 1–19; carousel rotates to this face */
  activeIndex: number;
  /** Optional additional rotateY applied to the whole carousel */
  hoverTiltDeg?: number;
}

export function StateImageCarousel({ activeIndex, hoverTiltDeg = 0 }: StateImageCarouselProps) {
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

  const active0 = Math.max(0, Math.min(FACE_COUNT - 1, Math.round(activeIndex) - 1));

  return (
    <motion.div
      className={styles.wrapper}
      style={{ transformStyle: "preserve-3d" }}
      animate={{ rotateY: hoverTiltDeg }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <motion.div
        className={styles.cylinder}
        style={{
          width: cylinderWidth,
          transformStyle: "preserve-3d",
        }}
        animate={controls}
        initial={{ rotateY: targetRotation }}
      >
        {IMAGE_URLS.map((src, i) => {
          const rawOffset = i - active0;
          const half = FACE_COUNT / 2;
          const signedDistance = ((rawOffset + half) % FACE_COUNT) - half;
          const fanDir = signedDistance >= 0 ? 1 : -1;

          const isActive = i === active0;
          const fanRotY = isActive ? 0 : fanDir * 25;
              const scale = isActive ? 1.25 : 1.0;

          return (
            <motion.div
              key={src}
              className={styles.face}
              style={{
                width: faceWidth,
                transform: `rotateY(${i * (360 / FACE_COUNT)}deg) translateZ(${radius}px)`,
                transformStyle: "preserve-3d",
              }}
              animate={{
                opacity: isActive ? 1 : 0.4,
                filter: isActive ? "none" : "grayscale(0.8)",
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <motion.div
                className={styles.faceInner}
                style={{
                  transform: `rotateY(${fanRotY}deg) scale(${scale})`,
                  transformStyle: "preserve-3d",
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <img src={src} alt="" className={styles.faceImage} />

                {isActive && (
                  <>
                    <motion.div
                      className={styles.cornerIcon}
                      style={{ top: 12, left: 12 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Target size={22} />
                    </motion.div>
                    <motion.div
                      className={styles.cornerIcon}
                      style={{ top: 12, right: 12, left: "auto" }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Target size={22} />
                    </motion.div>
                    <motion.div
                      className={styles.cornerIcon}
                      style={{ bottom: 12, left: 12 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Target size={22} />
                    </motion.div>
                    <motion.div
                      className={styles.cornerIcon}
                      style={{ bottom: 12, right: 12, left: "auto" }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Target size={22} />
                    </motion.div>
                  </>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
