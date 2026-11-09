import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.MPTRECO_ADMIN_TOKEN || 'a8ead6af9a2e9d762a087839b245b246ef2da951889a9912';
const GIST_URL = 'https://gist.githubusercontent.com/du-vrgs/32466da6692cf6e85f1ae35fc410189d/raw/current_tunnel_url.txt';

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');
    const token = searchParams.get('token');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID obrigatório' }, { status: 400 });
    }

    // 1. Se o token do admin foi enviado, buscar o áudio através da ponte local automática do PC
    if (token === ADMIN_TOKEN) {
      try {
        const gistRes = await fetch(`${GIST_URL}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (gistRes.ok) {
          const rawTunnelUrl = (await gistRes.text()).trim();
          if (rawTunnelUrl.startsWith('https://')) {
            const bridgeRes = await fetch(
              `${rawTunnelUrl}/stream?id=${videoId}&token=${ADMIN_TOKEN}`,
              { cache: 'no-store' }
            );

            if (bridgeRes.ok) {
              const data = await bridgeRes.json();
              if (data.streamUrl) {
                return NextResponse.json({
                  streamUrl: data.streamUrl,
                  container: data.container || 'webm',
                  source: 'local_engine_tunnel',
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao conectar com ponte local via túnel:', err);
      }
    }

    // 2. Fallbacks públicos (caso o PC esteja offline ou sem token)
    const fallbackInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.privacy.com.de',
      'https://inv.nadeko.net',
    ];

    for (const inst of fallbackInstances) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
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
      { error: 'Não foi possível extrair o áudio. Verifique se o daemon local está ativo ou tente novamente.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[API /api/stream] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no stream' }, { status: 500 });
  }
};
