import { useState, useEffect, useCallback } from 'react';
import { AudioSourceType, Track } from '@/shared/types';
import {
  getOfflineTracks,
  saveTrackOffline,
  deleteTrackOffline,
  isTrackDownloaded,
  getTrackBlobUrl,
} from '../services/indexedDbStorageService';

export const useLibraryHelper = () => {
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pcTracks, setPcTracks] = useState<{ id: string; filename: string; sizeBytes: number }[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      const tracks = await getOfflineTracks();
      setOfflineTracks(tracks);
      setDownloadedSet(new Set(tracks.map((t) => t.id)));
    } catch (err) {
      console.error('Erro ao carregar biblioteca offline:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithPc = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mptreco_admin_token') : null;
    if (!token) return;

    try {
      setIsSyncing(true);
      const res = await fetch(`/api/sync?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setPcTracks(data.files || []);
      }
    } catch (e) {
      console.warn('PC offline para sincronização:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
    syncWithPc();
  }, [refreshLibrary, syncWithPc]);

  const downloadTrack = useCallback(async (track: Track): Promise<boolean> => {
    if (downloadingIds.has(track.id)) return false;

    setDownloadingIds((prev) => new Set(prev).add(track.id));
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mptreco_admin_token') : null;
      const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
      const streamRes = await fetch(`/api/stream?id=${track.id}${tokenParam}`);
      if (!streamRes.ok) throw new Error('Falha ao obter MP3 do PC');

      const audioBlob = await streamRes.blob();
      await saveTrackOffline(track, audioBlob);
      await refreshLibrary();
      return true;
    } catch (err) {
      console.error(`Erro ao baixar faixa ${track.id}:`, err);
      alert('Não foi possível transferir a música para o celular.');
      return false;
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  }, [downloadingIds, refreshLibrary]);

  const removeTrack = useCallback(async (trackId: string): Promise<void> => {
    await deleteTrackOffline(trackId);
    await refreshLibrary();
  }, [refreshLibrary]);

  const importLocalFiles = useCallback(async (files: FileList): Promise<void> => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3')) continue;

      const trackId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const parts = fileNameWithoutExt.split('-');
      
      const artist = parts.length > 1 ? parts[0].trim() : 'Arquivo Local';
      const title = parts.length > 1 ? parts.slice(1).join('-').trim() : fileNameWithoutExt;

      const track: Track = {
        id: trackId,
        title,
        artist,
        durationSeconds: 0,
        durationFormatted: '--:--',
        thumbnailUrl: '/icon.svg',
        sourceType: AudioSourceType.LOCAL_DEVICE_FILE,
        createdAt: Date.now(),
      };

      await saveTrackOffline(track, file);
    }
    await refreshLibrary();
  }, [refreshLibrary]);

  return {
    offlineTracks,
    pcTracks,
    isLoading,
    isSyncing,
    downloadingIds,
    downloadedSet,
    syncWithPc,
    downloadTrack,
    removeTrack,
    importLocalFiles,
    refreshLibrary,
    getTrackBlobUrl,
    checkDownloaded: isTrackDownloaded,
  };
};
