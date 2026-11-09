'use client';

import React from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useTheme } from '@/features/themes/context/ThemeContext';
import { ThemeSkin } from '@/shared/types';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  isLoading,
}) => {
  const { currentSkin } = useTheme();

  const isWmp = currentSkin === ThemeSkin.WMP_CLASSIC_2000;
  const isWinamp = currentSkin === ThemeSkin.WINAMP_RETRO;

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        ) : (
          <Search className={`w-5 h-5 ${isWinamp ? 'text-green-400' : isWmp ? 'text-blue-300' : 'text-zinc-400'}`} />
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar vídeos ou músicas no YouTube..."
        className={`w-full pl-11 pr-10 py-3.5 rounded-xl text-sm md:text-base outline-none transition-all duration-200 ${
          isWinamp
            ? 'bg-black text-green-400 border border-green-600 focus:border-green-400 font-mono shadow-[0_0_10px_rgba(34,197,94,0.2)]'
            : isWmp
            ? 'bg-slate-900/90 text-sky-100 border border-sky-400/50 focus:border-sky-300 focus:ring-2 focus:ring-sky-500/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
            : 'bg-zinc-900/80 text-zinc-100 border border-zinc-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
        }`}
      />

      {value && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors"
          title="Limpar busca"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
