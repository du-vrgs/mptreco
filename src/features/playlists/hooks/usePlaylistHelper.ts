import { useState, useEffect, useCallback } from 'react';
import { Playlist, Track } from '@/shared/types';

const PLAYLISTS_STORAGE_KEY = 'mptreco_playlists';

export const usePlaylistHelper = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      if (stored) {
        setPlaylists(JSON.parse(stored));
      } else {
        // Playlist inicial padrão
        const defaultPlaylist: Playlist = {
          id: 'favorites',
          name: 'Favoritas do mptreco',
          description: 'Músicas favoritas e nostálgicas',
          trackIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setPlaylists([defaultPlaylist]);
        localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify([defaultPlaylist]));
      }
    } catch (e) {
      console.error('Erro ao ler playlists do localStorage:', e);
    }
  }, []);

  const savePlaylists = useCallback((updated: Playlist[]) => {
    setPlaylists(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updated));
    }
  }, []);

  const createPlaylist = useCallback((name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || 'Nova Playlist',
      description,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...playlists, newPlaylist];
    savePlaylists(updated);
    return newPlaylist;
  }, [playlists, savePlaylists]);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId && !pl.trackIds.includes(trackId)) {
        return {
          ...pl,
          trackIds: [...pl.trackIds, trackId],
          updatedAt: Date.now(),
        };
      }
      return pl;
    });
    savePlaylists(updated);
  }, [playlists, savePlaylists]);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          trackIds: pl.trackIds.filter((id) => id !== trackId),
          updatedAt: Date.now(),
        };
      }
      return pl;
    });
    savePlaylists(updated);
  }, [playlists, savePlaylists]);

  const deletePlaylist = useCallback((playlistId: string) => {
    const updated = playlists.filter((pl) => pl.id !== playlistId);
    savePlaylists(updated);
    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
    }
  }, [playlists, activePlaylistId, savePlaylists]);

  const renamePlaylist = useCallback((playlistId: string, newName: string) => {
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          name: newName.trim(),
          updatedAt: Date.now(),
        };
      }
      return pl;
    });
    savePlaylists(updated);
  }, [playlists, savePlaylists]);

  return {
    playlists,
    activePlaylistId,
    setActivePlaylistId,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
    renamePlaylist,
  };
};
