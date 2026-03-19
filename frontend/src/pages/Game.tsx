import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Volume2, VolumeX } from "lucide-react";
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
import { TutorialOverlay } from "../components/tutorial";
import AudioControls from "../components/shared/AudioControls";
import { TransmissionOverlay } from "../components/TransmissionOverlay";
import type { RadialMenuItem } from "../components/radialMenu/RadialActionMenu";
import { CommandBarMetric } from "../components/commandBar/CommandBarMetric";
import GlobalNav from "../components/shared/GlobalNav";

/** Background mood from metrics: critical (red), warning (yellow), healthy (green) */
function getBackgroundMood(biosphere: number, society: number, economy: number): "critical" | "warning" | "healthy" {
  const min = Math.min(biosphere, society, economy);
  if (min <= 30) return "critical";
  if (min <= 45) return "warning";
  return "healthy";
}

function getWorldState(biosphere: number, society: number, economy: number): {
  zone: "critical" | "warning" | "healthy";
  metricName: "Biosphere" | "Society" | "Economy";
  metricValue: number;
} {
  const min = Math.min(biosphere, society, economy);

  let metricName: "Biosphere" | "Society" | "Economy" = "Biosphere";
  let metricValue = biosphere;
  if (society <= biosphere && society <= economy) {
    metricName = "Society";
    metricValue = society;
  } else if (economy <= biosphere && economy <= society) {
    metricName = "Economy";
    metricValue = economy;
  }

  if (min < 20) return { zone: "critical", metricName, metricValue };
  if (min < 30) return { zone: "warning", metricName, metricValue };
  return { zone: "healthy", metricName, metricValue };
}

const Game = () => {
  const { user } = useAuth();
  const { isMuted, playSound, startBgm, stopBgm, setBgmSpeed, toggleMute } = useAudio();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentCard, setCurrentCard] = useState<CardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [choiceDisabled, setChoiceDisabled] = useState(false);

  const [biosphere, setBiosphere] = useState(50);
  const [society, setSociety] = useState(50);
  const [economy, setEconomy] = useState(50);

  const [showTutorial, setShowTutorial] = useState(false);
  const [showDecisionCard, setShowDecisionCard] = useState(true);
  const [hoveredChoice, setHoveredChoice] = useState<"a" | "b" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousCard, setPreviousCard] = useState<{
    scenario_text: string;
    decision_a: string;
    decision_b: string;
    chosen: "a" | "b";
  } | null>(null);
  const [previousDecisionText, setPreviousDecisionText] = useState<string | null>(null);
  const [showPreviousCardPopup, setShowPreviousCardPopup] = useState(false);

  const navigate = useNavigate();

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (session) {
      // Check if user has seen tutorial before fetching cards
      const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
      fetchNextCard(session.session_id);
    } else {
      stopBgm(); // Stop backgound music when session is cleared
    }
  }, [session, stopBgm]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Handle Dynamic Background Music Speed
  useEffect(() => {
    if (session && !gameOver) {
      const minMetric = Math.min(biosphere, society, economy);
      let targetSpeed: 1 | 2 | 4 | 8 = 1;
      
      if (minMetric < 10) targetSpeed = 8;
      else if (minMetric < 25) targetSpeed = 4;
      else if (minMetric < 40) targetSpeed = 2;
      
      setBgmSpeed(targetSpeed);
    }
  }, [biosphere, society, economy, session, gameOver, setBgmSpeed]);

  useEffect(() => {
    if (!showPreviousCardPopup) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreviousCardPopup(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPreviousCardPopup]);

  // Stop BGM if we unmount
  useEffect(() => {
    return () => {
      stopBgm();
    };
  }, [stopBgm]);

  const handleTutorialComplete = () => {
    localStorage.setItem("hasSeenTutorial", "1");
    setShowTutorial(false);
  };

  const handleStart = async () => {
    playSound("game_start");
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
      setPreviousCard(null);
      setPreviousDecisionText(null);
      setShowPreviousCardPopup(false);
      startBgm();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextCard = useCallback(async (session_id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const card = await getNextCard(session_id);
      setCurrentCard(card);
      setChoiceDisabled(false);
    } catch {
      setGameOver(true);
      stopBgm();
    } finally {
      setIsLoading(false);
    }
  }, [stopBgm]);

  const handleChoice = async (choice: "a" | "b") => {
    if (!session || !currentCard) return;
    setChoiceDisabled(true);
    setError(null);

    // Keep a "last turn" snapshot for the bottom command bar.
    setPreviousCard({
      scenario_text: currentCard.scenario_text,
      decision_a: currentCard.decision_a,
      decision_b: currentCard.decision_b,
      chosen: choice,
    });
    setPreviousDecisionText(
      choice === "a" ? currentCard.decision_a : currentCard.decision_b
    );

    try {
      const result = await submitRound(session.session_id, currentCard.scenario_id, choice);
      setBiosphere(result.biosphere);
      setSociety(result.society);
      setEconomy(result.economy);

      if (result.game_over) {
        setGameOver(true);
        setFinalScore(result.final_score ?? null);
        stopBgm();
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
    setHoveredChoice(null);
    setBiosphere(50);
    setSociety(50);
    setEconomy(50);
    setPreviousCard(null);
    setPreviousDecisionText(null);
    setShowPreviousCardPopup(false);
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
        <GlobalNav backClassName={styles.backLink} />
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
        <GlobalNav backClassName={styles.backLink} />
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
            <button type="button" className={styles.secondaryBtn} onClick={() => {
              playSound("button_click");
              navigate("/leaderboard")}}>
              View Leaderboard
            </button>
          </div>
        </div>
        <AudioControls />
      </div>
    );
  }

  const backgroundMood = getBackgroundMood(biosphere, society, economy);
  const worldState = getWorldState(biosphere, society, economy);
  const carouselTiltDeg = hoveredChoice === "a" ? -10 : hoveredChoice === "b" ? 10 : 0;
  const anyBelow30 = Math.min(biosphere, society, economy) < 30;
  const gameMenuItems: RadialMenuItem[] = [
    {
      id: "toggle-decisions",
      label: showDecisionCard ? "Hide decisions" : "Show decisions",
      icon: showDecisionCard ? <EyeOff size={18} /> : <Eye size={18} />,
      onSelect: () => {
        playSound("button_click");
        setShowDecisionCard((v) => !v);
      },
    },
    {
      id: "home",
      label: "Go home",
      icon: <ArrowLeft size={18} />,
      onSelect: () => {
        playSound("button_click");
        navigate("/");
      },
    },
    {
      id: "music",
      label: isMuted ? "Unmute music" : "Mute music",
      icon: isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />,
      onSelect: () => {
        const wasMuted = isMuted;
        toggleMute();
        if (wasMuted) {
          setTimeout(() => playSound("button_click"), 50);
        }
      },
    },
  ];

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

      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}

      <GlobalNav backClassName={styles.backLink} menuItems={gameMenuItems} menuSize={220} />

      {currentCard && <TransmissionOverlay scenarioText={currentCard.scenario_text} />}
      <div className={styles.content}>
        <div className={styles.hudArena}>
          <div className={styles.carouselCenter} aria-hidden>
            <StateImageCarousel
              activeIndex={getCardFaceIndex(biosphere, society, economy)}
              hoverTiltDeg={carouselTiltDeg}
            />
          </div>

          <div className={styles.overlayCenter}>
            <ScoreOrbit
              items={[
                { id: 1, name: "Biosphere", value: biosphere },
                { id: 2, name: "Society", value: society },
                { id: 3, name: "Economy", value: economy },
              ]}
              ghostItems={
                currentCard && hoveredChoice
                  ? [
                      {
                        id: 1,
                        name: "Biosphere",
                        value:
                          hoveredChoice === "a"
                            ? currentCard.a_biosphere_after
                            : currentCard.b_biosphere_after,
                      },
                      {
                        id: 2,
                        name: "Society",
                        value:
                          hoveredChoice === "a"
                            ? currentCard.a_society_after
                            : currentCard.b_society_after,
                      },
                      {
                        id: 3,
                        name: "Economy",
                        value:
                          hoveredChoice === "a"
                            ? currentCard.a_economy_after
                            : currentCard.b_economy_after,
                      },
                    ]
                  : undefined
              }
              stageSize={650}
              orbitRadius={300}
            >
              {isLoading && <p className={styles.loading}>Loading...</p>}
              {currentCard && showDecisionCard && (
                <div className={styles.cardStack}>
                  <Card
                    decision_a={currentCard.decision_a}
                    decision_b={currentCard.decision_b}
                    onChoice={handleChoice}
                    onHoverChoice={(c) => setHoveredChoice(c)}
                    disabled={choiceDisabled || showTutorial}
                  />
                  <p
                    className={`${styles.worldStateText} ${
                      worldState.zone === "critical"
                        ? styles.worldStateCritical
                        : worldState.zone === "warning"
                        ? styles.worldStateWarning
                        : styles.worldStateHealthy
                    }`}
                  >
                    {worldState.zone === "critical" ? (
                      <>
                        Critical state: <strong>{worldState.metricName}</strong> is {worldState.metricValue}.
                        <br />
                        Focus decisions that raise <strong>{worldState.metricName}</strong>.
                      </>
                    ) : worldState.zone === "warning" ? (
                      <>
                        Warning state: <strong>{worldState.metricName}</strong> is {worldState.metricValue}.
                        <br />
                        Keep <strong>{worldState.metricName}</strong> above 30 to avoid collapse.
                      </>
                    ) : (
                      <>
                        Stable state: <strong>{worldState.metricName}</strong> is {worldState.metricValue}.
                        <br />
                        Defend this balance to keep the world resilient.
                      </>
                    )}
                  </p>
                </div>
              )}
            </ScoreOrbit>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      <div
        className={`${styles.commandBar} ${anyBelow30 ? styles.commandBarCritical : ""}`}
      >
        <CommandBarMetric metricId={3} name="Economy" value={economy} />
        <button
          type="button"
          className={`${styles.commandHistory} ${styles.commandHistoryInteractive}`}
          onClick={() => {
            if (previousCard) setShowPreviousCardPopup(true);
          }}
          disabled={!previousCard}
          aria-label="Open previous card details"
        >
          <span className={styles.commandHistoryLabel}>Previous Card</span>
          <p className={styles.commandHistoryText}>
            {previousCard?.scenario_text ?? "No prior card yet."}
          </p>
        </button>
        <CommandBarMetric metricId={2} name="Society" value={society} />
        <div className={styles.commandHistory}>
          <span className={styles.commandHistoryLabel}>Previous Decision</span>
          <p className={styles.commandHistoryText}>
            {previousDecisionText ?? "No prior decision yet."}
          </p>
        </div>
        <CommandBarMetric metricId={1} name="Biosphere" value={biosphere} />
      </div>

      <AnimatePresence>
        {showPreviousCardPopup && previousCard && (
          <motion.div
            className={styles.previousCardOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPreviousCardPopup(false)}
          >
            <motion.div
              className={styles.previousCardModal}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Previous card details"
            >
              <div className={styles.previousCardModalHeader}>
                <h3 className={styles.previousCardModalTitle}>Previous Card</h3>
                <button
                  type="button"
                  className={styles.previousCardModalClose}
                  onClick={() => setShowPreviousCardPopup(false)}
                  aria-label="Close previous card details"
                >
                  Close
                </button>
              </div>
              <p className={styles.previousCardModalText}>
                {previousCard.scenario_text}
              </p>
              <div className={styles.previousCardChoices}>
                <div
                  className={`${styles.previousCardChoice} ${
                    previousCard.chosen === "a" ? styles.previousCardChoiceSelected : ""
                  }`}
                >
                  <span className={styles.previousCardChoiceLabel}>Choice A</span>
                  <span>{previousCard.decision_a}</span>
                </div>
                <div
                  className={`${styles.previousCardChoice} ${
                    previousCard.chosen === "b" ? styles.previousCardChoiceSelected : ""
                  }`}
                >
                  <span className={styles.previousCardChoiceLabel}>Choice B</span>
                  <span>{previousCard.decision_b}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AudioControls />
    </div>
  );
};

export default Game;
