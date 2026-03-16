import React, { createContext, useCallback, useContext } from "react";

export type BgmSpeed = 1 | 2 | 4 | 8;

type AudioContextType = {
  playSound: (name: string) => void;
  startBgm: () => void;
  stopBgm: () => void;
  setBgmSpeed: (speed: BgmSpeed) => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

type AudioProviderProps = {
  children: React.ReactNode;
};

export const AudioProvider = ({ children }: AudioProviderProps) => {
  const playSound = useCallback((_name: string) => {
    // Stub: no-op until real audio is wired
  }, []);

  const startBgm = useCallback(() => {
    // Stub: no-op until real BGM is wired
  }, []);

  const stopBgm = useCallback(() => {
    // Stub: no-op until real BGM is wired
  }, []);

  const setBgmSpeed = useCallback((_speed: BgmSpeed) => {
    // Stub: no-op until real BGM is wired
  }, []);

  const value: AudioContextType = {
    playSound,
    startBgm,
    stopBgm,
    setBgmSpeed,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = (): AudioContextType => {
  const ctx = useContext(AudioContext);
  if (ctx === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return ctx;
};
