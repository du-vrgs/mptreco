'use client';

import React, { useRef } from 'react';
import { Upload, HardDrive, Music, Trash2, Play } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { Track } from '@/shared/types';

export const LibraryView: React.FC = () => {
  const { offlineTracks, isLoading, removeTrack, importLocalFiles } = useLibrary();
  const { playTrack, currentTrack } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await importLocalFiles(e.target.files);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Banner / Ações da Biblioteca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-zinc-900/50 border border-sky-500/20 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-sky-400" />
            Minha Biblioteca Offline
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Músicas salvas no seu dispositivo (IndexedDB). Funcionam 100% sem internet e com a tela apagada.
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs md:text-sm shadow-lg shadow-sky-600/30 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Importar MP3 do Dispositivo
          </button>
        </div>
      </div>

      {/* Lista de Músicas Baixadas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-2">
          <span>{offlineTracks.length} MÚSICAS NO DISPOSITIVO</span>
          {offlineTracks.length > 0 && (
            <button
              onClick={() => playTrack(offlineTracks[0], offlineTracks)}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-sans"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Tocar Tudo
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-zinc-500 font-mono">
            Carregando armazenamento local...
          </div>
        ) : offlineTracks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/20">
            <Music className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">
              Nenhuma música offline ainda
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Pesquise músicas e clique em baixar, ou use o botão acima para importar arquivos .mp3 que você já tenha no celular ou PC.
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
                  <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                    {track.durationFormatted}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remover "${track.title}" do dispositivo?`)) {
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
