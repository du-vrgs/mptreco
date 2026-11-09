import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioSourceType, Track } from '@/shared/types';
import {
  getOfflineTracks,
  saveTrackOffline,
  deleteTrackOffline,
  isTrackDownloaded,
  getTrackBlobUrl,
} from '../services/indexedDbStorageService';

const PENDING_DOWNLOADS_KEY = 'mptreco_pending_downloads';

export const useLibraryHelper = () => {
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());
  const [pendingTracks, setPendingTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pcTracks, setPcTracks] = useState<Track[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const pendingRef = useRef<Track[]>([]);

  // Carrega downloads pendentes salvos em localStorage ao inicializar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(PENDING_DOWNLOADS_KEY);
      if (stored) {
        const parsed: Track[] = JSON.parse(stored);
        setPendingTracks(parsed);
        pendingRef.current = parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler downloads pendentes:', e);
    }
  }, []);

  const savePendingToStorage = (tracks: Track[]) => {
    setPendingTracks(tracks);
    pendingRef.current = tracks;
    if (typeof window !== 'undefined') {
      localStorage.setItem(PENDING_DOWNLOADS_KEY, JSON.stringify(tracks));
    }
  };

  const addPendingTrack = useCallback((track: Track) => {
    const exists = pendingRef.current.some((t) => t.id === track.id);
    if (!exists) {
      const updated = [...pendingRef.current, track];
      savePendingToStorage(updated);
    }
  }, []);

  const removePendingTrack = useCallback((trackId: string) => {
    const updated = pendingRef.current.filter((t) => t.id !== trackId);
    savePendingToStorage(updated);
  }, []);

  const refreshLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      const tracks = await getOfflineTracks();
      setOfflineTracks(tracks);
      const downloadedIds = new Set(tracks.map((t) => t.id));
      setDownloadedSet(downloadedIds);

      // Limpa automaticamente pendentes que já foram baixados
      const stillPending = pendingRef.current.filter((t) => !downloadedIds.has(t.id));
      if (stillPending.length !== pendingRef.current.length) {
        savePendingToStorage(stillPending);
      }
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

    // Registra como download pendente persistente para o caso de reload de página
    addPendingTrack(track);
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

      removePendingTrack(track.id);
      await syncWithPc();
      return true;
    } catch (err) {
      console.warn(`Aviso no download da faixa ${track.id}:`, err);
      return false;
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  }, [downloadingIds, addPendingTrack, removePendingTrack, syncWithPc]);

  // Função para reiniciar um download pendente
  const retryPendingDownload = useCallback(async (track: Track) => {
    await downloadToPcAndSave(track);
  }, [downloadToPcAndSave]);

  // Função para descartar um download pendente
  const discardPendingDownload = useCallback((trackId: string) => {
    removePendingTrack(trackId);
  }, [removePendingTrack]);

  // Remove a música da memória do dispositivo (IndexedDB) E também do disco do PC se for o caso
  const removeTrack = useCallback(async (trackId: string): Promise<void> => {
    // 1. Remove do armazenamento offline do navegador (IndexedDB)
    await deleteTrackOffline(trackId);

    // 2. Notifica o backend/PC para deletar o arquivo físico .mp3 do disco rígido
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mptreco_admin_token') : null;
      const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
      await fetch(`/api/delete?id=${encodeURIComponent(trackId)}${tokenParam}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Não foi possível deletar arquivo físico no PC:', e);
    }

    // 3. Atualiza estado e ressincroniza o catálogo
    await refreshLibrary();
    await syncWithPc();
  }, [refreshLibrary, syncWithPc]);

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
    pendingTracks,
    isLoading,
    isSyncing,
    downloadingIds,
    downloadedSet,
    syncWithPc,
    downloadToPcAndSave,
    retryPendingDownload,
    discardPendingDownload,
    removeTrack,
    importLocalFiles,
    refreshLibrary,
    getTrackBlobUrl,
  };
};
