'use client';

import React from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Radio,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '@/features/themes/context/ThemeContext';
import { PlaybackState, RepeatMode, ThemeSkin } from '@/shared/types';
import { SpectrumVisualizer } from './SpectrumVisualizer';

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
  const isFrutiger = currentSkin === ThemeSkin.FRUTIGER_AERO;

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

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 text-center text-xs text-zinc-500 font-mono">
        mptreco 2000 • Nenhum áudio em reprodução. Busque uma música ou abra a biblioteca.
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 p-3 md:p-4 backdrop-blur-xl transition-all duration-300 border-t ${
        isWmp
          ? 'bg-gradient-to-b from-slate-800/95 via-slate-900/95 to-sky-950/95 border-sky-500/50 shadow-[0_-10px_25px_rgba(0,180,255,0.15)]'
          : isWinamp
          ? 'bg-black/95 border-green-500/40 shadow-[0_-5px_20px_rgba(34,197,94,0.15)]'
          : isFrutiger
          ? 'bg-sky-500/20 border-cyan-300/40 shadow-[0_-8px_32px_rgba(6,182,212,0.2)]'
          : 'bg-zinc-950/95 border-zinc-800 shadow-2xl'
      }`}
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        {/* Barra de Progresso Superior */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
            {formatSeconds(currentTime)}
          </span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = clickX / rect.width;
              seek(ratio * duration);
            }}
            className="flex-1 h-2 rounded-full bg-zinc-800 relative cursor-pointer group overflow-hidden"
          >
            <div
              className={`h-full transition-all duration-100 ${
                isWmp
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-300 shadow-[0_0_8px_#38bdf8]'
                  : isWinamp
                  ? 'bg-green-400 shadow-[0_0_8px_#22c55e]'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-400 w-10">
            {formatSeconds(duration)}
          </span>
        </div>

        {/* Linha Principal de Controles & Informações */}
        <div className="flex items-center justify-between gap-3">
          {/* Informações da Faixa Atual */}
          <div className="flex items-center gap-3 min-w-0 max-w-[35%] md:max-w-[30%]">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
              <Image
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs md:text-sm font-semibold truncate text-white">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Botões Centrais (Estilo Anos 2000 Glossy) */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setIsShuffle((prev) => !prev)}
              title="Modo Aleatório"
              className={`p-2 rounded-full hidden sm:block transition-colors ${
                isShuffle ? 'text-cyan-400 bg-cyan-950/40' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={playPrevious}
              title="Faixa Anterior"
              className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Botão Play/Pause estilo Glossy Orb WMP */}
            <button
              onClick={togglePlayPause}
              title="Play/Pause"
              className={`p-3 md:p-3.5 rounded-full shadow-lg active:scale-90 transition-all ${
                isWmp
                  ? 'bg-gradient-to-b from-sky-400 via-sky-600 to-sky-800 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] border border-sky-300/40'
                  : isWinamp
                  ? 'bg-zinc-900 border border-green-500 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {playbackState === PlaybackState.PLAYING ? (
                <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              ) : (
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              title="Próxima Faixa"
              className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={handleRepeatToggle}
              title={`Repetir: ${repeatMode}`}
              className={`p-2 rounded-full hidden sm:block transition-colors ${
                repeatMode !== RepeatMode.OFF
                  ? 'text-cyan-400 bg-cyan-950/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Volume e Mini Visualizador */}
          <div className="hidden lg:flex items-center gap-3 w-56">
            <div className="w-24">
              <SpectrumVisualizer />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-16 accent-sky-400 h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
