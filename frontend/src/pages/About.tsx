import React from "react";
import GradientBackground from "../components/shared/GradientBackground";
import GlobalNav from "../components/shared/GlobalNav";
import styles from "./About.module.css";

const About = () => {
  return (
    <div className={styles.container}>
      <GradientBackground idPrefix="about" />
      <GlobalNav backClassName={styles.backLink} />

      <div className={styles.formWrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>About This Game</h1>
          <div className={styles.textBlock}>
            <p className={styles.text}>
              This game is based on the popular game &quot;Reigns&quot;. Make decisions by
              choosing one of two options and see how your choices affect the world. Can you
              maintain a balance between the Sustainable Development Goals? Play now to find out!
            </p>
          </div>
          <div className={styles.textBlock}>
            <p className={styles.text}>
              You can log in to track your progress and see how you rank on the leaderboard.
              Enjoy the game and good luck maintaining the balance!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
