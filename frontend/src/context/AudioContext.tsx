import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

type AudioContextType = {
  isMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  toggleMute: () => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  playSound: (soundName: string) => void;
  startBgm: () => void;
  stopBgm: () => void;
  setBgmSpeed: (speed: 1 | 2 | 4 | 8) => void;
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

  const soundsRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  
  const activeBgmSpeedRef = useRef<1 | 2 | 4 | 8 | null>(null);
  const isBgmPlayingRef = useRef<boolean>(false);

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

    const clickSound = new Audio('/assets/button_click_1.mp3');
    soundsRef.current['button_click'] = clickSound;

    const gameStartSound = new Audio('/assets/game_start_1.mp3');
    soundsRef.current['game_start'] = gameStartSound;

    [1, 2, 4, 8].forEach((speed) => {
      const bgmSound = new Audio(`/assets/music_speed_${speed}.mp3`);
      bgmSound.loop = true;
      soundsRef.current[`bgm_${speed}`] = bgmSound;
    });
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('audio_isMuted', String(newMuted));
  };

  const setMusicVolume = (volume: number) => {
    setMusicVolumeState(volume);
    localStorage.setItem('audio_musicVolume', String(volume));
    if (activeBgmSpeedRef.current) {
      const currentTrack = soundsRef.current[`bgm_${activeBgmSpeedRef.current}`];
      if (currentTrack) currentTrack.volume = volume;
    }
  };

  const setSfxVolume = (volume: number) => {
    setSfxVolumeState(volume);
    localStorage.setItem('audio_sfxVolume', String(volume));
  };

  const playSound = (soundName: string) => {
    if (isMuted) return;

    const sound = soundsRef.current[soundName];
    if (sound) {
      const clonedSound = sound.cloneNode() as HTMLAudioElement;
      clonedSound.volume = sfxVolume;
      clonedSound.play().catch((err) => console.log('Audio play failed:', err));
    } else {
      console.warn(`Sound ${soundName} not found.`);
    }
  };

  const startBgm = () => {
    if (isBgmPlayingRef.current) return;
    isBgmPlayingRef.current = true;
    const initialSpeed = 1;
    activeBgmSpeedRef.current = initialSpeed;
    
    if (isMuted) return;

    const track = soundsRef.current[`bgm_${initialSpeed}`];
    if (track) {
      track.volume = musicVolume;
      track.currentTime = 0;
      track.play().catch(err => console.log('BGM play failed:', err));
    }
  };

  const stopBgm = () => {
    isBgmPlayingRef.current = false;
    if (activeBgmSpeedRef.current) {
      const track = soundsRef.current[`bgm_${activeBgmSpeedRef.current}`];
      if (track) {
        track.pause();
        track.currentTime = 0;
      }
    }
    activeBgmSpeedRef.current = null;
  };

  const setBgmSpeed = (speed: 1 | 2 | 4 | 8) => {
    if (!isBgmPlayingRef.current || activeBgmSpeedRef.current === speed) return;

    const oldTrackKey = `bgm_${activeBgmSpeedRef.current}`;
    const newTrackKey = `bgm_${speed}`;

    const oldTrack = soundsRef.current[oldTrackKey];
    const newTrack = soundsRef.current[newTrackKey];

    if (oldTrack && newTrack) {
      const currentTime = oldTrack.currentTime;
      oldTrack.pause();
      
      newTrack.currentTime = currentTime;
      if (!isMuted) {
        newTrack.volume = musicVolume;
        newTrack.play().catch(err => console.log('BGM switch play failed:', err));
      }
      activeBgmSpeedRef.current = speed;
    }
  };

  useEffect(() => {
    if (activeBgmSpeedRef.current) {
      const track = soundsRef.current[`bgm_${activeBgmSpeedRef.current}`];
      if (track) {
        if (isMuted) {
          track.pause();
        } else if (isBgmPlayingRef.current) {
          track.volume = musicVolume;
          track.play().catch(err => console.log('BGM un-mute play failed:', err));
        }
      }
    }
  }, [isMuted, musicVolume]);

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
        startBgm,
        stopBgm,
        setBgmSpeed,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
