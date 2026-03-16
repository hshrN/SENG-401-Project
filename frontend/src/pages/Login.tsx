import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { User, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAudio } from "../context/AudioContext";
import { cn } from "../lib/utils";
import styles from "./Login.module.css";

const blurFadeVariants = {
  hidden: { y: 12, opacity: 0, filter: "blur(6px)" },
  visible: { y: 0, opacity: 1, filter: "blur(0px)" },
};

function BlurFade({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={blurFadeVariants}
      transition={{ duration: 0.4, delay: 0.04 + delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function GradientBackground() {
  return (
    <div className={styles.gradientBg} aria-hidden>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(5, 46, 34, 0.9)" />
            <stop offset="100%" stopColor="rgba(22, 163, 74, 0.5)" />
          </linearGradient>
          <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.4)" />
            <stop offset="50%" stopColor="rgba(5, 46, 34, 0.6)" />
            <stop offset="100%" stopColor="rgba(22, 101, 52, 0.5)" />
          </linearGradient>
          <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.5)" />
            <stop offset="100%" stopColor="rgba(5, 46, 34, 0.3)" />
          </radialGradient>
          <filter id="blur1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="35" />
          </filter>
          <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
          <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="45" />
          </filter>
        </defs>
        <g className={styles.float1}>
          <ellipse cx="200" cy="500" rx="250" ry="180" fill="url(#lg1)" filter="url(#blur1)" transform="rotate(-30 200 500)" />
          <rect x="500" y="100" width="300" height="250" rx="80" fill="url(#lg2)" filter="url(#blur2)" transform="rotate(15 650 225)" />
        </g>
        <g className={styles.float2}>
          <circle cx="650" cy="450" r="150" fill="url(#rg1)" filter="url(#blur3)" opacity="0.7" />
          <ellipse cx="50" cy="150" rx="180" ry="120" fill="rgba(34, 197, 94, 0.25)" filter="url(#blur2)" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { playSound } = useAudio();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound("button_click");
    setMessage("");
    if (!username.trim()) {
      setMessage("Please enter a username");
      return;
    }
    if (!password) {
      setMessage("Please enter a password");
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      navigate("/");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(styles.container, styles.root)}>
      <GradientBackground />
      <Link to="/" className={styles.backLink}>
        <ArrowLeft size={18} />
        Back to Home
      </Link>

      <div className={styles.formWrap}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={styles.card}
        >
          <BlurFade delay={0.1}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to continue</p>
          </BlurFade>

          <form onSubmit={handleLogin} className={styles.form}>
            <BlurFade delay={0.15}>
              <div className={styles.inputWrap}>
                <div className={styles.glassInput}>
                  <User className={styles.inputIcon} size={20} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                    autoComplete="username"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </BlurFade>

            <BlurFade delay={0.2}>
              <div className={styles.inputWrap}>
                <div className={styles.glassInput}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => { playSound("button_click"); setShowPassword(!showPassword); }}
                    className={styles.togglePassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </BlurFade>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.errorMessage}
              >
                {message}
              </motion.p>
            )}

            <BlurFade delay={0.25}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Log in"}
                <ArrowRight size={18} />
              </button>
            </BlurFade>
          </form>

          <BlurFade delay={0.3}>
            <p className={styles.signupRow}>
              Don&apos;t have an account?
              <Link to="/signup" className={styles.signupLink}>
                Sign up
              </Link>
            </p>
          </BlurFade>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
