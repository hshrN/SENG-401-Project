import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GradientBackground from "../components/shared/GradientBackground";
import styles from "./Leaderboard.module.css";

const Leaderboard = () => {
  return (
    <div className={styles.container}>
      <GradientBackground idPrefix="leaderboard" />
      <Link to="/" className={styles.backLink}>
        <ArrowLeft size={18} />
        Back to Home
      </Link>
      <div className={styles.formWrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>Top scores and rankings will appear here. Play the game to climb the ranks!</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
