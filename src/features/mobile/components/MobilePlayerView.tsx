'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Music, Radio, Wifi, WifiOff, Sparkles } from 'lucide-react';
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

  // Unir faixas do PC e offline sem duplicatas
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
      className={`min-h-screen flex flex-col pb-36 transition-colors duration-500 ${
        isWmp
          ? 'bg-[#091122] text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]'
          : isWinamp
          ? 'bg-black text-green-400 font-mono'
          : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Header Compacto de Celular */}
      <header className="sticky top-0 z-30 px-4 py-3.5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>mptreco</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                POCKET
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400">
              {displayTracks.length} faixas prontas para ouvir
            </p>
          </div>
        </div>

        {/* Alternador rápido de Skin e sincronização */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              changeSkin(
                currentSkin === ThemeSkin.WMP_CLASSIC_2000
                  ? ThemeSkin.WINAMP_RETRO
                  : ThemeSkin.WMP_CLASSIC_2000
              )
            }
            className="p-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:text-white text-xs border border-zinc-700"
            title="Alternar Skin"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Lista Pura de Faixas para o Celular */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 py-4 flex flex-col gap-2.5">
        <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between px-1 mb-1">
          <span>FAIXAS DISPONÍVEIS</span>
          <span className="text-emerald-400 text-[10px] flex items-center gap-1">
            <Wifi className="w-3 h-3" /> Auto-Cache Ativo
          </span>
        </div>

        {displayTracks.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-900/20">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Nenhuma música no catálogo ainda
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Abra o app no seu PC para buscar e baixar as músicas. Elas aparecerão aqui instantaneamente.
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
                className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-sky-950/70 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                    : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800/80'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black">
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
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                {/* Detalhes */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4
                    className={`text-xs md:text-sm font-semibold truncate ${
                      isPlaying ? 'text-sky-300' : 'text-zinc-100'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                    <span className="truncate max-w-[130px]">{track.artist}</span>
                    <span>•</span>
                    <span className="font-mono">{track.durationFormatted}</span>
                  </div>
                </div>

                {/* Status do Cache no Celular */}
                <div className="flex items-center flex-shrink-0">
                  {isSaved ? (
                    <span
                      title="Salva na memória do celular"
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono"
                    >
                      <WifiOff className="w-2.5 h-2.5" />
                      OFFLINE
                    </span>
                  ) : (
                    <span
                      title="No PC (será salva ao tocar)"
                      className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono"
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

      {/* Player Fixo no Rodapé com tela desligada / background play */}
      <MainPlayerBar />
    </div>
  );
};
