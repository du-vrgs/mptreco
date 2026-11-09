'use client';

import React, { useRef, useState } from 'react';
import { Upload, HardDrive, Music, Trash2, Play, Download, Laptop, RefreshCw, ListPlus } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { AddToPlaylistModal } from '@/features/playlists/components/AddToPlaylistModal';
import { AudioSourceType, Track } from '@/shared/types';

export const LibraryView: React.FC = () => {
  const {
    offlineTracks,
    pcTracks,
    isLoading,
    isSyncing,
    downloadingIds,
    downloadedSet,
    removeTrack,
    downloadToPcAndSave,
    syncWithPc,
    importLocalFiles,
  } = useLibrary();

  const { playTrack, currentTrack } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [modalTrack, setModalTrack] = useState<Track | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importLocalFiles(e.target.files);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Banner da Biblioteca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-zinc-900/50 border border-sky-500/20 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-sky-400" />
            Minhas Músicas Offline no Celular
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Salvas no IndexedDB deste aparelho. Funcionam sem Wi-Fi, no modo avião e com a tela apagada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs md:text-sm font-medium border border-zinc-700/60 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            Importar MP3
          </button>

          <button
            onClick={syncWithPc}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs md:text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar PC
          </button>
        </div>
      </div>

      {/* Seção 1: Músicas Disponíveis no PC */}
      {pcTracks.length > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-zinc-900/40 to-black/40 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" />
              Músicas no seu PC ({pcTracks.length})
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">
              Prontas para baixar ou ouvir
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {pcTracks.map((pt) => {
              const isSavedOnPhone = downloadedSet.has(pt.id);
              const isDownloading = downloadingIds.has(pt.id);
              const trackObj: Track = {
                id: pt.id,
                title: (pt.filename || pt.title).replace('.mp3', ''),
                artist: pt.artist || 'PC Local',
                durationSeconds: pt.durationSeconds || 0,
                durationFormatted: pt.durationFormatted || '--:--',
                thumbnailUrl: pt.thumbnailUrl || `https://i.ytimg.com/vi/${pt.id}/hqdefault.jpg`,
                sourceType: AudioSourceType.YOUTUBE_STREAM,
                createdAt: Date.now(),
              };

              return (
                <div
                  key={pt.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-emerald-500/20"
                >
                  <div
                    onClick={() => playTrack(trackObj, pcTracks)}
                    className="min-w-0 pr-2 cursor-pointer flex-1"
                  >
                    <h4 className="text-xs font-semibold text-zinc-200 truncate hover:text-sky-300 transition-colors">
                      {pt.filename || pt.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {pt.sizeBytes ? (pt.sizeBytes / (1024 * 1024)).toFixed(1) : '0'} MB
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTrack(trackObj);
                      }}
                      title="Salvar em Playlist"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-300 hover:bg-white/10 transition-colors"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => downloadToPcAndSave(pt)}
                      disabled={isSavedOnPhone || isDownloading}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSavedOnPhone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : isDownloading
                          ? 'bg-sky-500/20 text-sky-300 animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isSavedOnPhone ? 'No Celular' : isDownloading ? 'Salvando...' : 'Salvar no Celular'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seção 2: Músicas Salvas neste Aparelho */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-2">
          <span>{offlineTracks.length} MÚSICAS SALVAS NESTE APARELHO</span>
          {offlineTracks.length > 0 && (
            <button
              onClick={() => playTrack(offlineTracks[0], offlineTracks)}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-sans text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Tocar Tudo
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-zinc-500 font-mono">
            Carregando memória do aparelho...
          </div>
        ) : offlineTracks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/20">
            <Music className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">
              Nenhuma música salva no celular ainda
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Baixe músicas no seu PC ou pesquise e clique no ícone de download. Elas ficarão salvas no IndexedDB deste navegador permanentemente.
            </p>
          </div>
        ) : (
          offlineTracks.map((track) => {
            const isPlaying = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, offlineTracks)}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-sky-950/60 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-zinc-800 text-sky-400 flex-shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-sm font-semibold truncate ${isPlaying ? 'text-sky-300' : 'text-zinc-100'}`}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Botão Adicionar a Playlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalTrack(track);
                    }}
                    title="Adicionar à playlist"
                    className="p-2 text-zinc-400 hover:text-sky-300 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remover "${track.title}" da memória deste celular?`)) {
                        removeTrack(track.id);
                      }
                    }}
                    title="Excluir do dispositivo"
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Adicionar à Playlist */}
      {modalTrack && (
        <AddToPlaylistModal
          track={modalTrack}
          isOpen={!!modalTrack}
          onClose={() => setModalTrack(null)}
        />
      )}
    </div>
  );
};
