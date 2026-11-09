export enum PlaybackState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
}

export enum RepeatMode {
  OFF = 'OFF',
  ALL = 'ALL',
  ONE = 'ONE',
}

export enum AudioSourceType {
  YOUTUBE_STREAM = 'YOUTUBE_STREAM',
  OFFLINE_STORAGE = 'OFFLINE_STORAGE',
  LOCAL_DEVICE_FILE = 'LOCAL_DEVICE_FILE',
}

export interface Track {
  id: string; // YouTube videoId or local uuid
  title: string;
  artist: string;
  durationSeconds: number;
  durationFormatted: string;
  thumbnailUrl: string;
  sourceType: AudioSourceType;
  streamUrl?: string; // Direto ou blob URL
  localBlob?: Blob; // Quando armazenado no IndexedDB
  filename?: string;
  sizeBytes?: number;
  isOnPcDisk?: boolean;
  createdAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export enum ThemeSkin {
  WMP_CLASSIC_2000 = 'WMP_CLASSIC_2000', // Windows Media Player 9/11 (Corona Blue / Chrome)
  WINAMP_RETRO = 'WINAMP_RETRO',         // Winamp Classic Bento / Neon
  FRUTIGER_AERO = 'FRUTIGER_AERO',       // Glassmorphism aquoso Y2K
  MODERN_MINIMAL = 'MODERN_MINIMAL',     // Clean Dark Minimalist
}

export enum TabNavigation {
  SEARCH = 'SEARCH',
  LIBRARY = 'LIBRARY',
  PLAYLISTS = 'PLAYLISTS',
  VISUALIZER = 'VISUALIZER',
  SETTINGS = 'SETTINGS',
}
