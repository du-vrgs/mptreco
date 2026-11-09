import { NextResponse } from 'next/server';
import ytSearch from 'yt-search';
import { AudioSourceType, Track } from '@/shared/types';

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    const searchResults = await ytSearch(query.trim());
    const videos = searchResults.videos.slice(0, 20);

    const tracks: Track[] = videos.map((video) => ({
      id: video.videoId,
      title: video.title,
      artist: video.author.name || 'Artista Desconhecido',
      durationSeconds: video.seconds,
      durationFormatted: video.timestamp,
      thumbnailUrl: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      sourceType: AudioSourceType.YOUTUBE_STREAM,
      createdAt: Date.now(),
    }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('[API /api/search] Erro ao buscar vídeos:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar no YouTube' },
      { status: 500 }
    );
  }
};
