import { NextResponse } from 'next/server';
import { AudioSourceType, Track } from '@/shared/types';

interface YouTubeRun {
  text: string;
}

interface YouTubeThumbnail {
  url: string;
}

interface YouTubeVideoRenderer {
  videoId: string;
  title?: {
    runs?: YouTubeRun[];
    simpleText?: string;
  };
  ownerText?: {
    runs?: YouTubeRun[];
  };
  lengthText?: {
    simpleText?: string;
  };
  thumbnail?: {
    thumbnails?: YouTubeThumbnail[];
  };
}

interface YouTubeItemSectionItem {
  videoRenderer?: YouTubeVideoRenderer;
}

const parseSeconds = (timestamp?: string): number => {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    // 1. Busca nativa no YouTube via fetch com parsing de ytInitialData (zero dependências CJS como cheerio/yt-search)
    const ytRes = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      }
    );

    if (!ytRes.ok) {
      throw new Error(`YouTube HTTP ${ytRes.status}`);
    }

    const html = await ytRes.text();
    const match = html.match(/ytInitialData[ ]*=[ ]*({[\s\S]+?});\s*<\/script>/);

    if (!match) {
      // Fallback: Invidious search pública
      const invidiousRes = await fetch(
        `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query.trim())}&type=video`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (invidiousRes.ok) {
        const invData = await invidiousRes.json();
        const tracks: Track[] = (invData || []).slice(0, 20).map((v: {
          videoId: string;
          title: string;
          author: string;
          lengthSeconds: number;
          videoThumbnails?: { url: string }[];
        }) => ({
          id: v.videoId,
          title: v.title,
          artist: v.author || 'Artista Desconhecido',
          durationSeconds: v.lengthSeconds || 0,
          durationFormatted: `${Math.floor((v.lengthSeconds || 0) / 60)}:${((v.lengthSeconds || 0) % 60).toString().padStart(2, '0')}`,
          thumbnailUrl:
            v.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          sourceType: AudioSourceType.YOUTUBE_STREAM,
          createdAt: Date.now(),
        }));
        return NextResponse.json({ tracks });
      }

      return NextResponse.json({ tracks: [] });
    }

    const data = JSON.parse(match[1]);
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const tracks: Track[] = [];

    for (const section of sections) {
      const items: YouTubeItemSectionItem[] = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (!item.videoRenderer) continue;
        const v = item.videoRenderer;
        const title = v.title?.runs?.[0]?.text || v.title?.simpleText || 'Sem título';
        const artist = v.ownerText?.runs?.[0]?.text || 'Artista Desconhecido';
        const durationFormatted = v.lengthText?.simpleText || '--:--';
        const durationSeconds = parseSeconds(durationFormatted);
        const thumbs = v.thumbnail?.thumbnails || [];
        const thumbnailUrl =
          thumbs.length > 0
            ? thumbs[thumbs.length - 1].url
            : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

        tracks.push({
          id: v.videoId,
          title,
          artist,
          durationSeconds,
          durationFormatted,
          thumbnailUrl,
          sourceType: AudioSourceType.YOUTUBE_STREAM,
          createdAt: Date.now(),
        });

        if (tracks.length >= 20) break;
      }
      if (tracks.length >= 20) break;
    }

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('[API /api/search] Erro ao buscar vídeos:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar no YouTube' },
      { status: 500 }
    );
  }
};
