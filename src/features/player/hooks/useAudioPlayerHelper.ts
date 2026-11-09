import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaybackState, RepeatMode, Track, AudioSourceType } from '@/shared/types';
import { getTrackBlobUrl, saveTrackOffline, isTrackDownloaded } from '@/features/library/services/indexedDbStorageService';

export const useAudioPlayerHelper = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.OFF);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = 0.8;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleWaiting = () => setPlaybackState(PlaybackState.LOADING);
    const handlePlaying = () => setPlaybackState(PlaybackState.PLAYING);
    const handlePause = () => setPlaybackState(PlaybackState.PAUSED);
    const handleError = () => {
      console.error('Erro de áudio:', audio.error);
      setPlaybackState(PlaybackState.ERROR);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const initVisualizerNode = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch (err) {
      console.warn('Web Audio Context:', err);
    }
  }, []);

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex((t) => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }

    setCurrentTrack(track);
    setPlaybackState(PlaybackState.LOADING);
    setCurrentTime(0);

    try {
      let audioSrc = '';
      const alreadyOffline = await isTrackDownloaded(track.id);

      if (alreadyOffline || track.sourceType === AudioSourceType.OFFLINE_STORAGE || track.sourceType === AudioSourceType.LOCAL_DEVICE_FILE) {
        const blobUrl = await getTrackBlobUrl(track.id);
        if (blobUrl) {
          audioSrc = blobUrl;
        }
      }

      // Se ainda não estiver em cache local, buscar pela URL do stream/túnel
      if (!audioSrc) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('mptreco_admin_token') : null;
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
        audioSrc = `/api/stream?id=${track.id}${tokenParam}`;
      }

      audio.src = audioSrc;
      audio.crossOrigin = 'anonymous';
      await audio.play();
      setPlaybackState(PlaybackState.PLAYING);

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: 'mptreco',
          artwork: [
            { src: track.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
          ],
        });
      }
    } catch (error) {
      console.error('Erro ao iniciar faixa:', error);
      setPlaybackState(PlaybackState.ERROR);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playbackState === PlaybackState.PLAYING) {
      audio.pause();
    } else if (playbackState === PlaybackState.PAUSED) {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      await audio.play();
    } else if (currentTrack) {
      await playTrack(currentTrack);
    }
  }, [playbackState, currentTrack, playTrack]);

  const playNext = useCallback(() => {
    if (queue.length === 0 || currentIndex === -1) return;

    if (repeatMode === RepeatMode.ONE && currentTrack) {
      playTrack(currentTrack);
      return;
    }

    let nextIndex = currentIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === RepeatMode.ALL) {
        nextIndex = 0;
      } else {
        return;
      }
    }

    setCurrentIndex(nextIndex);
    playTrack(queue[nextIndex]);
  }, [queue, currentIndex, repeatMode, isShuffle, currentTrack, playTrack]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0 || currentIndex === -1) return;
    
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    setCurrentIndex(prevIndex);
    playTrack(queue[prevIndex]);
  }, [queue, currentIndex, playTrack]);

  const seek = useCallback((timeSeconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSeconds;
      setCurrentTime(timeSeconds);
    }
  }, []);

  const changeVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.8;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      playNext();
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playNext]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });
  }, [togglePlayPause, playNext, playPrevious, seek]);

  return {
    currentTrack,
    queue,
    currentIndex,
    playbackState,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    analyserNode: analyserRef.current,
    playTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    changeVolume,
    toggleMute,
    setRepeatMode,
    setIsShuffle,
    setQueue,
  };
};
