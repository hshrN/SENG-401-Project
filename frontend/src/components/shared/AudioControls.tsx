import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import styles from "./AudioControls.module.css";

type AudioControlsProps = {
  placement?: "nav" | "floating";
};

const AudioControls = ({ placement = "floating" }: AudioControlsProps) => {
  const {
    isMuted,
    musicVolume,
    setSfxVolume,
    setMusicVolume,
    playSound,
    toggleMute,
  } = useAudio();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    if (isMuted) {
      toggleMute();
    }
    setSfxVolume(newVol);
    setMusicVolume(newVol);
  };

  const handleVolumeRelease = () => {
    playSound("button_click");
  };

  return (
    <div
      className={`${styles.root} ${
        placement === "nav" ? styles.navPlacement : styles.floatingPlacement
      }`}
    >
      <button
        type="button"
        className={styles.iconButton}
        onClick={() => {
          const wasMuted = isMuted;
          toggleMute();
          if (wasMuted) {
            setTimeout(() => playSound("button_click"), 50);
          } else {
            playSound("button_click");
          }
        }}
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      >
        <span className={styles.icon} aria-hidden>
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </span>
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={musicVolume}
        onChange={handleVolumeChange}
        onMouseUp={handleVolumeRelease}
        onTouchEnd={handleVolumeRelease}
        className={styles.slider}
        aria-label="Volume"
      />
    </div>
  );
};

export default AudioControls;
