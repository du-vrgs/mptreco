'use client';

import React, { useRef } from 'react';
import { Upload, HardDrive, Music, Trash2, Play, Download, Laptop, RefreshCw } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
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
    downloadTrack,
    syncWithPc,
    importLocalFiles,
  } = useLibrary();

  const { playTrack, currentTrack } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar MP3
          </button>
        </div>
      </div>

      {/* Seção 1: Músicas disponíveis no PC prontas para baixar pro celular */}
      {pcTracks.length > 0 && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Laptop className="w-4 h-4" />
              Músicas no seu PC (Túnel Conectado)
            </h3>
            <button
              onClick={syncWithPc}
              disabled={isSyncing}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              title="Atualizar lista do PC"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Clique em <strong>Baixar para o Celular</strong> para salvar no IndexedDB. Depois você pode desligar o PC.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {pcTracks.map((pt) => {
              const isSavedOnPhone = downloadedSet.has(pt.id);
              const isDownloading = downloadingIds.has(pt.id);
              const trackObj: Track = {
                id: pt.id,
                title: pt.filename.replace('.mp3', ''),
                artist: 'PC Local',
                durationSeconds: 0,
                durationFormatted: '--:--',
                thumbnailUrl: `https://i.ytimg.com/vi/${pt.id}/hqdefault.jpg`,
                sourceType: AudioSourceType.YOUTUBE_STREAM,
                createdAt: Date.now(),
              };

              return (
                <div
                  key={pt.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-emerald-500/20"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate">
                      {pt.filename}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {(pt.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>

                  <button
                    onClick={() => downloadTrack(trackObj)}
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
                  <div className="p-2.5 rounded-lg bg-zinc-800 text-sky-400">
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

                <div className="flex items-center gap-2">
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
    </div>
  );
};
