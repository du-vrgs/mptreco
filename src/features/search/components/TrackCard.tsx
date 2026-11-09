'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Download, Check, Loader2, Plus } from 'lucide-react';
import { Track } from '@/shared/types';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { useLibrary } from '@/features/library/context/LibraryContext';
import { usePlaylists } from '@/features/playlists/context/PlaylistContext';

interface TrackCardProps {
  track: Track;
  allTracksInList?: Track[];
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, allTracksInList = [] }) => {
  const { currentTrack, playTrack } = usePlayer();
  const { downloadToPcAndSave, downloadingIds, downloadedSet } = useLibrary();
  const { playlists, addTrackToPlaylist } = usePlaylists();

  const isCurrent = currentTrack?.id === track.id;
  const isDownloading = downloadingIds.has(track.id);
  const isDownloaded = downloadedSet.has(track.id);

  const handlePlay = () => {
    const list = allTracksInList.length > 0 ? allTracksInList : [track];
    playTrack(track, list);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    await downloadToPcAndSave(track);
  };

  return (
    <div
      onClick={handlePlay}
      className={`group relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
        isCurrent
          ? 'bg-sky-950/60 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
          : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Thumbnail com Overlay de Play */}
      <div className="relative w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-950">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
      </div>

      {/* Detalhes da Música */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-sky-300 font-semibold' : 'text-zinc-100'}`}>
          {track.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
          <span className="truncate max-w-[140px] md:max-w-[200px]">{track.artist}</span>
          <span>•</span>
          <span className="font-mono">{track.durationFormatted}</span>
        </div>
      </div>

      {/* Ações (Download Offline & Playlist) */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Adicionar à primeira playlist / favoritas */}
        {playlists.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addTrackToPlaylist(playlists[0].id, track.id);
            }}
            title={`Adicionar a ${playlists[0].name}`}
            className="p-2 rounded-lg text-zinc-400 hover:text-sky-300 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Botão Baixar Offline */}
        <button
          onClick={handleDownload}
          disabled={isDownloading || isDownloaded}
          title={isDownloaded ? 'Salvo no dispositivo' : 'Baixar para ouvir offline'}
          className={`p-2 rounded-lg transition-all ${
            isDownloaded
              ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/30'
              : isDownloading
              ? 'text-sky-400 bg-sky-950/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          ) : isDownloaded ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
