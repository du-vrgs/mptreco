import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

// Mock do yt-search
vi.mock('yt-search', () => {
  return {
    default: vi.fn(async (query: string) => {
      if (query === 'empty') {
        return { videos: [] };
      }
      return {
        videos: [
          {
            videoId: 'mock_123',
            title: 'Mock Music Track',
            author: { name: 'Mock Artist' },
            seconds: 240,
            timestamp: '04:00',
            thumbnail: 'https://mock.thumbnail.url/image.jpg',
          },
        ],
      };
    }),
  };
});

describe('API /api/search', () => {
  it('deve retornar lista vazia quando a query não for fornecida', async () => {
    const req = new Request('http://localhost:3000/api/search');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tracks).toEqual([]);
  });

  it('deve formatar corretamente as faixas encontradas', async () => {
    const req = new Request('http://localhost:3000/api/search?q=rock');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tracks).toHaveLength(1);
    expect(data.tracks[0]).toMatchObject({
      id: 'mock_123',
      title: 'Mock Music Track',
      artist: 'Mock Artist',
      durationSeconds: 240,
      durationFormatted: '04:00',
      sourceType: 'YOUTUBE_STREAM',
    });
  });
});
