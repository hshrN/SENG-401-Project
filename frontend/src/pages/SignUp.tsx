import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAudio } from "../context/AudioContext";
import { cn } from "../lib/utils";
import styles from "./Login.module.css";
import GradientBackground from "../components/shared/GradientBackground";
import GlobalNav from "../components/shared/GlobalNav";

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

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { playSound } = useAudio();

  const handleSignup = async (e: React.FormEvent) => {
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
    if (!confirmPassword) {
      setMessage("Please confirm your password");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      await signup({ username: username.trim(), password, confirmPassword });
      navigate("/");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(styles.container, styles.root)}>
      <GradientBackground idPrefix="signup"/>
      <GlobalNav backClassName={styles.backLink} />

      <div className={styles.formWrap}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={styles.card}
        >
          <BlurFade delay={0.1}>
            <h1 className={styles.title}>Create an account</h1>
            <p className={styles.subtitle}>Sign up to get started</p>
          </BlurFade>

          <form onSubmit={handleSignup} className={styles.form}>
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
                    autoComplete="new-password"
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

            <BlurFade delay={0.25}>
              <div className={styles.inputWrap}>
                <div className={styles.glassInput}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => { playSound("button_click"); setShowConfirmPassword(!showConfirmPassword); }}
                    className={styles.togglePassword}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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

            <BlurFade delay={0.3}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Sign up"}
                <ArrowRight size={18} />
              </button>
            </BlurFade>
          </form>

          <BlurFade delay={0.35}>
            <p className={styles.signupRow}>
              Already have an account?
              <Link to="/login" className={styles.signupLink}>
                Log in
              </Link>
            </p>
          </BlurFade>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
