import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';

type AudioContextType = {
  isMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  toggleMute: () => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  playSound: (soundName: string) => HTMLAudioElement | void;
  startBgm: () => void;
  stopBgm: () => void;
  startEndBgm: () => void;
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

  const activeBgmSpeedRef = useRef<1 | 2 | 4 | 8 | 'end' | null>(null);
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

    const buttonHoldSound = new Audio('/assets/button_hold_3.mp3');
    soundsRef.current['button_hold'] = buttonHoldSound;

    const hoverSound = new Audio('/assets/hover_1.mp3');
    soundsRef.current['hover'] = hoverSound;

    const gameStartSound = new Audio('/assets/game_start_1.mp3');
    soundsRef.current['game_start'] = gameStartSound;

    const crashSound = new Audio('/assets/crash_1.mp3');
    soundsRef.current['crash'] = crashSound;

    const choiceCostSound = new Audio('/assets/choice_cost_1.mp3');
    soundsRef.current['choice_cost'] = choiceCostSound;

    [1, 2, 4, 8].forEach((speed) => {
      const bgmSound = new Audio(`/assets/music_speed_${speed}.mp3`);
      bgmSound.loop = true;
      soundsRef.current[`bgm_${speed}`] = bgmSound;
    });

    const endBgmSound = new Audio('/assets/game_end_song_extended.mp3');
    endBgmSound.loop = true;
    soundsRef.current['bgm_end'] = endBgmSound;
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
      return clonedSound;
    } else {
      console.warn(`Sound ${soundName} not found.`);
    }
  };

  const playSoundRef = useRef(playSound);
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  useEffect(() => {
    const handleGlobalHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const button = target.closest('button, [role="button"]');
      if (!button) return;

      const related = e.relatedTarget as HTMLElement;
      if (related && button.contains(related)) {
         return;
      }
      
      if (button.hasAttribute('disabled')) return;
      
      playSoundRef.current('hover');
    };

    document.addEventListener('mouseover', handleGlobalHover);
    return () => document.removeEventListener('mouseover', handleGlobalHover);
  }, []);

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

  const startEndBgm = () => {
    if (activeBgmSpeedRef.current === 'end' && isBgmPlayingRef.current) return;
    
    if (isBgmPlayingRef.current) stopBgm();
    isBgmPlayingRef.current = true;
    activeBgmSpeedRef.current = 'end';

    if (isMuted) return;

    const track = soundsRef.current['bgm_end'];
    if (track) {
      track.volume = musicVolume;
      track.play().catch(err => console.log('End BGM play failed:', err));
    }
  };

  const stopBgm = useCallback(() => {
    isBgmPlayingRef.current = false;
    if (activeBgmSpeedRef.current) {
      const track = soundsRef.current[`bgm_${activeBgmSpeedRef.current}`];
      if (track) {
        track.pause();
        track.currentTime = 0;
      }
    }
    activeBgmSpeedRef.current = null;
  }, []);

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
        startEndBgm,
        setBgmSpeed,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
