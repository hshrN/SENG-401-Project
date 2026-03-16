import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./TutorialOverlay.module.css";
import { ArrowRight, Check } from "lucide-react";

interface TutorialOverlayProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome to Biosphere Balance",
    content: (
      <>
        <p>In this game, you make decisions that impact the world.</p>
        <p>Your goal is to balance the <strong>Biosphere</strong>, <strong>Society</strong>, and <strong>Economy</strong> for as long as possible.</p>
      </>
    ),
  },
  {
    title: "Watch the Metrics",
    content: (
      <>
        <p>The three metrics orbit the scenario card.</p>
        <p>Every choice you make will cause them to rise or fall. Try to keep them high!</p>
        <p><strong>Warning:</strong> If any metric drops to 30 or below, you are in critical danger.</p>
      </>
    ),
  },
  {
    title: "How to Play",
    content: (
      <>
        <p>Read the scenario on the card, and select one of the two choices provided to respond.</p>
        <p>You can't undo your choices, so choose wisely!</p>
      </>
    ),
  },
  {
    title: "Game Over",
    content: (
      <>
        <p>If any single metric collapses all the way to 0, it's <strong>Game Over</strong>.</p>
        <p>You can always restart and try to beat your own score.</p>
        <p>Good luck!</p>
      </>
    ),
  },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlayOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.tutorialCard}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className={styles.progressContainer}>
            {tutorialSteps.map((_, index) => (
              <div
                key={`dot-${index}`}
                className={`${styles.progressDot} ${
                  index === currentStep ? styles.activeDot : ""
                } ${index < currentStep ? styles.completedDot : ""}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className={styles.stepContent}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className={styles.title}>{tutorialSteps[currentStep].title}</h2>
              <div className={styles.body}>{tutorialSteps[currentStep].content}</div>
            </motion.div>
          </AnimatePresence>

          <div className={styles.footer}>
            <button className={styles.actionBtn} onClick={handleNext}>
              {isLastStep ? (
                <>
                  Got it! <Check size={18} />
                </>
              ) : (
                <>
                  Next <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
