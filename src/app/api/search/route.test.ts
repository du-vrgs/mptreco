import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

describe('API /api/search', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar lista vazia quando a query não for fornecida', async () => {
    const req = new Request('http://localhost:3000/api/search');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tracks).toEqual([]);
  });

  it('deve realizar busca no YouTube e extrair faixas com parsing nativo', async () => {
    const mockHtml = `
      <html>
        <script>
          var ytInitialData = {
            "contents": {
              "twoColumnSearchResultsRenderer": {
                "primaryContents": {
                  "sectionListRenderer": {
                    "contents": [
                      {
                        "itemSectionRenderer": {
                          "contents": [
                            {
                              "videoRenderer": {
                                "videoId": "abc_123",
                                "title": { "runs": [{ "text": "Get Lucky" }] },
                                "ownerText": { "runs": [{ "text": "Daft Punk" }] },
                                "lengthText": { "simpleText": "04:08" },
                                "thumbnail": {
                                  "thumbnails": [{ "url": "https://img.youtube.com/vi/abc_123/hqdefault.jpg" }]
                                }
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          };
        </script>
      </html>
    `;

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      return new Response(mockHtml, { status: 200 });
    });

    const req = new Request('http://localhost:3000/api/search?q=daft+punk');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tracks).toHaveLength(1);
    expect(data.tracks[0]).toMatchObject({
      id: 'abc_123',
      title: 'Get Lucky',
      artist: 'Daft Punk',
      durationSeconds: 248,
      durationFormatted: '04:08',
      sourceType: 'YOUTUBE_STREAM',
    });
  });
});
