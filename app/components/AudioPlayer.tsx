'use client';

import { useState, useRef, useEffect } from 'react';

interface WindowWithMusic extends Window {
  playMusic?: () => void;
}

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    // Expose playMusic function to window for Timer component to call
    const playMusic = () => {
      if (audio && audio.paused) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Silently handle autoplay restrictions
          });
      }
    };

    (window as WindowWithMusic).playMusic = playMusic;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      delete (window as WindowWithMusic).playMusic;
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-md space-y-3">
      <h2 className="text-xl font-semibold text-slate-200 mb-3">
        Ambient Focus Music
      </h2>
      
      <audio
        ref={audioRef}
        loop
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
      >
        <source src="/music/default.mp3" type="audio/mpeg" />
        <source src="/music/default.ogg" type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800 border border-slate-700">
        <button
          onClick={togglePlay}
          className="shrink-0 w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
          <p className="text-xs text-slate-500">public/music/</p>
        </div>
      </div>

      {/* Visual Sound Wave Indicator */}
      <div className="flex items-center justify-center gap-1 h-8">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? `bg-teal-400 animate-pulse`
                : 'bg-slate-700'
            }`}
            style={{
              height: isPlaying
                ? `${Math.random() * 60 + 20}%`
                : '20%',
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

