import React, { useState } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

const AudioControls = () => {
  const { isMuted, sfxVolume, toggleMute, setSfxVolume, playSound } = useAudio();
  const [isHovered, setIsHovered] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setSfxVolume(newVol);
  };

  const handleVolumeRelease = () => {
    playSound('button_click');
  };

  const getVolumeIcon = () => {
    if (isMuted || sfxVolume === 0) return <VolumeX size={20} />;
    if (sfxVolume < 0.5) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-2 transition-all duration-300 hover:bg-black/60"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${isHovered ? 'w-24 opacity-100 ml-2' : 'w-0 opacity-0 ml-0'}`}
      >
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
      
      <button
        onClick={() => {
          toggleMute();
          if (isMuted) {
            setTimeout(() => playSound('button_click'), 50);
          }
        }}
        className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 flex-shrink-0"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {getVolumeIcon()}
      </button>
    </div>
  );
};

export default AudioControls;
