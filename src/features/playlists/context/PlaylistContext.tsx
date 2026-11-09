'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePlaylistHelper } from '../hooks/usePlaylistHelper';
import { Playlist } from '@/shared/types';

interface PlaylistContextData {
  playlists: Playlist[];
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
  createPlaylist: (name: string, description?: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, newName: string) => void;
  mergeRemotePlaylists: (remotePlaylists: Playlist[]) => void;
}

const PlaylistContext = createContext<PlaylistContextData | null>(null);

interface PlaylistProviderProps {
  children: ReactNode;
}

export const PlaylistProvider: React.FC<PlaylistProviderProps> = ({ children }) => {
  const playlistState = usePlaylistHelper();

  return (
    <PlaylistContext.Provider value={playlistState}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylists = (): PlaylistContextData => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylists deve ser usado dentro de um PlaylistProvider');
  }
  return context;
};
