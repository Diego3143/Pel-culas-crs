'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, FastForward, Fullscreen } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster: string;
}

// Helper to format time from seconds to MM:SS
const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const VideoPlayer = ({ src, poster }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playbackRates = [0.5, 1, 1.5, 2];


  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // Disable context menu on the container
      videoRef.current.addEventListener('contextmenu', e => e.preventDefault());

      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: false,
        responsive: true,
        fluid: true,
        poster: poster,
        sources: [{ src, type: 'video/mp4' }],
      }, () => {
        // Player is ready
        player.on('play', () => setIsPlaying(true));
        player.on('pause', () => setIsPlaying(false));
        player.on('durationchange', () => setDuration(player.duration()));
        player.on('timeupdate', () => {
            const current = player.currentTime() || 0;
            const duration = player.duration() || 0;
            setCurrentTime(current);
            if (duration > 0) {
                setProgress((current / duration) * 100);
            }
        });
        player.on('fullscreenchange', () => {
          setIsFullscreen(!!player.isFullscreen());
        });
      });

    } else {
      // If player already exists, just update the source
      const player = playerRef.current;
      if (player) {
        player.autoplay(false);
        player.poster(poster);
        player.src({ src, type: 'video/mp4' });
      }
    }
    
    // Cleanup context menu listener
    return () => {
        if(videoRef.current) {
            videoRef.current.removeEventListener('contextmenu', e => e.preventDefault());
        }
    }
  }, [src, poster]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playerRef.current.paused()) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    if (playerRef.current && duration > 0) {
      const newTime = (newProgress / 100) * duration;
      playerRef.current.currentTime(newTime);
    }
  };

  const handleSetPlaybackRate = (rate: number) => {
    if (playerRef.current) {
      playerRef.current.playbackRate(rate);
      setPlaybackRate(rate);
    }
  }

  const handleFullscreen = () => {
    if (playerRef.current) {
      if (playerRef.current.isFullscreen()) {
        playerRef.current.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  };


  return (
    <div>
        <div data-vjs-player>
            <div ref={videoRef} className="rounded-lg overflow-hidden" />
        </div>
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 mt-2 space-y-2">
            <div className="flex items-center gap-4 px-2">
                <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                <Slider
                    value={[progress]}
                    onValueChange={handleSeek}
                    max={100}
                    step={0.1}
                />
                <span className="text-xs font-mono">{formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                    {isPlaying ? <Pause /> : <Play />}
                </Button>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-24">
                            <FastForward className="mr-2 h-4 w-4" /> {playbackRate}x
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1">
                        <div className="flex flex-col">
                            {playbackRates.map(rate => (
                                <Button
                                key={rate}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetPlaybackRate(rate)}
                                className={cn(rate === playbackRate && 'bg-accent text-accent-foreground')}
                                >
                                {rate}x
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
                 {!isFullscreen && (
                  <Button variant="ghost" size="icon" onClick={handleFullscreen}>
                      <Fullscreen />
                  </Button>
                )}
            </div>
        </div>
    </div>
  );
};
