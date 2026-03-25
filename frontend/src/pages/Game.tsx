import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Handshake,
  Leaf,
  Radio,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Game.module.css";
import Card from "../components/card/Card";
import { ScoreOrbit } from "../components/scoreOrbit";
import GradientBackground from "../components/shared/GradientBackground";
import { useAuth } from "../context/AuthContext";
import { useAudio } from "../context/AudioContext";
import {
  createSession,
  getScenarioSettings,
  getNextCard,
  submitRound,
  generateScenarios,
  type SessionResponse,
  type CardResponse,
  type ScenarioSettingsResponse,
} from "../application/gameService";
import { getCardFaceIndex } from "../utils/cardFaceState";
import { StateImageCarousel } from "../components/stateImageCarousel";
import { TutorialOverlay } from "../components/tutorial";
import AudioControls from "../components/shared/AudioControls";
import { TransmissionOverlay } from "../components/TransmissionOverlay";
import type { RadialMenuItem } from "../components/radialMenu/RadialActionMenu";
import { CommandBarMetric } from "../components/commandBar/CommandBarMetric";
import GlobalNav from "../components/shared/GlobalNav";

/** Background mood from metrics: critical (red), warning (yellow), healthy (green) */
function getBackgroundMood(
  biosphere: number,
  society: number,
  economy: number,
): "critical" | "warning" | "healthy" {
  const min = Math.min(biosphere, society, economy);
  if (min <= 30) return "critical";
  if (min <= 45) return "warning";
  return "healthy";
}

function getWorldState(
  biosphere: number,
  society: number,
  economy: number,
): {
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

function worldStateParagraph(ws: {
  zone: "critical" | "warning" | "healthy";
  metricName: string;
  metricValue: number;
}) {
  if (ws.zone === "critical") {
    return (
      <>
        Critical state: <strong>{ws.metricName}</strong> is {ws.metricValue}.
        <br />
        Focus decisions that raise <strong>{ws.metricName}</strong>.
      </>
    );
  }
  if (ws.zone === "warning") {
    return (
      <>
        Warning state: <strong>{ws.metricName}</strong> is {ws.metricValue}.
        <br />
        Keep <strong>{ws.metricName}</strong> above 30 to avoid collapse.
      </>
    );
  }
  return (
    <>
      Stable state: <strong>{ws.metricName}</strong> is {ws.metricValue}.
      <br />
      Defend this balance to keep the world resilient.
    </>
  );
}

function worldStateZoneLabel(zone: "critical" | "warning" | "healthy"): string {
  if (zone === "critical") return "critical pressure";
  if (zone === "warning") return "elevated risk";
  return "stable equilibrium";
}

/** Time to show scenario transmission before world state + decisions (ms). */
const SCENARIO_READ_MS = 2000;

type GameResultState = "failed" | "completed";

type ScenarioCompletionError = Error & {
  game_result?: GameResultState;
  final_score?: number;
  completed_questions?: number;
  target_questions?: number;
};

type ImpactTone = "positive" | "negative" | "mixed";

type ImpactBadge = {
  label: "Biosphere" | "Society" | "Economy";
  delta: number;
  x: number;
  y: number;
};

type ImpactBurstState = {
  id: number;
  tone: ImpactTone;
  totalDelta: number;
  badges: ImpactBadge[];
};

const IMPACT_PARTICLES = Array.from({ length: 14 }, (_, index) => {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 14;
  const distance = index % 2 === 0 ? 138 : 96;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: (angle * 180) / Math.PI,
    delay: index * 0.025,
    scale: index % 3 === 0 ? 1.15 : 0.85,
  };
});

const VICTORY_CONFETTI = Array.from({ length: 28 }, (_, index) => {
  const palette = ["#22c55e", "#86efac", "#facc15", "#60a5fa", "#fb7185", "#34d399"];
  return {
    left: `${(index * 17) % 100}%`,
    top: `${-18 - (index % 5) * 16}px`,
    width: `${8 + (index % 3) * 4}px`,
    height: `${16 + (index % 4) * 5}px`,
    color: palette[index % palette.length],
    delay: `${(index % 7) * 0.18}s`,
    duration: `${3.8 + (index % 5) * 0.35}s`,
    swayDuration: `${1.2 + (index % 4) * 0.18}s`,
  };
});

function getImpactTone(deltas: number[]): ImpactTone {
  const gains = deltas.filter((delta) => delta > 0).length;
  const losses = deltas.filter((delta) => delta < 0).length;

  if (gains > 0 && losses === 0) return "positive";
  if (losses > 0 && gains === 0) return "negative";
  return "mixed";
}

function getImpactHeadline(tone: ImpactTone, totalDelta: number): string {
  if (tone === "positive") return totalDelta >= 10 ? "Coalition Surge" : "Systems Up";
  if (tone === "negative") return totalDelta <= -10 ? "Shockwave" : "Systems Hit";
  return totalDelta >= 0 ? "Trade-Off" : "Heavy Cost";
}

const Game = () => {
  const { user } = useAuth();
  const { isMuted, playSound, startBgm, stopBgm, setBgmSpeed, toggleMute } =
    useAudio();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [currentCard, setCurrentCard] = useState<CardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [choiceDisabled, setChoiceDisabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);

  const [biosphere, setBiosphere] = useState(50);
  const [society, setSociety] = useState(50);
  const [economy, setEconomy] = useState(50);

  const [showTutorial, setShowTutorial] = useState(false);
  const [showDecisionCard, setShowDecisionCard] = useState(true);
  const [hoveredChoice, setHoveredChoice] = useState<"a" | "b" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<GameResultState | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scenarioSettings, setScenarioSettings] =
    useState<ScenarioSettingsResponse | null>(null);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(20);
  const [impactBurst, setImpactBurst] = useState<ImpactBurstState | null>(null);
  const [previousCard, setPreviousCard] = useState<{
    scenario_text: string;
    decision_a: string;
    decision_b: string;
    chosen: "a" | "b";
  } | null>(null);
  const [previousDecisionText, setPreviousDecisionText] = useState<
    string | null
  >(null);
  const [showPreviousCardPopup, setShowPreviousCardPopup] = useState(false);
  /** After a choice: brief state readout, then load next card before showing decisions again. */
  const [postChoicePhase, setPostChoicePhase] = useState<
    "idle" | "outcome" | "loading"
  >("idle");
  const [postChoiceMeta, setPostChoiceMeta] = useState<{
    unchanged: boolean;
  } | null>(null);
  /** After each new scenario loads: false until SCENARIO_READ_MS so players read the card first. */
  const [scenarioReady, setScenarioReady] = useState(false);
  const impactTimeoutRef = React.useRef<number | null>(null);

  const navigate = useNavigate();

  const applyScenarioSettings = useCallback(
    (settings: ScenarioSettingsResponse) => {
      setScenarioSettings(settings);
      setSelectedQuestionCount((current) => {
        const preferred = current > 0 ? current : settings.default_questions;
        return Math.max(
          settings.min_questions,
          Math.min(settings.max_questions, preferred),
        );
      });
    },
    [],
  );

  useEffect(() => {
    if (session) return;

    let active = true;
    void (async () => {
      try {
        const settings = await getScenarioSettings();
        if (!active) return;
        applyScenarioSettings(settings);
      } catch (err: unknown) {
        if (!active) return;
        setError((err as Error).message);
      }
    })();

    return () => {
      active = false;
    };
  }, [session, applyScenarioSettings]);

  useLayoutEffect(() => {
    if (!currentCard) {
      setScenarioReady(false);
      return;
    }
    setScenarioReady(false);
    const id = window.setTimeout(
      () => setScenarioReady(true),
      SCENARIO_READ_MS,
    );
    return () => window.clearTimeout(id);
  }, [currentCard]);

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

      if (minMetric < 15) targetSpeed = 8;
      else if (minMetric < 30) targetSpeed = 4;
      else if (minMetric < 45) targetSpeed = 2;

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
      if (impactTimeoutRef.current !== null) {
        window.clearTimeout(impactTimeoutRef.current);
      }
    };
  }, [stopBgm]);

  const handleTutorialComplete = () => {
    localStorage.setItem("hasSeenTutorial", "1");
    setShowTutorial(false);
  };

  const queueImpactBurst = useCallback(
    (nextBiosphere: number, nextSociety: number, nextEconomy: number) => {
      const rawBadges = [
        { label: "Biosphere" as const, delta: nextBiosphere - biosphere },
        { label: "Society" as const, delta: nextSociety - society },
        { label: "Economy" as const, delta: nextEconomy - economy },
      ].filter((badge) => badge.delta !== 0);

      if (rawBadges.length === 0) return;

      const spread =
        rawBadges.length === 1
          ? [0]
          : rawBadges.length === 2
            ? [-92, 92]
            : [-122, 0, 122];

      const badges: ImpactBadge[] = rawBadges.map((badge, index) => ({
        ...badge,
        x: spread[index],
        y:
          rawBadges.length === 3 && index === 1
            ? -104
            : -46 - (index % 2) * 18,
      }));

      const totalDelta = rawBadges.reduce(
        (sum, badge) => sum + badge.delta,
        0,
      );

      if (impactTimeoutRef.current !== null) {
        window.clearTimeout(impactTimeoutRef.current);
      }

      setImpactBurst({
        id: Date.now(),
        tone: getImpactTone(rawBadges.map((badge) => badge.delta)),
        totalDelta,
        badges,
      });

      impactTimeoutRef.current = window.setTimeout(() => {
        setImpactBurst(null);
      }, 1350);
    },
    [biosphere, society, economy],
  );

  const handleStart = async () => {
    playSound("game_start");
    const username = user?.username?.trim();
    if (!username) {
      setError("You must be logged in to start a game.");
      return;
    }
    if (!scenarioSettings) {
      setError("Mission settings are still loading. Please wait a moment.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await createSession(username, selectedQuestionCount);
      if (impactTimeoutRef.current !== null) {
        window.clearTimeout(impactTimeoutRef.current);
        impactTimeoutRef.current = null;
      }
      setSession(newSession);
      setBiosphere(newSession.biosphere);
      setSociety(newSession.society);
      setEconomy(newSession.economy);
      setQuestionsCompleted(0);
      setGameOver(false);
      setGameResult(null);
      setFinalScore(null);
      setImpactBurst(null);
      setPreviousCard(null);
      setPreviousDecisionText(null);
      setShowPreviousCardPopup(false);
      setPostChoicePhase("idle");
      setPostChoiceMeta(null);
      startBgm();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateMsg(null);
    try {
      const result = await generateScenarios(5);
      setGenerateMsg(`Generated ${result.created} new scenarios!`);
      const settings = await getScenarioSettings();
      applyScenarioSettings(settings);
    } catch (err: unknown) {
      setGenerateMsg((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadCardForSession = useCallback(
    async (session_id: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const card = await getNextCard(session_id);
        setCurrentCard(card);
      } catch (err: unknown) {
        const completion = err as ScenarioCompletionError;
        if (completion.game_result === "completed") {
          setQuestionsCompleted(
            completion.completed_questions ??
              completion.target_questions ??
              selectedQuestionCount,
          );
          setGameResult("completed");
          setGameOver(true);
          setFinalScore(completion.final_score ?? null);
          setCurrentCard(null);
        } else {
          setGameResult("failed");
          setGameOver(true);
          setError(completion.message || "Failed to load the next scenario.");
        }
        stopBgm();
        playSound("crash");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedQuestionCount, stopBgm, playSound],

  );

  const fetchNextCard = useCallback(
    async (session_id: number) => {
      await loadCardForSession(session_id);
      setChoiceDisabled(false);
    },
    [loadCardForSession],
  );

  const handleChoice = async (choice: "a" | "b") => {
    if (!session || !currentCard) return;
    setChoiceDisabled(true);
    setError(null);

    const wsBefore = getWorldState(biosphere, society, economy);

    // Keep a "last turn" snapshot for the bottom command bar.
    setPreviousCard({
      scenario_text: currentCard.scenario_text,
      decision_a: currentCard.decision_a,
      decision_b: currentCard.decision_b,
      chosen: choice,
    });
    setPreviousDecisionText(
      choice === "a" ? currentCard.decision_a : currentCard.decision_b,
    );

    try {
      const result = await submitRound(
        session.session_id,
        currentCard.scenario_id,
        choice,
        session.target_questions,
      );
      queueImpactBurst(result.biosphere, result.society, result.economy);
      setBiosphere(result.biosphere);
      setSociety(result.society);
      setEconomy(result.economy);
      setQuestionsCompleted(result.completed_questions);

      if (result.game_over) {
        if (impactTimeoutRef.current !== null) {
          window.clearTimeout(impactTimeoutRef.current);
          impactTimeoutRef.current = null;
        }
        setImpactBurst(null);
        setGameResult(result.game_result ?? "failed");
        setGameOver(true);
        setFinalScore(result.final_score ?? null);
        stopBgm();
        playSound("crash");
        return;
      }

      const wsAfter = getWorldState(
        result.biosphere,
        result.society,
        result.economy,
      );
      setPostChoiceMeta({ unchanged: wsBefore.zone === wsAfter.zone });
      setHoveredChoice(null);
      setPostChoicePhase("outcome");

      await new Promise((r) => setTimeout(r, 1100));

      setPostChoicePhase("loading");
      await loadCardForSession(session.session_id);

      setPostChoicePhase("idle");
      setPostChoiceMeta(null);
      setChoiceDisabled(false);
    } catch (err: unknown) {
      setError((err as Error).message);
      setPostChoicePhase("idle");
      setPostChoiceMeta(null);
      setChoiceDisabled(false);
    }
  };

  const handleRestart = () => {
    playSound("button_click");
    if (impactTimeoutRef.current !== null) {
      window.clearTimeout(impactTimeoutRef.current);
      impactTimeoutRef.current = null;
    }
    setSession(null);
    setCurrentCard(null);
    setGameOver(false);
    setGameResult(null);
    setFinalScore(null);
    setQuestionsCompleted(0);
    setImpactBurst(null);
    setChoiceDisabled(false);
    setGenerateMsg(null);
    setHoveredChoice(null);
    setBiosphere(50);
    setSociety(50);
    setEconomy(50);
    setPreviousCard(null);
    setPreviousDecisionText(null);
    setShowPreviousCardPopup(false);
    setError(null);
    setPostChoicePhase("idle");
    setPostChoiceMeta(null);
  };

  const MetricBar = ({ label, value }: { label: string; value: number }) => {
    let fillClass = styles.metricFillHealthy;
    let valueClass = styles.metricValueHealthy;

    if (value <= 20) {
      fillClass = styles.metricFillCritical;
      valueClass = styles.metricValueCritical;
    } else if (value <= 45) {
      fillClass = styles.metricFillWarning;
      valueClass = styles.metricValueWarning;
    }

    return (
      <div className={styles.metricRow}>
        <div className={styles.metricLabel}>
          <span>{label}</span>
          <span className={`${styles.metricValue} ${valueClass}`}>{value}</span>
        </div>
        <div className={styles.metricTrack}>
          <div
            className={`${styles.metricFill} ${fillClass}`}
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      </div>
    );
  };

  const missionQuestionCount = session?.target_questions ?? selectedQuestionCount;
  const isVictory = gameResult === "completed";
  const completedQuestionCount =
    isVictory
      ? questionsCompleted > 0
        ? questionsCompleted
        : missionQuestionCount
      : questionsCompleted;

  if (!session) {
    return (
      <div className={styles.container}>
        <GradientBackground idPrefix="game" />
        <GlobalNav backClassName={styles.backLink} />
        <div className={styles.content}>
          <motion.div
            className={`${styles.card} ${styles.startCard}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.startMissionBar}>
              <span className={styles.startMissionId}>
                <Radio size={14} aria-hidden />
                Protocol · Global coalition sim
              </span>
              <span className={styles.startSdgPill}>SDG 17</span>
            </div>

            <div className={styles.startHero}>
              <div className={styles.startIconRing} aria-hidden>
                <Handshake size={28} strokeWidth={1.75} />
              </div>
              <h1 className={styles.startTitle}>Partnership for the Goals</h1>
              <p className={styles.startTagline}>
                You are coordinating across sectors. Every call shifts the
                balance between planet, people, and prosperity.
              </p>
            </div>

            <div className={styles.startWhyBox}>
              <h2 className={styles.startWhyHeading}>Why this is Goal 17</h2>
              <p className={styles.startWhyText}>
                The UN describes SDG 17 as the partnership goal: finance,
                policy, and knowledge have to move together or the other goals
                stall. This run models that idea—no single metric wins alone.
                Trade-offs are the game; cooperation is how you keep all three
                from collapsing.
              </p>
            </div>

            <div className={styles.startHud}>
              <span className={styles.startHudLabel}>Starting equilibrium</span>
              <div className={styles.startHudGauges}>
                <div className={styles.startHudItem}>
                  <Leaf size={16} aria-hidden />
                  <span>Biosphere</span>
                  <strong>50</strong>
                </div>
                <div className={styles.startHudItem}>
                  <Users size={16} aria-hidden />
                  <span>Society</span>
                  <strong>50</strong>
                </div>
                <div className={styles.startHudItem}>
                  <Zap size={16} aria-hidden />
                  <span>Economy</span>
                  <strong>50</strong>
                </div>
              </div>
            </div>


            <div className={styles.startCta}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleStart}
                disabled={isLoading || !scenarioSettings}
              >
                {isLoading
                  ? "Initializing run…"
                  : !scenarioSettings
                    ? "Loading mission settings…"
                    : "Begin mission"}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating…" : "Generate New Scenarios (AI)"}
              </button>
              {generateMsg && <p className={styles.generateMsg}>{generateMsg}</p>}
              <p className={styles.startCtaHint}>
                Mission length · {selectedQuestionCount} cards selected
              </p>
            </div>

            
            <div className={styles.startSettingsBox}>
              <div className={styles.startSettingsHeader}>
                <div>
                  <h2 className={styles.startSettingsTitle}>Mission settings</h2>
                  <p className={styles.startSettingsText}>
                    Choose how many scenario cards this run should last.
                  </p>
                </div>
                {scenarioSettings && (
                  <span className={styles.startSettingsBadge}>
                    {selectedQuestionCount} cards
                  </span>
                )}
              </div>

              {scenarioSettings ? (
                <>
                  <div className={styles.startSettingsScale}>
                    <span>Min {scenarioSettings.min_questions}</span>
                    <span>Default {scenarioSettings.default_questions}</span>
                    <span>Max {scenarioSettings.max_questions}</span>
                  </div>
                  <label
                    className={styles.startSliderLabel}
                    htmlFor="question-count"
                  >
                    Question count
                  </label>
                  <input
                    id="question-count"
                    className={styles.startSlider}
                    type="range"
                    min={scenarioSettings.min_questions}
                    max={scenarioSettings.max_questions}
                    value={selectedQuestionCount}
                    onChange={(e) => {
                      setSelectedQuestionCount(Number(e.target.value));
                    }}
                  />
                  <p className={styles.startSettingsHint}>
                    Finish {selectedQuestionCount} cards with all three metrics
                    above zero to complete the mission.
                  </p>
                </>
              ) : (
                <p className={styles.startSettingsHint}>
                  Loading mission settings…
                </p>
              )}
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </motion.div>
        </div>
        <AudioControls />
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className={styles.container}>
        <GradientBackground idPrefix="game" />
        {isVictory && (
          <div className={styles.confettiLayer} aria-hidden>
            {VICTORY_CONFETTI.map((piece, index) => (
              <span
                key={index}
                className={styles.confettiPiece}
                style={
                  {
                    left: piece.left,
                    top: piece.top,
                    width: piece.width,
                    height: piece.height,
                    background: piece.color,
                    animationDelay: `${piece.delay}, ${piece.delay}`,
                    animationDuration: `${piece.duration}, ${piece.swayDuration}`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
        <GlobalNav backClassName={styles.backLink} />
        <div className={styles.content}>
          <motion.div
            className={`${styles.card} ${styles.startCard}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.startMissionBar}>
              <span className={styles.startMissionId}>
                <Radio size={14} aria-hidden />
                Protocol · Global coalition sim
              </span>
              <span className={styles.startSdgPill}>SDG 17</span>
            </div>

            <div className={styles.startHero}>
              <div
                className={`${styles.startIconRing} ${
                  isVictory
                    ? styles.startIconRingSuccess
                    : styles.startIconRingFailure
                }`}
                aria-hidden
              >
                {isVictory ? (
                  <Trophy size={28} strokeWidth={1.75} />
                ) : (
                  <AlertTriangle size={28} strokeWidth={1.75} />
                )}
              </div>
              <h1 className={styles.startTitle}>
                {isVictory ? "Mission Complete" : "Game Over"}
              </h1>
              <p className={styles.startTagline}>
                {isVictory
                  ? "You kept the coalition stable and finished your selected mission with strong global balance."
                  : "One of your metrics collapsed, so the coalition lost stability before the mission was complete."}
              </p>
            </div>

            {finalScore !== null && (
              <p className={styles.startFinalScore}>
                Final score: <strong>{finalScore}</strong>
              </p>
            )}

            <p className={styles.startOutcomeLine}>
              {isVictory
                ? `Completed ${completedQuestionCount} of ${missionQuestionCount} cards. Excellent work keeping the systems in balance.`
                : `You reached ${completedQuestionCount} of ${missionQuestionCount} cards before collapse.`}
            </p>

            <div className={styles.startHud}>
              <span className={styles.startHudLabel}>Final readings</span>
              <div className={styles.startHudMetrics}>
                <MetricBar label="Biosphere" value={biosphere} />
                <MetricBar label="Society" value={society} />
                <MetricBar label="Economy" value={economy} />
              </div>
            </div>

            <div className={styles.startCta}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleRestart}
              >
                {isVictory ? "Run another mission" : "Try again"}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  playSound("button_click");
                  navigate("/leaderboard");
                }}
              >
                View leaderboard
              </button>
              <p className={styles.startCtaHint}>
                {isVictory
                  ? "Victory logged · leaderboard ready"
                  : "New run · scenario deck loaded"}
              </p>
            </div>
          </motion.div>
        </div>
        <AudioControls />
      </div>
    );
  }

  const backgroundMood = getBackgroundMood(biosphere, society, economy);
  const worldState = getWorldState(biosphere, society, economy);
  const carouselTiltDeg =
    hoveredChoice === "a" ? -10 : hoveredChoice === "b" ? 10 : 0;
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

      <GlobalNav
        backClassName={styles.backLink}
        menuItems={gameMenuItems}
        menuSize={220}
      />

      {currentCard && (
        <TransmissionOverlay scenarioText={currentCard.scenario_text} />
      )}
      <div className={styles.content}>
        <div className={styles.hudArena}>
          <div className={styles.carouselCenter} aria-hidden>
            <StateImageCarousel
              activeIndex={getCardFaceIndex(biosphere, society, economy)}
              hoverTiltDeg={carouselTiltDeg}
            />
          </div>

          <div className={styles.overlayCenter}>
            <AnimatePresence>
              {impactBurst && (
                <motion.div
                  key={impactBurst.id}
                  className={styles.impactBurstOverlay}
                  initial={{ opacity: 0, scale: 0.72 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.12 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  aria-hidden
                >
                  <motion.div
                    className={`${styles.impactBurstAura} ${
                      impactBurst.tone === "positive"
                        ? styles.impactBurstAuraPositive
                        : impactBurst.tone === "negative"
                          ? styles.impactBurstAuraNegative
                          : styles.impactBurstAuraMixed
                    }`}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.18 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  />

                  <div className={styles.impactParticleField}>
                    {IMPACT_PARTICLES.map((particle, index) => (
                      <motion.span
                        key={index}
                        className={`${styles.impactParticle} ${
                          impactBurst.tone === "positive"
                            ? styles.impactParticlePositive
                            : impactBurst.tone === "negative"
                              ? styles.impactParticleNegative
                              : styles.impactParticleMixed
                        }`}
                        initial={{
                          opacity: 0,
                          scale: 0.15,
                          x: 0,
                          y: 0,
                          rotate: particle.rotate - 18,
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0.15, particle.scale, 0.35],
                          x: particle.x,
                          y: particle.y,
                          rotate: particle.rotate + 18,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: particle.delay,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </div>

                  <motion.div
                    className={`${styles.impactVerdict} ${
                      impactBurst.tone === "positive"
                        ? styles.impactVerdictPositive
                        : impactBurst.tone === "negative"
                          ? styles.impactVerdictNegative
                          : styles.impactVerdictMixed
                    }`}
                    initial={{ opacity: 0, y: 18, scale: 0.75 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [18, 0, -8, -18],
                      scale: [0.75, 1.08, 1, 0.95],
                    }}
                    transition={{ duration: 1.05, ease: "easeOut" }}
                  >
                    {getImpactHeadline(impactBurst.tone, impactBurst.totalDelta)}
                  </motion.div>

                  {impactBurst.badges.map((badge, index) => (
                    <motion.div
                      key={`${impactBurst.id}-${badge.label}`}
                      className={`${styles.impactChip} ${
                        badge.delta > 0
                          ? styles.impactChipGain
                          : styles.impactChipLoss
                      }`}
                      initial={{
                        opacity: 0,
                        scale: 0.42,
                        x: 0,
                        y: 0,
                        rotate: badge.delta > 0 ? -8 : 8,
                      }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.42, 1.1, 1, 0.92],
                        x: [0, badge.x * 0.7, badge.x, badge.x * 1.08],
                        y: [0, badge.y * 0.5, badge.y, badge.y - 8],
                        rotate: [badge.delta > 0 ? -8 : 8, 0, 0, badge.delta > 0 ? 5 : -5],
                      }}
                      transition={{
                        duration: 1.15,
                        delay: index * 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <span className={styles.impactChipValue}>
                        {badge.delta > 0 ? `+${badge.delta}` : `${badge.delta}`}
                      </span>
                      <span className={styles.impactChipLabel}>{badge.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
              {isLoading && postChoicePhase === "idle" && (
                <p className={styles.loading}>Loading...</p>
              )}
              {currentCard && (
                <div className={styles.cardStack}>
                  <AnimatePresence mode="wait">
                    {postChoicePhase === "outcome" ||
                      postChoicePhase === "loading" ? (
                      <motion.div
                        key="interstitial"
                        className={styles.stateRevealShell}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{
                          duration: 0.34,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <div className={styles.stateRevealHeader}>
                          <span className={styles.stateRevealEyebrow}>
                            World state
                          </span>
                          <span className={styles.stateRevealTitle}>
                            After your move
                          </span>
                        </div>
                        <div
                          className={`${styles.worldStateText} ${styles.worldStateProminent} ${worldState.zone === "critical"
                              ? styles.worldStateCritical
                              : worldState.zone === "warning"
                                ? styles.worldStateWarning
                                : styles.worldStateHealthy
                            } ${postChoicePhase === "outcome" ? styles.worldStatePulse : ""}`}
                        >
                          <p className={styles.worldStateTextInner}>
                            {worldStateParagraph(worldState)}
                          </p>
                          {postChoicePhase === "outcome" &&
                            postChoiceMeta?.unchanged && (
                              <p className={styles.worldStateSameLine}>
                                <span className={styles.worldStateSameBadge}>
                                  Same band — still{" "}
                                  {worldStateZoneLabel(worldState.zone)}
                                </span>
                              </p>
                            )}
                          {postChoicePhase === "loading" && (
                            <p className={styles.nextScenarioLine}>
                              Next directive inbound…
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ) : scenarioReady ? (
                      <motion.div
                        key={currentCard.scenario_id}
                        className={styles.choicesShell}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{
                          duration: 0.38,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {showDecisionCard && (
                          <Card
                            decision_a={currentCard.decision_a}
                            decision_b={currentCard.decision_b}
                            onChoice={handleChoice}
                            onHoverChoice={(c) => setHoveredChoice(c)}
                            disabled={choiceDisabled || showTutorial}
                          />
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {postChoicePhase === "idle" && scenarioReady && (
                    <motion.div
                      key={`compact-${worldState.zone}-${worldState.metricName}-${worldState.metricValue}`}
                      className={`${styles.worldStateText} ${styles.worldStateCompact} ${worldState.zone === "critical"
                          ? styles.worldStateCritical
                          : worldState.zone === "warning"
                            ? styles.worldStateWarning
                            : styles.worldStateHealthy
                        }`}
                      initial={{ opacity: 0.85, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className={styles.worldStateTextInner}>
                        {worldStateParagraph(worldState)}
                      </p>
                    </motion.div>
                  )}
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
                  className={`${styles.previousCardChoice} ${previousCard.chosen === "a"
                      ? styles.previousCardChoiceSelected
                      : ""
                    }`}
                >
                  <span className={styles.previousCardChoiceLabel}>
                    Choice A
                  </span>
                  <span>{previousCard.decision_a}</span>
                </div>
                <div
                  className={`${styles.previousCardChoice} ${previousCard.chosen === "b"
                      ? styles.previousCardChoiceSelected
                      : ""
                    }`}
                >
                  <span className={styles.previousCardChoiceLabel}>
                    Choice B
                  </span>
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
