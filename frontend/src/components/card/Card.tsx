import React from "react";
import styles from "./Card.module.css";
import { useAudio } from "../../context/AudioContext";

type CardProps = {
  scenario_text: string;
  decision_a: string;
  decision_b: string;
  onChoice: (choice: "a" | "b") => void;
  disabled?: boolean;
};

const Card = ({ scenario_text, decision_a, decision_b, onChoice, disabled }: CardProps) => {
  const { playSound } = useAudio();

  return (
    <div className={styles.card}>
      <p className={styles.scenario}>{scenario_text}</p>
      <div className={styles.buttons}>
        <button
          className={styles.choiceBtn}
          onClick={() => {
            playSound("button_click");
            onChoice("a");
          }}
          disabled={disabled}
        >
          {decision_a}
        </button>
        <button
          className={styles.choiceBtn}
          onClick={() => {
            playSound("button_click");
            onChoice("b");
          }}
          disabled={disabled}
        >
          {decision_b}
        </button>
      </div>
    </div>
  );
};

export default Card;