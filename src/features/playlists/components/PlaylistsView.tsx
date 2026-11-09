'use client';

import React, { useState } from 'react';
import { ListMusic, Plus, Trash2, Play } from 'lucide-react';
import { usePlaylists } from '../context/PlaylistContext';
import { useLibrary } from '@/features/library/context/LibraryContext';
import { usePlayer } from '@/features/player/context/PlayerContext';

export const PlaylistsView: React.FC = () => {
  const { playlists, createPlaylist, deletePlaylist } = usePlaylists();
  const { offlineTracks } = useLibrary();
  const { playTrack } = usePlayer();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-indigo-400" />
            Minhas Playlists
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Organize suas músicas online e offline em listas nomeadas.
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
          // Localizar faixas da playlist que estão na biblioteca offline
          const plTracks = offlineTracks.filter((t) => pl.trackIds.includes(t.id));

          return (
            <div
              key={pl.id}
              className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-base truncate">
                    {pl.name}
                  </h3>
                  <button
                    onClick={() => {
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
                <span className="text-[11px] font-mono text-zinc-500">
                  Criada em {new Date(pl.createdAt).toLocaleDateString()}
                </span>
                {plTracks.length > 0 && (
                  <button
                    onClick={() => playTrack(plTracks[0], plTracks)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Tocar Playlist
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
