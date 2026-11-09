'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLibraryHelper } from '../hooks/useLibraryHelper';
import { Track } from '@/shared/types';

interface LibraryContextData {
  offlineTracks: Track[];
  pcTracks: Track[];
  pendingTracks: Track[];
  isLoading: boolean;
  isSyncing: boolean;
  downloadingIds: Set<string>;
  downloadedSet: Set<string>;
  syncWithPc: () => Promise<void>;
  downloadToPcAndSave: (track: Track) => Promise<boolean>;
  retryPendingDownload: (track: Track) => Promise<void>;
  discardPendingDownload: (trackId: string) => void;
  removeTrack: (trackId: string) => Promise<void>;
  importLocalFiles: (files: FileList) => Promise<void>;
  exportLibraryToDisk: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  getTrackBlobUrl: (trackId: string) => Promise<string | null>;
}

const LibraryContext = createContext<LibraryContextData | null>(null);

interface LibraryProviderProps {
  children: ReactNode;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({ children }) => {
  const library = useLibraryHelper();

  return (
    <LibraryContext.Provider value={library}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextData => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary deve ser utilizado dentro de um LibraryProvider');
  }
  return context;
};
