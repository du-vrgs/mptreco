'use client';

import React from 'react';
import { Palette, Monitor, Sparkles, Radio } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeSkin } from '@/shared/types';

export const ThemeSelector: React.FC = () => {
  const { currentSkin, changeSkin } = useTheme();

  const themes = [
    {
      id: ThemeSkin.WMP_CLASSIC_2000,
      label: 'WMP 2000 Corona',
      desc: 'Bordas cromadas, botões orbes azuis e visualizador clássico',
      icon: Monitor,
      color: 'from-sky-500 to-blue-700',
    },
    {
      id: ThemeSkin.WINAMP_RETRO,
      label: 'Winamp Classic',
      desc: 'Estilo Bento, neon verde e displays escuros retrô',
      icon: Radio,
      color: 'from-emerald-500 to-green-700',
    },
    {
      id: ThemeSkin.FRUTIGER_AERO,
      label: 'Frutiger Aero',
      desc: 'Vidro transparente, reflexos aquosos e estética anos 2000',
      icon: Sparkles,
      color: 'from-cyan-400 to-blue-500',
    },
    {
      id: ThemeSkin.MODERN_MINIMAL,
      label: 'Modern Minimal',
      desc: 'Escuro limpo, minimalista e tipografia refinada',
      icon: Palette,
      color: 'from-zinc-700 to-zinc-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {themes.map((theme) => {
        const Icon = theme.icon;
        const isSelected = currentSkin === theme.id;

        return (
          <button
            key={theme.id}
            onClick={() => changeSkin(theme.id)}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-200 ${
              isSelected
                ? 'bg-zinc-800/90 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                : 'bg-zinc-900/40 hover:bg-zinc-800/50 border-zinc-800'
            }`}
          >
            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${theme.color} text-white shadow-md flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                {theme.label}
                {isSelected && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-mono">
                    ATIVO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-snug">
                {theme.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
