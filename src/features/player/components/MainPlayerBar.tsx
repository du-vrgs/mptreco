'use client';

import React from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '@/features/themes/context/ThemeContext';
import { PlaybackState, RepeatMode, ThemeSkin } from '@/shared/types';

export const MainPlayerBar: React.FC = () => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    changeVolume,
    toggleMute,
    setRepeatMode,
    setIsShuffle,
  } = usePlayer();

  const { currentSkin } = useTheme();

  const isWmp = currentSkin === ThemeSkin.WMP_CLASSIC_2000;
  const isWinamp = currentSkin === ThemeSkin.WINAMP_RETRO;

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleRepeatToggle = () => {
    if (repeatMode === RepeatMode.OFF) setRepeatMode(RepeatMode.ALL);
    else if (repeatMode === RepeatMode.ALL) setRepeatMode(RepeatMode.ONE);
    else setRepeatMode(RepeatMode.OFF);
  };

  if (!currentTrack) return null;

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all select-none ${
        isWinamp
          ? 'bg-[#181818] border-t-2 border-r-2 border-l-2 border-b-2 border-t-[#4e4e4e] border-l-[#4e4e4e] border-r-[#101010] border-b-[#101010] p-2.5 shadow-2xl font-mono text-green-400'
          : isWmp
          ? 'bg-gradient-to-b from-[#1b2a47] via-[#0d1627] to-[#050b14] border-t border-sky-400/50 shadow-[0_-8px_25px_rgba(14,165,233,0.3)] p-2.5 pb-safe'
          : 'bg-zinc-950/95 border-t border-zinc-800 p-3 pb-safe backdrop-blur-xl'
      }`}
    >
      <div className="max-w-xl mx-auto flex flex-col gap-1.5">
        {/* Display Retrô LCD / Digital no topo do player */}
        <div
          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
            isWinamp
              ? 'bg-black border-green-800/80 text-green-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]'
              : isWmp
              ? 'bg-[#080f1d] border-sky-600/40 text-sky-200 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="font-bold truncate text-[11px] md:text-xs">
              {currentTrack.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] flex-shrink-0">
            <span className="text-cyan-300">{formatSeconds(currentTime)}</span>
            <span className="opacity-40">/</span>
            <span className="opacity-70">{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Barra de Progresso WMP / Winamp */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            seek(ratio * duration);
          }}
          className={`w-full h-2.5 rounded-sm relative cursor-pointer overflow-hidden border ${
            isWinamp
              ? 'bg-[#0c0c0c] border-[#333]'
              : isWmp
              ? 'bg-slate-950 border-sky-800/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]'
              : 'bg-zinc-800 border-zinc-700'
          }`}
        >
          <div
            className={`h-full transition-all duration-75 relative ${
              isWinamp
                ? 'bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_8px_#22c55e]'
                : isWmp
                ? 'bg-gradient-to-r from-sky-600 via-cyan-400 to-sky-300 shadow-[0_0_8px_#38bdf8]'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Knob do cursor retrô */}
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-sm" />
          </div>
        </div>

        {/* Linha dos Controles de Mídia Físicos / Y2K */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {/* Capa Compacta */}
          <div className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0 border border-white/20 bg-black">
            <Image
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          {/* Botões Retrô Estilo Hardware WMP Corona / Winamp */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShuffle((prev) => !prev)}
              className={`p-1.5 rounded transition-all text-xs ${
                isShuffle
                  ? 'text-cyan-400 bg-cyan-950/50 ring-1 ring-cyan-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Previous */}
            <button
              onClick={playPrevious}
              className={`p-2 rounded-full border active:scale-95 transition-all ${
                isWinamp
                  ? 'bg-gradient-to-b from-[#3a3a3a] to-[#1c1c1c] border-[#555] text-zinc-200'
                  : isWmp
                  ? 'bg-gradient-to-b from-[#253d66] to-[#0f1d33] border-sky-400/40 text-sky-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
              title="Anterior"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play/Pause Orb Botão Grande Anos 2000 */}
            <button
              onClick={togglePlayPause}
              className={`p-3 rounded-full border active:scale-90 transition-all ${
                isWinamp
                  ? 'bg-gradient-to-b from-[#2e2e2e] to-[#0f0f0f] border-green-500 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                  : isWmp
                  ? 'bg-gradient-to-b from-[#56c6ff] via-[#0284c7] to-[#034d75] border-sky-200/60 text-white shadow-[0_0_16px_rgba(14,165,233,0.7),inset_0_2px_4px_rgba(255,255,255,0.7)]'
                  : 'bg-white text-black'
              }`}
              title="Play/Pause"
            >
              {playbackState === PlaybackState.PLAYING ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              className={`p-2 rounded-full border active:scale-95 transition-all ${
                isWinamp
                  ? 'bg-gradient-to-b from-[#3a3a3a] to-[#1c1c1c] border-[#555] text-zinc-200'
                  : isWmp
                  ? 'bg-gradient-to-b from-[#253d66] to-[#0f1d33] border-sky-400/40 text-sky-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
              title="Próxima"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleRepeatToggle}
              className={`p-1.5 rounded transition-all text-xs ${
                repeatMode !== RepeatMode.OFF
                  ? 'text-cyan-400 bg-cyan-950/50 ring-1 ring-cyan-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={`Repetir: ${repeatMode}`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume Rápido */}
          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white p-1">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="w-14 h-1.5 accent-sky-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
