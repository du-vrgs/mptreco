'use client';

import React, { useState } from 'react';
import { ListMusic, Check, Plus, X } from 'lucide-react';
import { usePlaylists } from '../context/PlaylistContext';
import { Track } from '@/shared/types';

interface AddToPlaylistModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  isOpen,
  onClose,
}) => {
  const { playlists, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist } = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = createPlaylist(newPlaylistName.trim());
    addTrackToPlaylist(pl.id, track.id);
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-sky-500/30 p-5 shadow-2xl flex flex-col gap-4 text-white"
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold">Salvar em Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-zinc-300 truncate bg-black/40 p-2.5 rounded-lg border border-white/5">
          <p className="font-semibold text-white truncate">{track.title}</p>
          <p className="text-zinc-400 truncate">{track.artist}</p>
        </div>

        {/* Lista de Playlists Existentes */}
        <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {playlists.map((pl) => {
            const isAdded = pl.trackIds.includes(track.id);

            return (
              <button
                key={pl.id}
                onClick={() => {
                  if (isAdded) {
                    removeTrackFromPlaylist(pl.id, track.id);
                  } else {
                    addTrackToPlaylist(pl.id, track.id);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all border ${
                  isAdded
                    ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                    : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="font-semibold truncate">{pl.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {pl.trackIds.length} músicas
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isAdded
                      ? 'bg-sky-500 border-sky-400 text-black'
                      : 'border-zinc-600'
                  }`}
                >
                  {isAdded && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Criar nova playlist inline */}
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="flex gap-2 pt-2 border-t border-white/10">
            <input
              type="text"
              placeholder="Nome da playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-black border border-sky-400/50 rounded-lg text-white outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-sky-500 text-black font-bold text-xs rounded-lg"
            >
              Criar
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-sky-300 transition-colors border border-dashed border-sky-500/30"
          >
            <Plus className="w-4 h-4" />
            Nova Playlist
          </button>
        )}
      </div>
    </div>
  );
};
