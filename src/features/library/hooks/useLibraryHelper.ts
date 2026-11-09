import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioSourceType, Track } from '@/shared/types';
import {
  getOfflineTracks,
  saveTrackOffline,
  deleteTrackOffline,
  isTrackDownloaded,
  getTrackBlob,
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
    // No Desktop local (ou quando logado), sincroniza a lista de tracks do daemon
    try {
      setIsSyncing(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('mptreco_admin_token') : null;
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
      const res = await fetch(`/api/sync${tokenParam}`);
      if (res.ok) {
        const data = await res.json();
        const serverTracks: Track[] = (data.tracks || []).map((t: Track) => ({
          ...t,
          sourceType: AudioSourceType.YOUTUBE_STREAM,
        }));
        setPcTracks(serverTracks);

        // Se estiver em modo mobile, salva no cache local IndexedDB e limpa do PC
        const isMobileMode = typeof window !== 'undefined' && localStorage.getItem('mptreco_mode') === 'mobile';
        if (isMobileMode) {
          const currentOffline = await getOfflineTracks();
          const currentOfflineIds = new Set(currentOffline.map((t) => t.id));
          const missingTracks = serverTracks.filter((t) => !currentOfflineIds.has(t.id));

          for (const track of missingTracks) {
            try {
              const streamParam = token ? `&token=${encodeURIComponent(token)}` : '';
              const streamUrl = `/api/stream?id=${track.id}${streamParam}`;
              const fileRes = await fetch(streamUrl);
              if (fileRes.ok) {
                const blob = await fileRes.blob();
                await saveTrackOffline(track, blob);

                try {
                  await fetch(`/api/cleanup-pc?id=${encodeURIComponent(track.id)}${streamParam}`, {
                    method: 'POST',
                  });
                } catch (cleanErr) {
                  console.warn(`Aviso ao limpar arquivo da track ${track.id} no PC:`, cleanErr);
                }
              }
            } catch (downloadErr) {
              console.warn(`Erro ao baixar música ${track.title} no celular:`, downloadErr);
            }
          }
        }

        // Atualiza o estado da biblioteca offline após sincronizar
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

  // Permite salvar/copiar a biblioteca de músicas para uma pasta ou pen drive
  const exportLibraryToDisk = useCallback(async (): Promise<void> => {
    // 1. Tenta usar a File System Access API nativa do navegador (Chrome / Edge / Opera)
    // Permite que o usuário clique e selecione a pasta ou o Pen Drive diretamente no sistema de arquivos
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
        const tracks = await getOfflineTracks();
        if (tracks.length === 0 && pcTracks.length === 0) {
          alert('Nenhuma música encontrada na biblioteca para exportar.');
          return;
        }

        let copied = 0;
        const allToExport = tracks.length > 0 ? tracks : pcTracks;

        for (const track of allToExport) {
          try {
            let blob: Blob | null = await getTrackBlob(track.id);

            // Se não estiver em cache local no navegador, busca do backend do PC
            if (!blob) {
              const token = localStorage.getItem('mptreco_admin_token') || '';
              const streamRes = await fetch(`/api/stream?id=${track.id}&token=${encodeURIComponent(token)}`);
              if (streamRes.ok) {
                blob = await streamRes.blob();
              }
            }

            if (blob) {
              const safeName = `${track.artist} - ${track.title}`.replace(/[\\/:*?"<>|]/g, '_') + '.mp3';
              const fileHandle = await dirHandle.getFileHandle(safeName, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();
              copied++;
            }
          } catch (e) {
            console.warn(`Erro ao salvar arquivo ${track.title}:`, e);
          }
        }

        alert(`Sucesso! ${copied} arquivos .mp3 foram copiados diretamente para o local selecionado.`);
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          return; // Usuário cancelou o seletor de pasta
        }
        console.warn('File System Access API falhou ou foi rejeitada, tentando via backend:', err);
      }
    }

    // 2. Fallback: pergunta o caminho da pasta no PC (ex: /media/edu/PENDRIVE ou ~/Musicas) e copia pelo daemon
    const targetPath = prompt(
      'Digite o caminho completo da pasta ou Pen Drive onde deseja salvar as músicas:\n(Ex: /media/edu/MEU_PENDRIVE ou ~/Musicas)',
      '~/Musicas/mptreco'
    );

    if (!targetPath || !targetPath.trim()) return;

    try {
      const token = localStorage.getItem('mptreco_admin_token') || '';
      const res = await fetch(`/api/export-pc?targetPath=${encodeURIComponent(targetPath.trim())}&token=${encodeURIComponent(token)}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Falha ao exportar no PC');
      const data = await res.json();
      alert(`Sucesso! ${data.copied_count} músicas foram copiadas para:\n${data.dest_dir}`);
    } catch (e) {
      console.error('Erro na exportação para o disco:', e);
      alert('Não foi possível exportar para o diretório especificado.');
    }
  }, [pcTracks]);

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
    exportLibraryToDisk,
    refreshLibrary,
    getTrackBlobUrl,
  };
};
