import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID obrigatório' }, { status: 400 });
    }

    // 1. Tentar execução local via binário yt-dlp do projeto ou do sistema
    const venvYtDlp = path.resolve(process.cwd(), '.venv/bin/yt-dlp');
    const localBinary = fs.existsSync(venvYtDlp) ? venvYtDlp : 'yt-dlp';

    const getLocalStreamUrl = (): Promise<string | null> => {
      return new Promise((resolve) => {
        execFile(
          localBinary,
          ['-g', '-f', 'ba/b', `https://www.youtube.com/watch?v=${videoId}`],
          (error, stdout) => {
            if (error || !stdout) {
              resolve(null);
              return;
            }
            const urls = stdout.trim().split('\n').filter((l) => l.startsWith('http'));
            resolve(urls.length > 0 ? urls[0] : null);
          }
        );
      });
    };

    const directUrl = await getLocalStreamUrl();
    if (directUrl) {
      return NextResponse.json({
        streamUrl: directUrl,
        container: 'webm',
        source: 'local_ytdlp',
      });
    }

    // 2. Fallbacks de instâncias públicas caso yt-dlp não esteja disponível
    const fallbackInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.privacy.com.de',
      'https://invidious.nerdvpn.de',
      'https://inv.nadeko.net',
    ];

    for (const inst of fallbackInstances) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${inst}/streams/${videoId}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const audios = data.audioStreams || [];
          if (audios.length > 0) {
            return NextResponse.json({
              streamUrl: audios[0].url,
              container: audios[0].format || 'm4a',
              source: 'piped_fallback',
            });
          }
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json(
      { error: 'Não foi possível extrair o áudio no momento.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[API /api/stream] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no stream' }, { status: 500 });
  }
};
