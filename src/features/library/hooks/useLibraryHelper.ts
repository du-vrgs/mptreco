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
  const [pcTracks, setPcTracks] = useState<Track[]>([]);
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
        const serverTracks: Track[] = (data.tracks || []).map((t: Track) => ({
          ...t,
          sourceType: AudioSourceType.YOUTUBE_STREAM,
        }));
        setPcTracks(serverTracks);

        // Identifica quais músicas do PC ainda não foram baixadas no celular (IndexedDB)
        const currentOffline = await getOfflineTracks();
        const currentOfflineIds = new Set(currentOffline.map((t) => t.id));
        const missingTracks = serverTracks.filter((t) => !currentOfflineIds.has(t.id));

        // Baixa todas as novas músicas diretamente para o armazenamento do celular
        for (const track of missingTracks) {
          try {
            const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
            const streamUrl = `/api/stream?id=${track.id}${tokenParam}`;
            const fileRes = await fetch(streamUrl);
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              await saveTrackOffline(track, blob);
            }
          } catch (downloadErr) {
            console.warn(`Erro ao baixar música ${track.title} no celular:`, downloadErr);
          }
        }

        // Atualiza o estado da biblioteca offline após sincronizar e baixar os novos arquivos
        await refreshLibrary();

        // Dispara evento para sincronizar playlists se houver
        if (data.playlists && Array.isArray(data.playlists) && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mptreco:sync-playlists', { detail: data.playlists }));
        }
      }
    } catch (e) {
      console.warn('PC offline para sincronização:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshLibrary]);

  useEffect(() => {
    refreshLibrary();
    syncWithPc();
  }, [refreshLibrary, syncWithPc]);

  const downloadToPcAndSave = useCallback(async (track: Track): Promise<boolean> => {
    if (downloadingIds.has(track.id)) return false;

    setDownloadingIds((prev) => new Set(prev).add(track.id));
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mptreco_admin_token') : null;
      const downloadParams = new URLSearchParams({
        id: track.id,
        title: track.title,
        artist: track.artist,
        durationFormatted: track.durationFormatted,
        durationSeconds: track.durationSeconds.toString(),
        thumbnailUrl: track.thumbnailUrl,
        token: token || '',
      });

      const res = await fetch(`/api/download?${downloadParams.toString()}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Falha ao baixar no PC');

      await syncWithPc();
      return true;
    } catch (err) {
      console.warn(`Aviso no download da faixa ${track.id}:`, err);
      // Não exibe alert bloqueante se a sincronização puder recuperar o arquivo
      return false;
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  }, [downloadingIds, syncWithPc]);

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
    downloadToPcAndSave,
    removeTrack,
    importLocalFiles,
    refreshLibrary,
    getTrackBlobUrl,
    checkDownloaded: isTrackDownloaded,
  };
};
