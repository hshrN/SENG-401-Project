import React, { useEffect, useState } from "react";
import styles from "./Game.module.css";
import Card from "../components/card/Card";
import { useAuth } from "../context/AuthContext";
import { createSession, getNextCard, submitRound, SessionResponse, CardResponse } from "../services/GameService";

const Game = () => {
  const { user } = useAuth();

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
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await createSession(user.username);
      setSession(newSession);
      setBiosphere(newSession.biosphere);
      setSociety(newSession.society);
      setEconomy(newSession.economy);
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
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
      const result = await submitRound(session.session_id, currentCard.card_id, choice);
      setBiosphere(result.biosphere);
      setSociety(result.society);
      setEconomy(result.economy);

      if (result.game_over) {
        setGameOver(true);
        setFinalScore(result.final_score ?? null);
      } else {
        fetchNextCard(session.session_id);
      }
    } catch (err: any) {
      setError(err.message);
      setChoiceDisabled(false);
    }
  };

  const handleRestart = () => {
    setSession(null);
    setCurrentCard(null);
    setGameOver(false);
    setFinalScore(null);
    setBiosphere(50);
    setSociety(50);
    setEconomy(50);
    setError(null);
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <h1>SDG 17: Partnership for the Goals</h1>
        <p>You will face real global challenges. Every decision affects the balance of our world.</p>
        <button onClick={handleStart} disabled={isLoading}>
          {isLoading ? "Starting..." : "Start Game"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className={styles.container}>
        <h1>Game Over</h1>
        <p>One of your metrics collapsed — global coordination failed.</p>
        {finalScore !== null && <h2>Final Score: {finalScore}</h2>}
        <div className={styles.metrics}>
          <MetricBar label="Biosphere" value={biosphere} />
          <MetricBar label="Society" value={society} />
          <MetricBar label="Economy" value={economy} />
        </div>
        <button onClick={handleRestart}>Play Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.metrics}>
        <MetricBar label="Biosphere" value={biosphere} />
        <MetricBar label="Society" value={society} />
        <MetricBar label="Economy" value={economy} />
      </div>
      {isLoading && <p>Loading...</p>}
      {currentCard && (
        <Card
          scenario_text={currentCard.scenario_text}
          decision_a={currentCard.decision_a}
          decision_b={currentCard.decision_b}
          onChoice={handleChoice}
          disabled={choiceDisabled}
        />
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

const MetricBar = ({ label, value }: { label: string; value: number }) => (
  <div style={{ marginBottom: "0.5rem" }}>
    <span>
      {label}: {value}
    </span>
    <div
      style={{
        background: "#eee",
        borderRadius: 4,
        height: 12,
        width: 200,
      }}
    >
      <div
        style={{
          background: value > 30 ? "#2c7a4b" : "#c0392b",
          width: `${value}%`,
          height: "100%",
          borderRadius: 4,
          transition: "width 0.3s",
        }}
      />
    </div>
  </div>
);

export default Game;
