import React from "react";
import styles from "./About.module.css";

const About = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>About This Game</h1>
      <p className={styles.text}>
                This game is based on the popular game "Reigns". 
                Make decisions by swiping left or right and see how your choices affect the world.
                Can you maintain a balance between the Sustainable Development Goals? 
                Play now to find out!
      </p>
      <p className={styles.text}>
        You can log in to track your progress and see how you rank on the
        leaderboard. Enjoy the game and good luck maintaining the balance!
      </p>
      <a className={styles.link} href="/">
        ← Back to Home
      </a>
    </div>
  );
};

export default About;
