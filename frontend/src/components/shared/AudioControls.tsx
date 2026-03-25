import React from 'react';
import { useAudio } from '../../context/AudioContext';

const AudioControls = () => {
  const { isMuted, sfxVolume, setSfxVolume, setMusicVolume, playSound } = useAudio();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setSfxVolume(newVol);
    setMusicVolume(newVol);
  };

  const handleVolumeRelease = () => {
    playSound('button_click');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-2">
      <div className="flex items-center">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          dir="rtl"
          value={isMuted ? 0 : sfxVolume}
          onChange={handleVolumeChange}
          onMouseUp={handleVolumeRelease}
          onTouchEnd={handleVolumeRelease}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
          aria-label="Volume"
        />
      </div>
    </div>
  );
};

export default AudioControls;
