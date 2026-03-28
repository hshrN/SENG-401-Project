import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from 'react';

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

const BGM_TRACK_KEYS = ['bgm_1', 'bgm_2', 'bgm_4', 'bgm_8', 'bgm_end'] as const;

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [musicVolume, setMusicVolumeState] = useState<number>(1);
  const [sfxVolume, setSfxVolumeState] = useState<number>(1);

  const soundsRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const activeSfxRef = useRef<Set<HTMLAudioElement>>(new Set());

  const activeBgmSpeedRef = useRef<1 | 2 | 4 | 8 | 'end' | null>(null);
  const isBgmPlayingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const musicVolumeRef = useRef<number>(1);
  const sfxVolumeRef = useRef<number>(1);

  const getActiveBgmKey = () =>
    activeBgmSpeedRef.current ? `bgm_${activeBgmSpeedRef.current}` : null;

  const clampVolume = (volume: number) => Math.max(0, Math.min(1, volume));

  const applyTrackVolume = useCallback(
    (track: HTMLAudioElement | undefined, volume: number, muted: boolean) => {
      if (!track) return;
      track.volume = muted ? 0 : volume;
      track.muted = muted || volume <= 0.001;
    },
    [],
  );

  const pauseInactiveTracks = (activeKey: string | null) => {
    BGM_TRACK_KEYS.forEach((key) => {
      if (key === activeKey) return;
      const track = soundsRef.current[key];
      if (track) {
        track.pause();
      }
    });
  };

  const syncBgmPlayback = useCallback(
    (options?: { forceRestart?: boolean }) => {
      const activeKey = getActiveBgmKey();
      pauseInactiveTracks(activeKey);
      if (!activeKey) return;

      BGM_TRACK_KEYS.forEach((key) => {
        applyTrackVolume(
          soundsRef.current[key],
          musicVolumeRef.current,
          isMutedRef.current,
        );
      });

      const track = soundsRef.current[activeKey];
      if (!track) return;

      if (
        !isBgmPlayingRef.current ||
        isMutedRef.current ||
        musicVolumeRef.current <= 0.001
      ) {
        track.pause();
        return;
      }

      if (options?.forceRestart) {
        track.currentTime = 0;
      }

      track.play().catch(err => console.log('BGM play failed:', err));
    },
    [applyTrackVolume],
  );

  const loadPreferences = useCallback(() => {
    const savedMute = localStorage.getItem('audio_isMuted');
    if (savedMute !== null) {
      const nextMuted = savedMute === 'true';
      isMutedRef.current = nextMuted;
      setIsMuted(nextMuted);
    }

    const savedMusicVol = localStorage.getItem('audio_musicVolume');
    const savedSfxVol = localStorage.getItem('audio_sfxVolume');
    const savedVolume =
      savedMusicVol !== null
        ? parseFloat(savedMusicVol)
        : savedSfxVol !== null
          ? parseFloat(savedSfxVol)
          : null;

    if (savedVolume !== null && !Number.isNaN(savedVolume)) {
      const nextVolume = clampVolume(savedVolume);
      musicVolumeRef.current = nextVolume;
      sfxVolumeRef.current = nextVolume;
      setMusicVolumeState(nextVolume);
      setSfxVolumeState(nextVolume);
      localStorage.setItem('audio_musicVolume', String(nextVolume));
      localStorage.setItem('audio_sfxVolume', String(nextVolume));
    }
  }, []);

  useEffect(() => {
    loadPreferences();
    const activeSfx = activeSfxRef.current;
    const loadedSounds: { [key: string]: HTMLAudioElement } = {};

    const clickSound = new Audio(`${process.env.PUBLIC_URL}/assets/button_click_1.mp3`);
    clickSound.preload = 'auto';
    loadedSounds['button_click'] = clickSound;

    const buttonHoldSound = new Audio(`${process.env.PUBLIC_URL}/assets/button_hold_3.mp3`);
    buttonHoldSound.preload = 'auto';
    loadedSounds['button_hold'] = buttonHoldSound;

    const hoverSound = new Audio(`${process.env.PUBLIC_URL}/assets/hover_1.mp3`);
    hoverSound.preload = 'auto';
    loadedSounds['hover'] = hoverSound;

    const gameStartSound = new Audio(`${process.env.PUBLIC_URL}/assets/game_start_1.mp3`);
    gameStartSound.preload = 'auto';
    loadedSounds['game_start'] = gameStartSound;

    const crashSound = new Audio(`${process.env.PUBLIC_URL}/assets/crash_1.mp3`);
    crashSound.preload = 'auto';
    loadedSounds['crash'] = crashSound;

    const choiceCostSound = new Audio(`${process.env.PUBLIC_URL}/assets/choice_cost_1.mp3`);
    choiceCostSound.preload = 'auto';
    loadedSounds['choice_cost'] = choiceCostSound;

    [1, 2, 4, 8].forEach((speed) => {
      const bgmSound = new Audio(`${process.env.PUBLIC_URL}/assets/music_speed_${speed}.mp3`);
      bgmSound.loop = true;
      bgmSound.preload = 'auto';
      applyTrackVolume(
        bgmSound,
        musicVolumeRef.current,
        isMutedRef.current,
      );
      loadedSounds[`bgm_${speed}`] = bgmSound;
    });

    const endBgmSound = new Audio(`${process.env.PUBLIC_URL}/assets/game_end_song_extended.mp3`);
    endBgmSound.loop = true;
    endBgmSound.preload = 'auto';
    applyTrackVolume(
      endBgmSound,
      musicVolumeRef.current,
      isMutedRef.current,
    );
    loadedSounds['bgm_end'] = endBgmSound;
    soundsRef.current = loadedSounds;
    syncBgmPlayback();

    return () => {
      activeSfx.forEach((sound) => {
        sound.pause();
        sound.currentTime = 0;
      });
      activeSfx.clear();

      Object.values(loadedSounds).forEach((sound) => {
        sound.pause();
        sound.currentTime = 0;
        sound.src = '';
      });
      soundsRef.current = {};
      isBgmPlayingRef.current = false;
      activeBgmSpeedRef.current = null;
    };
  }, [applyTrackVolume, loadPreferences, syncBgmPlayback]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    isMutedRef.current = newMuted;
    setIsMuted(newMuted);
    localStorage.setItem('audio_isMuted', String(newMuted));

    BGM_TRACK_KEYS.forEach((key) => {
      applyTrackVolume(
        soundsRef.current[key],
        musicVolumeRef.current,
        newMuted,
      );
    });

    activeSfxRef.current.forEach((sound) => {
      sound.volume = newMuted ? 0 : sfxVolumeRef.current;
      sound.muted = newMuted || sfxVolumeRef.current <= 0.001;
      if (newMuted) {
        sound.pause();
      }
    });

    if (newMuted) {
      BGM_TRACK_KEYS.forEach((key) => {
        soundsRef.current[key]?.pause();
      });
      return;
    }

    syncBgmPlayback();
  }, [applyTrackVolume, syncBgmPlayback]);

  const setMusicVolume = useCallback((volume: number) => {
    const nextVolume = clampVolume(volume);
    musicVolumeRef.current = nextVolume;
    setMusicVolumeState(nextVolume);
    localStorage.setItem('audio_musicVolume', String(nextVolume));

    BGM_TRACK_KEYS.forEach((key) => {
      applyTrackVolume(
        soundsRef.current[key],
        nextVolume,
        isMutedRef.current,
      );
    });

    if (nextVolume <= 0.001 || isMutedRef.current) {
      BGM_TRACK_KEYS.forEach((key) => {
        soundsRef.current[key]?.pause();
      });
      return;
    }

    syncBgmPlayback();
  }, [applyTrackVolume, syncBgmPlayback]);

  const setSfxVolume = useCallback((volume: number) => {
    const nextVolume = clampVolume(volume);
    sfxVolumeRef.current = nextVolume;
    setSfxVolumeState(nextVolume);
    localStorage.setItem('audio_sfxVolume', String(nextVolume));

    activeSfxRef.current.forEach((sound) => {
      sound.volume = nextVolume;
      sound.muted = isMutedRef.current || nextVolume <= 0.001;
      if (sound.muted) {
        sound.pause();
      }
    });
  }, []);

  const playSound = useCallback((soundName: string) => {
    if (isMutedRef.current || sfxVolumeRef.current <= 0.001) return;

    const sound = soundsRef.current[soundName];
    if (sound) {
      const clonedSound = sound.cloneNode() as HTMLAudioElement;
      clonedSound.volume = sfxVolumeRef.current;
      clonedSound.muted = false;
      activeSfxRef.current.add(clonedSound);
      clonedSound.addEventListener(
        'ended',
        () => {
          activeSfxRef.current.delete(clonedSound);
        },
        { once: true },
      );
      clonedSound.play().catch((err) => console.log('Audio play failed:', err));
      return clonedSound;
    } else {
      console.warn(`Sound ${soundName} not found.`);
    }
  }, []);

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

  const stopBgm = useCallback(() => {
    isBgmPlayingRef.current = false;
    BGM_TRACK_KEYS.forEach((key) => {
      const track = soundsRef.current[key];
      if (track) {
        track.pause();
        track.currentTime = 0;
      }
    });
    activeBgmSpeedRef.current = null;
  }, []);

  const startBgm = useCallback(() => {
    if (isBgmPlayingRef.current) return;
    isBgmPlayingRef.current = true;
    const initialSpeed = 1;
    activeBgmSpeedRef.current = initialSpeed;
    syncBgmPlayback({ forceRestart: true });
  }, [syncBgmPlayback]);

  const startEndBgm = useCallback(() => {
    if (activeBgmSpeedRef.current === 'end' && isBgmPlayingRef.current) return;
    
    if (isBgmPlayingRef.current) stopBgm();
    isBgmPlayingRef.current = true;
    activeBgmSpeedRef.current = 'end';
    syncBgmPlayback({ forceRestart: true });
  }, [stopBgm, syncBgmPlayback]);

  const setBgmSpeed = useCallback((speed: 1 | 2 | 4 | 8) => {
    if (!isBgmPlayingRef.current || activeBgmSpeedRef.current === speed) return;

    const oldTrackKey = `bgm_${activeBgmSpeedRef.current}`;
    const newTrackKey = `bgm_${speed}`;

    const oldTrack = soundsRef.current[oldTrackKey];
    const newTrack = soundsRef.current[newTrackKey];

    if (oldTrack && newTrack) {
      const currentTime = oldTrack.currentTime;
      oldTrack.pause();

      newTrack.currentTime = currentTime;
      activeBgmSpeedRef.current = speed;
      syncBgmPlayback();
    }
  }, [syncBgmPlayback]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    musicVolumeRef.current = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    sfxVolumeRef.current = sfxVolume;
  }, [sfxVolume]);

  useEffect(() => {
    syncBgmPlayback();
  }, [isMuted, musicVolume, syncBgmPlayback]);

  const contextValue = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <AudioContext.Provider
      value={contextValue}
    >
      {children}
    </AudioContext.Provider>
  );
};
