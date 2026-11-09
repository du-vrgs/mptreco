'use client';

import React, { useState } from 'react';
import { ListMusic, Check, Plus, X, Save } from 'lucide-react';
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

  // Armazena as seleções locais antes de clicar em "Salvar"
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const pl of playlists) {
      if (pl.trackIds.includes(track.id)) {
        initial.add(pl.id);
      }
    }
    return initial;
  });

  const [hasChanges, setHasChanges] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleSelection = (playlistId: string) => {
    setSelectedPlaylistIds((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    for (const pl of playlists) {
      const shouldBeIn = selectedPlaylistIds.has(pl.id);
      const isCurrentlyIn = pl.trackIds.includes(track.id);

      if (shouldBeIn && !isCurrentlyIn) {
        addTrackToPlaylist(pl.id, track.id);
      } else if (!shouldBeIn && isCurrentlyIn) {
        removeTrackFromPlaylist(pl.id, track.id);
      }
    }
    onClose();
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = createPlaylist(newPlaylistName.trim());
    setSelectedPlaylistIds((prev) => new Set(prev).add(pl.id));
    setNewPlaylistName('');
    setIsCreating(false);
    setHasChanges(true);
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
            const isSelected = selectedPlaylistIds.has(pl.id);

            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => toggleSelection(pl.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 shadow-sm'
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
                    isSelected
                      ? 'bg-sky-500 border-sky-400 text-black'
                      : 'border-zinc-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-sky-300 transition-colors border border-dashed border-sky-500/30"
          >
            <Plus className="w-4 h-4" />
            Nova Playlist
          </button>
        )}

        {/* Botão de Salvar Alterações */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
