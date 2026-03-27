import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./TutorialOverlay.module.css";
import { ArrowRight, Check } from "lucide-react";

interface TutorialOverlayProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome to Global Coalition Sim",
    content: (
      <>
        <p>You are steering a fragile coalition through escalating global crises.</p>
        <p>Your goal is to finish the selected mission while keeping <strong>Biosphere</strong>, <strong>Society</strong>, and <strong>Economy</strong> from collapsing.</p>
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
    title: "Read the Current State",
    content: (
      <>
        <p>The middle state card shows the current world condition while the metrics orbit around it.</p>
        <p>Use that center panel and the warning text below your choices to judge how much pressure the coalition is under.</p>
      </>
    ),
  },
  {
    title: "Sign to Confirm",
    content: (
      <>
        <p>Read the scenario, then <strong>hold</strong> one option until the signing meter reaches 100%.</p>
        <p>The orbit preview shows where each choice is likely to push your metrics before you commit.</p>
      </>
    ),
  },
  {
    title: "Pressure Builds Over Time",
    content: (
      <>
        <p>Neglecting the same pillar repeatedly creates hidden pressure that keeps hurting later turns.</p>
        <p>Short-term gains can leave long-term scars, so a stable-looking run can still unravel if you ignore warning signs.</p>
      </>
    ),
  },
  {
    title: "Mission Complete or Collapse",
    content: (
      <>
        <p>If any single metric falls all the way to <strong>0</strong>, the coalition collapses and the run ends.</p>
        <p>If you survive through your chosen card count, you complete the mission and can post your score to the leaderboard.</p>
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
