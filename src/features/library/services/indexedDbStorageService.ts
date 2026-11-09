import { get, set, del, keys } from 'idb-keyval';
import { AudioSourceType, Track } from '@/shared/types';

const TRACK_PREFIX = 'mptreco_track_';
const BLOB_PREFIX = 'mptreco_blob_';

export const saveTrackOffline = async (track: Track, audioBlob: Blob): Promise<void> => {
  const offlineTrack: Track = {
    ...track,
    sourceType: AudioSourceType.OFFLINE_STORAGE,
    createdAt: Date.now(),
  };

  await set(`${TRACK_PREFIX}${track.id}`, offlineTrack);
  await set(`${BLOB_PREFIX}${track.id}`, audioBlob);
};

export const getOfflineTracks = async (): Promise<Track[]> => {
  const allKeys = await keys();
  const trackKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(TRACK_PREFIX));
  
  const tracks: Track[] = [];
  for (const key of trackKeys) {
    const track = await get<Track>(key);
    if (track) {
      tracks.push(track);
    }
  }

  return tracks.sort((a, b) => b.createdAt - a.createdAt);
};

export const getTrackBlobUrl = async (trackId: string): Promise<string | null> => {
  const blob = await get<Blob>(`${BLOB_PREFIX}${trackId}`);
  if (!blob) return null;
  return URL.createObjectURL(blob);
};

export const deleteTrackOffline = async (trackId: string): Promise<void> => {
  await del(`${TRACK_PREFIX}${trackId}`);
  await del(`${BLOB_PREFIX}${trackId}`);
};

export const isTrackDownloaded = async (trackId: string): Promise<boolean> => {
  const track = await get<Track>(`${TRACK_PREFIX}${trackId}`);
  return !!track;
};
