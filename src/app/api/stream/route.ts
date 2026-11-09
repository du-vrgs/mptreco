import { NextResponse } from 'next/server';

// Instâncias de Invidious / Piped públicas e seguras como proxies de fallback
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
  'https://yt.artemislena.eu',
];

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID obrigatório' }, { status: 400 });
    }

    // Tentar obter stream de áudio através das APIs públicas do ecossistema Invidious
    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(`${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats,formatStreams`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          // Procurar formatos de áudio apenas (audio/mp4, audio/webm, m4a, opus)
          const audioFormats = (data.adaptiveFormats || []).filter((f: { type?: string }) =>
            f.type && f.type.startsWith('audio/')
          );

          if (audioFormats.length > 0) {
            // Selecionar o melhor bitrate de áudio
            audioFormats.sort((a: { bitrate?: number }, b: { bitrate?: number }) => (b.bitrate || 0) - (a.bitrate || 0));
            const bestAudio = audioFormats[0];

            return NextResponse.json({
              streamUrl: bestAudio.url,
              container: bestAudio.container || 'mp4',
              bitrate: bestAudio.bitrate,
            });
          }
        }
      } catch {
        // Tenta próxima instância silenciosamente
        continue;
      }
    }

    // Fallback: Cobalt API pública ou Stream Proxy alternativo
    const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        downloadMode: 'audio',
        audioFormat: 'mp3',
      }),
    });

    if (cobaltResponse.ok) {
      const cobaltData = await cobaltResponse.json();
      if (cobaltData.url) {
        return NextResponse.json({
          streamUrl: cobaltData.url,
          container: 'mp3',
        });
      }
    }

    return NextResponse.json(
      { error: 'Não foi possível extrair stream de áudio no momento.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[API /api/stream] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no stream' }, { status: 500 });
  }
};
