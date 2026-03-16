import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Game.module.css";
import Card from "../components/card/Card";
import { ScoreOrbit } from "../components/scoreOrbit";
import GradientBackground from "../components/shared/GradientBackground";
import { useAuth } from "../context/AuthContext";
import { useAudio } from "../context/AudioContext";
import { createSession, getNextCard, submitRound, type SessionResponse, type CardResponse } from "../application/gameService";
import { getCardFaceIndex } from "../utils/cardFaceState";
import { StateImageCarousel } from "../components/stateImageCarousel";
import AudioControls from "../components/shared/AudioControls";

/** Background mood from metrics: critical (red), warning (yellow), healthy (green) */
function getBackgroundMood(biosphere: number, society: number, economy: number): "critical" | "warning" | "healthy" {
  const min = Math.min(biosphere, society, economy);
  if (min <= 30) return "critical";
  if (min <= 45) return "warning";
  return "healthy";
}

const Game = () => {
  const { user } = useAuth();
  const { playSound } = useAudio();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentCard, setCurrentCard] = useState<CardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [choiceDisabled, setChoiceDisabled] = useState(false);

  const [biosphere, setBiosphere] = useState(50);
  const [society, setSociety] = useState(50);
  const [economy, setEconomy] = useState(50);

  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchNextCard(session.session_id);
    }
  }, [session]);

  const handleStart = async () => {
    playSound("button_click");
    const username = user?.username?.trim();
    if (!username) {
      setError("You must be logged in to start a game.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await createSession(username);
      setSession(newSession);
      setBiosphere(newSession.biosphere);
      setSociety(newSession.society);
      setEconomy(newSession.economy);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextCard = async (session_id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const card = await getNextCard(session_id);
      setCurrentCard(card);
      setChoiceDisabled(false);
    } catch {
      setGameOver(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (choice: "a" | "b") => {
    if (!session || !currentCard) return;
    setChoiceDisabled(true);
    setError(null);
    try {
      const result = await submitRound(session.session_id, currentCard.scenario_id, choice);
      setBiosphere(result.biosphere);
      setSociety(result.society);
      setEconomy(result.economy);

      if (result.game_over) {
        setGameOver(true);
        setFinalScore(result.final_score ?? null);
      } else {
        fetchNextCard(session.session_id);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
      setChoiceDisabled(false);
    }
  };

  const handleRestart = () => {
    playSound("button_click");
    setSession(null);
    setCurrentCard(null);
    setGameOver(false);
    setFinalScore(null);
    setBiosphere(50);
    setSociety(50);
    setEconomy(50);
    setError(null);
  };

  const MetricBar = ({ label, value }: { label: string; value: number }) => {
    const isLow = value <= 30;
    return (
      <div className={styles.metricRow}>
        <div className={styles.metricLabel}>
          <span>{label}</span>
          <span className={styles.metricValue}>{value}</span>
        </div>
        <div className={styles.metricTrack}>
          <div
            className={`${styles.metricFill} ${isLow ? styles.metricFillLow : styles.metricFillHigh}`}
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      </div>
    );
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <GradientBackground idPrefix="game" />
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <div className={styles.content}>
          <div className={`${styles.card} ${styles.startCard}`}>
            <h1 className={styles.title}>SDG 17: Partnership for the Goals</h1>
            <p className={styles.subtitle}>
              You will face real global challenges. Every decision affects the balance of our world.
            </p>
            <button type="button" className={styles.primaryBtn} onClick={handleStart} disabled={isLoading}>
              {isLoading ? "Starting..." : "Start Game"}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
        <AudioControls />
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className={styles.container}>
        <GradientBackground idPrefix="game" />
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <div className={styles.content}>
          <div className={styles.card}>
            <h1 className={styles.gameOverTitle}>Game Over</h1>
            <p className={styles.gameOverSubtitle}>One of your metrics collapsed — global coordination failed.</p>
            {finalScore !== null && <p className={styles.finalScore}>Final Score: {finalScore}</p>}
            <div className={styles.metrics}>
              <MetricBar label="Biosphere" value={biosphere} />
              <MetricBar label="Society" value={society} />
              <MetricBar label="Economy" value={economy} />
            </div>
            <button type="button" className={styles.primaryBtn} onClick={handleRestart}>
              Play Again
            </button>
          </div>
        </div>
        <AudioControls />
      </div>
    );
  }

  const backgroundMood = getBackgroundMood(biosphere, society, economy);

  return (
    <div className={styles.container}>
      <GradientBackground idPrefix="game" />
      <AnimatePresence mode="wait">
        <motion.div
          key={backgroundMood}
          className={`${styles.stateOverlay} ${styles[`stateOverlay${backgroundMood.charAt(0).toUpperCase() + backgroundMood.slice(1)}`]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          aria-hidden
        />
      </AnimatePresence>
      <Link to="/" className={styles.backLink}>
        <ArrowLeft size={18} />
        Back to Home
      </Link>
      <div className={styles.content}>
        <div className={styles.scenarioWrap}>
          <div className={styles.centerRow}>
            <div className={styles.scenarioCardCol}>
              <ScoreOrbit
                items={[
                  { id: 1, name: "Biosphere", value: biosphere },
                  { id: 2, name: "Society", value: society },
                  { id: 3, name: "Economy", value: economy },
                ]}
                stageSize={800}
                orbitRadius={360}
              >
                {isLoading && <p className={styles.loading}>Loading...</p>}
                {currentCard && (
                  <Card
                    scenario_text={currentCard.scenario_text}
                    decision_a={currentCard.decision_a}
                    decision_b={currentCard.decision_b}
                    onChoice={handleChoice}
                    disabled={choiceDisabled}
                  />
                )}
              </ScoreOrbit>
            </div>
            <div className={styles.cardFaceCol} aria-hidden>
              <StateImageCarousel
                activeIndex={getCardFaceIndex(biosphere, society, economy)}
              />
            </div>
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <AudioControls />
    </div>
  );
};

export default Game;
