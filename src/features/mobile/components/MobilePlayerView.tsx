'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Music, Radio, Wifi, WifiOff, Sparkles, RefreshCw } from 'lucide-react';
import { useLibrary } from '@/features/library/context/LibraryContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { useTheme } from '@/features/themes/context/ThemeContext';
import { MainPlayerBar } from '@/features/player/components/MainPlayerBar';
import { ThemeSkin, Track } from '@/shared/types';

export const MobilePlayerView: React.FC = () => {
  const { pcTracks, offlineTracks, isSyncing, syncWithPc, downloadedSet } = useLibrary();
  const { playTrack, currentTrack } = usePlayer();
  const { currentSkin, changeSkin } = useTheme();

  const isWmp = currentSkin === ThemeSkin.WMP_CLASSIC_2000;
  const isWinamp = currentSkin === ThemeSkin.WINAMP_RETRO;

  const allTracksMap = new Map<string, Track>();
  for (const t of pcTracks) {
    allTracksMap.set(t.id, t);
  }
  for (const t of offlineTracks) {
    allTracksMap.set(t.id, t);
  }
  const displayTracks = Array.from(allTracksMap.values());

  return (
    <div
      className={`fixed inset-0 overflow-hidden flex flex-col transition-colors duration-500 ${
        isWmp
          ? 'bg-[#080e1b] text-slate-100'
          : isWinamp
          ? 'bg-black text-green-400 font-mono'
          : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Header Fixo Retrô do App Mobile */}
      <header
        className={`flex-shrink-0 px-4 py-2.5 border-b flex items-center justify-between z-20 ${
          isWinamp
            ? 'bg-[#181818] border-[#333]'
            : isWmp
            ? 'bg-gradient-to-r from-[#111f38] via-[#1a3159] to-[#111f38] border-sky-500/40 shadow-md'
            : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>mptreco</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                {isWinamp ? 'WINAMP' : 'WMP 2000'}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={syncWithPc}
            disabled={isSyncing}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
            title="Sincronizar com o PC"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={() =>
              changeSkin(
                currentSkin === ThemeSkin.WMP_CLASSIC_2000
                  ? ThemeSkin.WINAMP_RETRO
                  : ThemeSkin.WMP_CLASSIC_2000
              )
            }
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
            title="Trocar tema"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Sub-barra de Status do Catálogo */}
      <div className="flex-shrink-0 px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>{displayTracks.length} MÚSICAS NO CATÁLOGO</span>
        <span className="text-emerald-400 text-[10px] flex items-center gap-1">
          <Wifi className="w-3 h-3" /> Auto-Cache Ativo
        </span>
      </div>

      {/* Área Única de Scroll - Somente a Lista de Músicas */}
      <main
        className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2 overscroll-contain"
        style={{ paddingBottom: currentTrack ? '140px' : '20px' }}
      >
        {displayTracks.length === 0 ? (
          <div className="my-auto py-12 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-900/20">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Nenhuma música no catálogo ainda
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Baixe músicas no app do seu PC (localhost:3000). Elas aparecerão aqui instantaneamente.
            </p>
          </div>
        ) : (
          displayTracks.map((track) => {
            const isPlaying = currentTrack?.id === track.id;
            const isSaved = downloadedSet.has(track.id);

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, displayTracks)}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                  isPlaying
                    ? isWinamp
                      ? 'bg-green-950/40 border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                      : 'bg-sky-950/60 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                    : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800/80'
                }`}
              >
                {/* Thumbnail Retrô */}
                <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-white/10">
                  <Image
                    src={track.thumbnailUrl}
                    alt={track.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 ${
                      isPlaying ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>

                {/* Detalhes da Música */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4
                    className={`text-xs md:text-sm font-semibold truncate ${
                      isPlaying
                        ? isWinamp
                          ? 'text-green-300 font-bold'
                          : 'text-sky-300 font-bold'
                        : 'text-zinc-100'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                    <span className="truncate max-w-[140px]">{track.artist}</span>
                    <span>•</span>
                    <span className="font-mono">{track.durationFormatted}</span>
                  </div>
                </div>

                {/* Status: Offline vs Túnel */}
                <div className="flex items-center flex-shrink-0">
                  {isSaved ? (
                    <span
                      title="Salva no aparelho"
                      className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono font-bold"
                    >
                      <WifiOff className="w-2.5 h-2.5" />
                      OFFLINE
                    </span>
                  ) : (
                    <span
                      title="No PC (toca e salva no cache)"
                      className="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono"
                    >
                      PC TUNNEL
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Player Retrô Fixo e Permanente no Rodapé */}
      <MainPlayerBar />
    </div>
  );
};
