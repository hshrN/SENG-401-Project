import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

type AudioContextType = {
  isMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  toggleMute: () => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  playSound: (soundName: string) => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

type AudioProviderProps = {
  children: ReactNode;
};

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [musicVolume, setMusicVolumeState] = useState<number>(1);
  const [sfxVolume, setSfxVolumeState] = useState<number>(1);

  // References to keep track of loaded sounds
  const soundsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  const loadPreferences = () => {
    const savedMute = localStorage.getItem('audio_isMuted');
    if (savedMute !== null) setIsMuted(savedMute === 'true');

    const savedMusicVol = localStorage.getItem('audio_musicVolume');
    if (savedMusicVol !== null) setMusicVolumeState(parseFloat(savedMusicVol));

    const savedSfxVol = localStorage.getItem('audio_sfxVolume');
    if (savedSfxVol !== null) setSfxVolumeState(parseFloat(savedSfxVol));
  };

  useEffect(() => {
    loadPreferences();

    // Preload basic SFX - taking into account the new path: frontend/public/assets/button_click_1.mp3
    const clickSound = new Audio('/assets/button_click_1.mp3');
    soundsRef.current['button_click'] = clickSound;
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('audio_isMuted', String(newMuted));
  };

  const setMusicVolume = (volume: number) => {
    setMusicVolumeState(volume);
    localStorage.setItem('audio_musicVolume', String(volume));
  };

  const setSfxVolume = (volume: number) => {
    setSfxVolumeState(volume);
    localStorage.setItem('audio_sfxVolume', String(volume));
  };

  const playSound = (soundName: string) => {
    if (isMuted) return;

    const sound = soundsRef.current[soundName];
    if (sound) {
      // Clone node to allow overlapping playback (e.g., rapid clicks)
      const clonedSound = sound.cloneNode() as HTMLAudioElement;
      clonedSound.volume = sfxVolume;
      clonedSound.play().catch((err) => console.log('Audio play failed:', err));
    } else {
      console.warn(`Sound ${soundName} not found.`);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        musicVolume,
        sfxVolume,
        toggleMute,
        setMusicVolume,
        setSfxVolume,
        playSound,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
