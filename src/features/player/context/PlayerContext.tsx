'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayerHelper } from '../hooks/useAudioPlayerHelper';
import { PlaybackState, RepeatMode, Track } from '@/shared/types';

interface PlayerContextData {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  analyserNode: AnalyserNode | null;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => void;
  playPrevious: () => void;
  seek: (timeSeconds: number) => void;
  changeVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setIsShuffle: (shuffle: boolean | ((prev: boolean) => boolean)) => void;
  setQueue: (queue: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextData | null>(null);

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const player = useAudioPlayerHelper();

  return (
    <PlayerContext.Provider value={player}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextData => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer deve ser usado dentro de um PlayerProvider');
  }
  return context;
};
