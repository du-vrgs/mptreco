'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ListMusic, Plus, Trash2, Play, ChevronRight, ArrowLeft, Music, X } from 'lucide-react';
import { usePlaylists } from '../context/PlaylistContext';
import { useLibrary } from '@/features/library/context/LibraryContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { Track } from '@/shared/types';

export const PlaylistsView: React.FC = () => {
  const { playlists, createPlaylist, deletePlaylist, removeTrackFromPlaylist } = usePlaylists();
  const { offlineTracks, pcTracks } = useLibrary();
  const { playTrack, currentTrack } = usePlayer();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Mapa com todas as músicas disponíveis (offline + pc)
  const trackMap = new Map<string, Track>();
  for (const t of pcTracks) trackMap.set(t.id, t);
  for (const t of offlineTracks) trackMap.set(t.id, t);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const selectedTracks: Track[] = selectedPlaylist
    ? selectedPlaylist.trackIds.map((id) => trackMap.get(id)).filter(Boolean) as Track[]
    : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  // Visão Detalhada de uma Playlist Selecionada
  if (selectedPlaylist) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <button
            onClick={() => setSelectedPlaylistId(null)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Playlists
          </button>

          {selectedTracks.length > 0 && (
            <button
              onClick={() => playTrack(selectedTracks[0], selectedTracks)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Tocar Playlist ({selectedTracks.length})
            </button>
          )}
        </div>

        <div className="px-1">
          <h2 className="text-xl font-black text-white">{selectedPlaylist.name}</h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            {selectedTracks.length} faixas salvas
          </p>
        </div>

        {selectedTracks.length === 0 ? (
          <div className="py-14 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-900/20">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Nenhuma música nesta playlist ainda.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Adicione músicas através do botão ➕ nas faixas pesquisadas ou na sua biblioteca.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, selectedTracks)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-sky-950/60 border-sky-400/80'
                      : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800/80'
                  }`}
                >
                  <div className="relative w-12 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-950">
                    <Image src={track.thumbnailUrl} alt={track.title} fill unoptimized className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs md:text-sm font-medium truncate ${isCurrent ? 'text-sky-300 font-semibold' : 'text-zinc-100'}`}>
                      {track.title}
                    </h4>
                    <span className="text-[11px] text-zinc-400 truncate block">
                      {track.artist} • {track.durationFormatted}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrackFromPlaylist(selectedPlaylist.id, track.id);
                    }}
                    title="Remover da playlist"
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-indigo-400" />
            Minhas Playlists
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Organize suas músicas em listas nomeadas sincronizadas entre o PC e celular.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Playlist
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-4 rounded-xl bg-zinc-900/80 border border-indigo-500/40 flex gap-2">
          <input
            type="text"
            placeholder="Nome da playlist (ex: Treino 2000, Flashback, Foco)..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 px-3 py-2 bg-black border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-indigo-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-3 py-2 text-zinc-400 hover:text-white text-xs"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Lista de Playlists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {playlists.map((pl) => {
          const plTracks = pl.trackIds.map((id) => trackMap.get(id)).filter(Boolean) as Track[];

          return (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-base truncate group-hover:text-sky-300 transition-colors">
                    {pl.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Excluir a playlist "${pl.name}"?`)) {
                        deletePlaylist(pl.id);
                      }
                    }}
                    className="text-zinc-500 hover:text-red-400 p-1"
                    title="Excluir Playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {pl.trackIds.length} faixas adicionadas
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                  Ver faixas <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </span>
                {plTracks.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack(plTracks[0], plTracks);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Tocar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
