import React from "react";
import styles from "./Home.module.css"
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const Home = () => {
  const { isLoggedIn, logout, user } = useAuth();

  return (
    <div className={styles.container}>
      
        {isLoggedIn ? (
          <h1 className={styles.title}>
            Welcome to Project Name, {user?.username}!
          </h1>
        ) : (
          <h1 
            className={styles.title}>Welcome to Project Name
          </h1>
        )}

      <p className={styles.description}>
      </p>

      <div className={styles.cardRow}>
        {/* city card on left */}
        <img
          src="/assets/card_city.png"
          alt="city card"
          className={styles.svgCard}
        />

        <div className={styles.buttonRow}>

        {isLoggedIn ? (
          <button className={styles.button} onClick={logout}>
            Logout
          </button>
        ) : (
          <Link className={styles.link} to="/login">
            Login
          </Link>
        )}

         {/* about and play buttons */}

        <Link className={styles.aboutButton} to="/about">
          About
        </Link>

        <Link className={styles.playButton} to="/game">
          Play
        </Link>
      </div>
        {/* village stars card on right */}
        <img
          src="/assets/card_village_stars.png"
          alt="village stars card"
          className={styles.starCard}
        />
      </div>

      
    </div>
    
  );
};

export default Home;