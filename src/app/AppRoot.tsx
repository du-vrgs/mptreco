'use client';

import React, { useState } from 'react';
import { Search, HardDrive, ListMusic, Palette, Radio } from 'lucide-react';
import { PlayerProvider } from '@/features/player/context/PlayerContext';
import { LibraryProvider } from '@/features/library/context/LibraryContext';
import { PlaylistProvider } from '@/features/playlists/context/PlaylistContext';
import { ThemeProvider, useTheme } from '@/features/themes/context/ThemeContext';
import { TabNavigation, ThemeSkin } from '@/shared/types';
import { useSearchHelper } from '@/features/search/hooks/useSearchHelper';
import { SearchInput } from '@/features/search/components/SearchInput';
import { TrackCard } from '@/features/search/components/TrackCard';
import { MainPlayerBar } from '@/features/player/components/MainPlayerBar';
import { LibraryView } from '@/features/library/components/LibraryView';
import { PlaylistsView } from '@/features/playlists/components/PlaylistsView';
import { ThemeSelector } from '@/features/themes/components/ThemeSelector';

const MainShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabNavigation>(TabNavigation.SEARCH);
  const { currentSkin } = useTheme();
  const { query, results, isSearching, hasSearched, handleQueryChange, clearSearch } = useSearchHelper();

  const isWmp = currentSkin === ThemeSkin.WMP_CLASSIC_2000;
  const isWinamp = currentSkin === ThemeSkin.WINAMP_RETRO;
  const isFrutiger = currentSkin === ThemeSkin.FRUTIGER_AERO;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 pb-36 ${
        isWmp
          ? 'bg-[#0b1325] text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]'
          : isWinamp
          ? 'bg-black text-green-400 font-mono'
          : isFrutiger
          ? 'bg-gradient-to-br from-sky-950 via-slate-900 to-teal-950 text-cyan-50'
          : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Header com Estética Y2K / WMP Chrome Bar */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 backdrop-blur-xl border-b transition-all duration-300 ${
          isWmp
            ? 'bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-sky-400/40 shadow-[0_4px_20px_rgba(14,165,233,0.15)]'
            : isWinamp
            ? 'bg-zinc-950 border-green-600/50'
            : isFrutiger
            ? 'bg-white/5 border-white/10 shadow-lg'
            : 'bg-zinc-950/80 border-zinc-800'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center shadow-lg ${
              isWmp
                ? 'bg-gradient-to-br from-sky-400 to-blue-700 text-white shadow-sky-500/30 ring-1 ring-white/30'
                : isWinamp
                ? 'bg-green-500 text-black'
                : 'bg-indigo-600 text-white'
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-1.5">
                <span>mptreco</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase ${
                  isWmp ? 'bg-sky-500/20 text-sky-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  v2000
                </span>
              </h1>
              <p className="text-[10px] text-zinc-400 -mt-0.5 hidden sm:block">
                YouTube Streamer & Offline MP3 Player com Background Play
              </p>
            </div>
          </div>

          {/* Navegação entre Abas */}
          <nav className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
            {[
              { id: TabNavigation.SEARCH, label: 'Buscar', icon: Search },
              { id: TabNavigation.LIBRARY, label: 'Offline', icon: HardDrive },
              { id: TabNavigation.PLAYLISTS, label: 'Playlists', icon: ListMusic },
              { id: TabNavigation.SETTINGS, label: 'Skins', icon: Palette },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? isWmp
                        ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.5)]'
                        : isWinamp
                        ? 'bg-green-500 text-black font-bold'
                        : 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* Aba de Busca */}
        {activeTab === TabNavigation.SEARCH && (
          <div className="flex flex-col gap-6">
            <div className="max-w-2xl mx-auto w-full">
              <SearchInput
                value={query}
                onChange={handleQueryChange}
                onClear={clearSearch}
                isLoading={isSearching}
              />
            </div>

            {/* Resultados */}
            <div className="flex flex-col gap-2">
              {results.length > 0 && (
                <div className="text-xs font-mono text-zinc-400 px-1 mb-1">
                  {results.length} RESULTADOS ENCONTRADOS NO YOUTUBE
                </div>
              )}

              {results.map((track) => (
                <TrackCard key={track.id} track={track} allTracksInList={results} />
              ))}

              {hasSearched && results.length === 0 && !isSearching && (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  Nenhum resultado encontrado para &quot;{query}&quot;. Tente outro termo.
                </div>
              )}

              {!hasSearched && (
                <div className="py-16 text-center text-zinc-500">
                  <div className="max-w-md mx-auto p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
                    <p className="text-sm font-medium text-zinc-300">
                      Toque direto ou baixe para ouvir com tela desligada
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      Digite o nome de uma música, artista ou cole a URL de um vídeo do YouTube no campo acima.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba Minha Biblioteca Offline */}
        {activeTab === TabNavigation.LIBRARY && <LibraryView />}

        {/* Aba Playlists */}
        {activeTab === TabNavigation.PLAYLISTS && <PlaylistsView />}

        {/* Aba de Skins & Configurações */}
        {activeTab === TabNavigation.SETTINGS && (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-base font-bold text-white mb-1">
                Skins dos Anos 2000 & Temas
              </h2>
              <p className="text-xs text-zinc-400 mb-4">
                Personalize a aparência do player com a nostalgia de 2000 até a elegância moderna.
              </p>
              <ThemeSelector />
            </div>
          </div>
        )}
      </main>

      {/* Player Fixo no Rodapé */}
      <MainPlayerBar />
    </div>
  );
};

export const AppRoot: React.FC = () => {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <PlaylistProvider>
          <PlayerProvider>
            <MainShell />
          </PlayerProvider>
        </PlaylistProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
};
