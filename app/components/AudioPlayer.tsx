'use client';

import { useState, useRef, useEffect } from 'react';

interface WindowWithMusic extends Window {
  playMusic?: () => void;
  YT?: {
    Player: new (elementId: string | HTMLElement, config: YouTubePlayerConfig) => YouTubePlayer;
    PlayerState: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YouTubePlayerConfig {
  videoId: string;
  playerVars: Record<string, number | string>;
  events: {
    onReady?: (event: { target: YouTubePlayer }) => void;
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
  };
}

interface YouTubeLink {
  id: string;
  url: string;
  title: string;
}

// Extract video ID from various YouTube URL formats
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubeLinks, setYoutubeLinks] = useState<YouTubeLink[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveHeights] = useState(() => 
    Array.from({ length: 20 }, () => Math.random() * 60 + 20)
  );
  const playerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const isDestroyingRef = useRef(false);

  // Load YouTube IFrame API
  useEffect(() => {
    const win = window as WindowWithMusic;
    
    if (!win.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      win.onYouTubeIframeAPIReady = () => {
        // API is ready, but we'll create player in separate effect
      };
    }
  }, []);

  // Create/destroy player when currentVideoId changes
  useEffect(() => {
    const win = window as WindowWithMusic;
    
    if (!currentVideoId || !playerRef.current || !win.YT) {
      return;
    }

    // If player exists, just load new video
    if (playerInstanceRef.current && !isDestroyingRef.current) {
      const timeoutId = setTimeout(() => {
        try {
          if (playerInstanceRef.current && !isDestroyingRef.current) {
            playerInstanceRef.current.loadVideoById(currentVideoId);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error('Error loading video:', error);
          // If loadVideoById fails, destroy and recreate
          if (playerInstanceRef.current) {
            isDestroyingRef.current = true;
            try {
              playerInstanceRef.current.destroy();
            } catch {
              // Ignore destroy errors
            }
            playerInstanceRef.current = null;
            setPlayer(null);
            isDestroyingRef.current = false;
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    // Create new player only if one doesn't exist
    if (playerInstanceRef.current || isDestroyingRef.current) {
      return;
    }

    let newPlayer: YouTubePlayer | null = null;
    
    try {
      newPlayer = new win.YT.Player(playerRef.current, {
        videoId: currentVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            const ytPlayer = event.target;
            if (isDestroyingRef.current) return;
            
            playerInstanceRef.current = ytPlayer;
            setPlayer(ytPlayer);
            try {
              const videoDuration = ytPlayer.getDuration();
              if (videoDuration > 0) {
                setDuration(videoDuration);
              }
            } catch {
              // Duration might not be available immediately
            }
          },
          onStateChange: (event) => {
            if (isDestroyingRef.current) return;
            
            const ytPlayer = event.target;
            if (win.YT && event.data === win.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Start updating progress
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              progressIntervalRef.current = setInterval(() => {
                if (isDestroyingRef.current || !playerInstanceRef.current) {
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                  }
                  return;
                }
                try {
                  setCurrentTime(ytPlayer.getCurrentTime());
                  const newDuration = ytPlayer.getDuration();
                  if (newDuration > 0) {
                    setDuration((prev) => prev === 0 ? newDuration : prev);
                  }
                } catch {
                  // Ignore errors
                }
              }, 100);
            } else if (win.YT && event.data === win.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            } else if (win.YT && event.data === win.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          },
        },
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }

    return () => {
      if (newPlayer || playerInstanceRef.current) {
        isDestroyingRef.current = true;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        try {
          if (newPlayer) {
            newPlayer.destroy();
          } else if (playerInstanceRef.current) {
            playerInstanceRef.current.destroy();
          }
        } catch {
          // Ignore destroy errors
        }
        playerInstanceRef.current = null;
        setPlayer(null);
        // Reset flag after a delay to allow cleanup
        setTimeout(() => {
          isDestroyingRef.current = false;
        }, 500);
      }
    };
  }, [currentVideoId]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Expose playMusic function for Timer
  useEffect(() => {
    const playMusic = () => {
      if (playerInstanceRef.current && currentVideoId && !isDestroyingRef.current) {
        try {
          playerInstanceRef.current.playVideo();
          setIsPlaying(true);
        } catch {
          // Silently handle errors
        }
      }
    };

    (window as WindowWithMusic).playMusic = playMusic;

    return () => {
      delete (window as WindowWithMusic).playMusic;
    };
  }, [currentVideoId]);

  const addYouTubeLink = () => {
    if (!inputUrl.trim()) return;

    const videoId = extractVideoId(inputUrl);
    if (!videoId) {
      alert('Invalid YouTube URL. Please enter a valid YouTube link.');
      return;
    }

    // Check if link already exists
    if (youtubeLinks.some(link => link.id === videoId)) {
      alert('This video is already in your list.');
      setInputUrl('');
      return;
    }

    const newLink: YouTubeLink = {
      id: videoId,
      url: inputUrl.trim(),
      title: `Video ${youtubeLinks.length + 1}`,
    };

    setYoutubeLinks([...youtubeLinks, newLink]);
    setInputUrl('');

    // If no video is currently playing, set this as current
    if (!currentVideoId) {
      setCurrentVideoId(videoId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addYouTubeLink();
    }
  };

  const selectVideo = (videoId: string) => {
    setCurrentVideoId(videoId);
    if (player) {
      player.loadVideoById(videoId);
      setIsPlaying(false);
    }
  };

  const deleteLink = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLinks = youtubeLinks.filter(link => link.id !== videoId);
    setYoutubeLinks(newLinks);
    
    if (currentVideoId === videoId) {
      if (newLinks.length > 0) {
        setCurrentVideoId(newLinks[0].id);
      } else {
        setCurrentVideoId(null);
        if (player) {
          player.stopVideo();
          setIsPlaying(false);
        }
      }
    }
  };

  const togglePlay = () => {
    if (!playerInstanceRef.current || !currentVideoId || isDestroyingRef.current) return;

    try {
      if (isPlaying) {
        playerInstanceRef.current.pauseVideo();
      } else {
        playerInstanceRef.current.playVideo();
      }
    } catch {
      // Silently handle errors
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerInstanceRef.current || !duration || isDestroyingRef.current) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    try {
      playerInstanceRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch {
      // Silently handle errors
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-md space-y-4">
      <h2 className="text-xl font-semibold text-slate-200 mb-3">
        Ambient Focus Music
      </h2>

      {/* YouTube Link Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter YouTube URL..."
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
          <button
            onClick={addYouTubeLink}
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors text-sm"
          >
            Add
          </button>
        </div>

        {/* YouTube Links List */}
        {youtubeLinks.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {youtubeLinks.map((link) => (
              <div
                key={link.id}
                onClick={() => selectVideo(link.id)}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  currentVideoId === link.id
                    ? 'bg-teal-500/20 border-teal-500'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs truncate">
                    {link.title}
                  </p>
                  <p className="text-slate-400 text-xs truncate">
                    {link.url}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteLink(link.id, e)}
                  className="shrink-0 px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* YouTube Video Player */}
      {currentVideoId && (
        <div className="space-y-3">
          <div 
            ref={playerRef} 
            className="w-full aspect-video rounded-lg overflow-hidden bg-slate-900"
          ></div>

          {/* Player Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
              <button
                onClick={togglePlay}
                disabled={!player}
                className="shrink-0 w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-slate-300 text-sm truncate">
                  {youtubeLinks.find(l => l.id === currentVideoId)?.title || 'Playing...'}
                </p>
                
                {/* Progress Bar */}
                <div 
                  onClick={handleProgressClick}
                  className="w-full h-2 bg-slate-700 rounded-full cursor-pointer hover:h-2.5 transition-all group"
                >
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>

                {/* Time Display */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Sound Wave Indicator */}
      <div className="flex items-center justify-center gap-1 h-8">
        {waveHeights.map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? `bg-teal-400 animate-pulse`
                : 'bg-slate-700'
            }`}
            style={{
              height: isPlaying ? `${height}%` : '20%',
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
