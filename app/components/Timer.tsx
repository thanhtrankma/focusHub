'use client';

import { useState, useEffect, useRef } from 'react';

type TimerMode = 'study' | 'shortBreak';

interface WindowWithAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
  playBeep?: () => void;
  playMusic?: () => void;
}

const TIMER_DURATIONS = {
  study: 45 * 60, // 45 minutes in seconds
  shortBreak: 10 * 60, // 10 minutes in seconds
};

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>('study');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.study);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as WindowWithAudio).webkitAudioContext!)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    // Store the function for later use
    (window as WindowWithAudio).playBeep = createBeepSound;
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            // Play notification sound
            try {
              const win = window as WindowWithAudio;
              if (win.playBeep) {
                win.playBeep();
              }
            } catch {
              // Fallback: visual notification if audio fails
              console.log('Timer finished!');
            }
            // Reset finished state after animation
            setTimeout(() => setIsFinished(false), 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    // Auto-play music when timer starts
    try {
      const win = window as WindowWithAudio;
      if (win.playMusic) {
        win.playMusic();
      }
    } catch {
      // Silently fail if music player is not available
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(TIMER_DURATIONS[mode]);
  };

  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setIsFinished(false);
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
  };

  // Auto-advance when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      const timer = setTimeout(() => {
        if (mode === 'study') {
          const newCycles = completedCycles + 1;
          setCompletedCycles(newCycles);
          // After study, take a short break
          setMode('shortBreak');
          setTimeLeft(TIMER_DURATIONS.shortBreak);
        } else {
          // After break, go back to study
          setMode('study');
          setTimeLeft(TIMER_DURATIONS.study);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isRunning, mode, completedCycles]);

  const getModeColor = () => {
    switch (mode) {
      case 'study':
        return 'text-teal-400';
      case 'shortBreak':
        return 'text-lime-400';
      default:
        return 'text-teal-400';
    }
  };

  const getGlowStyle = () => {
    switch (mode) {
      case 'study':
        return {
          textShadow: `
            0 0 10px rgba(45, 212, 191, 0.8),
            0 0 20px rgba(45, 212, 191, 0.6),
            0 0 30px rgba(45, 212, 191, 0.4),
            0 0 40px rgba(45, 212, 191, 0.3),
            0 0 50px rgba(45, 212, 191, 0.2)
          `,
          filter: 'drop-shadow(0 0 20px rgba(45, 212, 191, 0.6))',
        };
      case 'shortBreak':
        return {
          textShadow: `
            0 0 10px rgba(132, 204, 22, 0.8),
            0 0 20px rgba(132, 204, 22, 0.6),
            0 0 30px rgba(132, 204, 22, 0.4),
            0 0 40px rgba(132, 204, 22, 0.3),
            0 0 50px rgba(132, 204, 22, 0.2)
          `,
          filter: 'drop-shadow(0 0 20px rgba(132, 204, 22, 0.6))',
        };
      default:
        return {
          textShadow: `
            0 0 10px rgba(45, 212, 191, 0.8),
            0 0 20px rgba(45, 212, 191, 0.6),
            0 0 30px rgba(45, 212, 191, 0.4),
            0 0 40px rgba(45, 212, 191, 0.3),
            0 0 50px rgba(45, 212, 191, 0.2)
          `,
          filter: 'drop-shadow(0 0 20px rgba(45, 212, 191, 0.6))',
        };
    }
  };

  const getButtonColor = () => {
    switch (mode) {
      case 'study':
        return 'bg-teal-500 hover:bg-teal-600';
      case 'shortBreak':
        return 'bg-lime-500 hover:bg-lime-600';
      default:
        return 'bg-teal-500 hover:bg-teal-600';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Mode Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => handleModeChange('study')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            mode === 'study'
              ? 'bg-teal-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Study
        </button>
        <button
          onClick={() => handleModeChange('shortBreak')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            mode === 'shortBreak'
              ? 'bg-lime-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Break
        </button>
      </div>

      {/* Timer Display */}
      <div 
        className={`text-9xl font-bold ${getModeColor()} transition-all duration-300 timer-glow ${
          isFinished ? 'scale-110 animate-pulse' : ''
        }`}
        style={getGlowStyle()}
      >
        {formatTime(timeLeft)}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className={`px-8 py-3 rounded-lg font-semibold text-white ${getButtonColor()} transition-colors shadow-lg`}
          >
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className={`px-8 py-3 rounded-lg font-semibold text-white ${getButtonColor()} transition-colors shadow-lg`}
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-8 py-3 rounded-lg font-semibold text-white bg-slate-600 hover:bg-slate-700 transition-colors shadow-lg"
        >
          Reset
        </button>
      </div>

      {/* Cycle Counter */}
      <div className="text-slate-400 text-sm">
        Completed cycles: {completedCycles}
      </div>
    </div>
  );
}

