'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Play,
  Music,
  Radio,
  Wifi,
  WifiOff,
  Sparkles,
  RefreshCw,
  ListMusic,
  ListPlus,
  ChevronRight,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useLibrary } from '@/features/library/context/LibraryContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { useTheme } from '@/features/themes/context/ThemeContext';
import { usePlaylists } from '@/features/playlists/context/PlaylistContext';
import { MainPlayerBar } from '@/features/player/components/MainPlayerBar';
import { AddToPlaylistModal } from '@/features/playlists/components/AddToPlaylistModal';
import { ThemeSkin, Track } from '@/shared/types';

export const MobilePlayerView: React.FC = () => {
  const {
    pcTracks,
    offlineTracks,
    pendingTracks,
    isSyncing,
    syncWithPc,
    downloadedSet,
    downloadingIds,
    retryPendingDownload,
    discardPendingDownload,
  } = useLibrary();
  const { playTrack, currentTrack } = usePlayer();
  const { currentSkin, changeSkin } = useTheme();
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
  } = usePlaylists();

  const [activeTab, setActiveTab] = useState<'tracks' | 'playlists'>('tracks');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [modalTrack, setModalTrack] = useState<Track | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPl, setIsCreatingPl] = useState(false);

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

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const selectedTracks: Track[] = selectedPlaylist
    ? (selectedPlaylist.trackIds
        .map((id) => allTracksMap.get(id))
        .filter(Boolean) as Track[])
    : [];

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPl(false);
  };

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

        <div className="flex items-center gap-2">
          <button
            onClick={syncWithPc}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isSyncing
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow hover:opacity-90 active:scale-95'
            }`}
            title="Sincronizar músicas e playlists com o PC"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sync'}</span>
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

      {/* Navegação entre Músicas e Playlists no Mobile */}
      <div className="flex-shrink-0 px-3.5 py-1.5 bg-black/50 border-b border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => {
              setActiveTab('tracks');
              setSelectedPlaylistId(null);
            }}
            className={`px-3 py-1 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'tracks'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Músicas ({displayTracks.length})
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-3 py-1 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'playlists'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Playlists ({playlists.length})
          </button>
        </div>

        <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono">
          <Wifi className="w-3 h-3" /> Offline PWA
        </span>
      </div>

      {/* Conteúdo Principal com Scroll */}
      <main
        className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2 overscroll-contain"
        style={{ paddingBottom: currentTrack ? '145px' : '20px' }}
      >
        {activeTab === 'tracks' ? (
          /* TAB 1: LISTAGEM DE MÚSICAS */
          <>
            {/* Bloco de Músicas Pendentes no Mobile */}
            {pendingTracks.length > 0 && (
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Downloads Pendentes ({pendingTracks.length})
                </span>
                {pendingTracks.map((pt) => {
                  const isRetrying = downloadingIds.has(pt.id);
                  return (
                    <div
                      key={pt.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-amber-500/20"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{pt.title}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{pt.artist}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => retryPendingDownload(pt)}
                          disabled={isRetrying}
                          className="px-2 py-1 rounded-md bg-amber-500 text-black font-bold text-[10px] flex items-center gap-1 active:scale-95"
                        >
                          <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                          <span>{isRetrying ? 'Baixando...' : 'Reiniciar'}</span>
                        </button>
                        <button
                          onClick={() => discardPendingDownload(pt.id)}
                          className="p-1 text-zinc-400 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {displayTracks.length === 0 ? (
            <div className="my-auto py-12 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-900/20">
              <Music className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-300">
                Nenhuma música no catálogo ainda
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Baixe músicas no app do seu PC (localhost:3000) e toque em Sync no topo.
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
                  className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
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
                      <span className="truncate max-w-[130px]">{track.artist}</span>
                      <span>•</span>
                      <span className="font-mono">{track.durationFormatted}</span>
                    </div>
                  </div>

                  {/* Ação: Salvar em Playlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalTrack(track);
                    }}
                    title="Adicionar à playlist"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-300 hover:bg-white/10 transition-colors"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>

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
          </>
        ) : selectedPlaylist ? (
          /* TAB 2 - DETALHES DA PLAYLIST SELECIONADA NO MOBILE */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <button
                onClick={() => setSelectedPlaylistId(null)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              {selectedTracks.length > 0 && (
                <button
                  onClick={() => playTrack(selectedTracks[0], selectedTracks)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold text-xs shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Tocar Tudo ({selectedTracks.length})
                </button>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{selectedPlaylist.name}</h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {selectedTracks.length} faixas salvas
              </p>
            </div>

            {selectedTracks.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-xl p-4 bg-zinc-900/20">
                <Music className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Nenhuma faixa nesta lista.</p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Toque no ícone ➕ ao lado de qualquer música para colocá-la aqui.
                </p>
              </div>
            ) : (
              selectedTracks.map((track) => {
                const isPlaying = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, selectedTracks)}
                    className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-sky-950/60 border-sky-400/80'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                      <Image
                        src={track.thumbnailUrl}
                        alt={track.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <h5 className="text-xs font-semibold text-white truncate">
                        {track.title}
                      </h5>
                      <span className="text-[10px] text-zinc-400 truncate block">
                        {track.artist} • {track.durationFormatted}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrackFromPlaylist(selectedPlaylist.id, track.id);
                      }}
                      title="Remover da lista"
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* TAB 2 - LISTA DE PLAYLISTS */
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">MINHAS LISTAS</span>
              <button
                onClick={() => setIsCreatingPl(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova
              </button>
            </div>

            {isCreatingPl && (
              <form
                onSubmit={handleCreatePlaylist}
                className="p-2.5 rounded-xl bg-zinc-900 border border-sky-500/40 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Nome da playlist..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-black border border-zinc-700 rounded-lg text-white outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-sky-500 text-black font-bold text-xs rounded-lg"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPl(false)}
                  className="px-2 py-1 text-zinc-400 text-xs"
                >
                  Cancelar
                </button>
              </form>
            )}

            {playlists.map((pl) => {
              const plTracks = pl.trackIds
                .map((id) => allTracksMap.get(id))
                .filter(Boolean) as Track[];

              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                      <ListMusic className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-white truncate">
                        {pl.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {pl.trackIds.length} músicas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {plTracks.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack(plTracks[0], plTracks);
                        }}
                        className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
                        title="Tocar Playlist"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir playlist "${pl.name}"?`)) {
                          deletePlaylist(pl.id);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal para Adicionar Música a Qualquer Playlist */}
      {modalTrack && (
        <AddToPlaylistModal
          track={modalTrack}
          isOpen={!!modalTrack}
          onClose={() => setModalTrack(null)}
        />
      )}

      {/* Player Retrô Fixo e Permanente no Rodapé */}
      <MainPlayerBar />
    </div>
  );
};
