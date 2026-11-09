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

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Acesso restrito: Token de administrador necessário para streaming do túnel.' },
        { status: 401 }
      );
    }

    // 1. Obter a URL do túnel ativa a partir do Gist
    const gistRes = await fetch(`${GIST_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!gistRes.ok) {
      return NextResponse.json(
        { error: 'Túnel local não configurado ou inacessível.' },
        { status: 503 }
      );
    }

    const rawTunnelUrl = (await gistRes.text()).trim();
    if (!rawTunnelUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Túnel local offline. Inicie o túnel no PC.' },
        { status: 503 }
      );
    }

    // 2. Chamar o daemon local do PC que tem o yt-dlp sem bloqueio
    const bridgeRes = await fetch(
      `${rawTunnelUrl}/stream?id=${videoId}&token=${ADMIN_TOKEN}`,
      { cache: 'no-store' }
    );

    if (!bridgeRes.ok) {
      return NextResponse.json(
        { error: 'Erro ao gerar stream no daemon local do PC.' },
        { status: 502 }
      );
    }

    const bridgeData = await bridgeRes.json();
    const googleVideoUrl = bridgeData.streamUrl;

    if (!googleVideoUrl) {
      return NextResponse.json(
        { error: 'URL de áudio não gerada pelo daemon.' },
        { status: 502 }
      );
    }

    // 3. Fazer proxy do áudio diretamente com headers de CORS e Range para streaming e download perfeitos no celular
    const rangeHeader = request.headers.get('range');
    const audioHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (rangeHeader) {
      audioHeaders['Range'] = rangeHeader;
    }

    const audioRes = await fetch(googleVideoUrl, {
      headers: audioHeaders,
    });

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type');
    responseHeaders.set('Content-Type', audioRes.headers.get('content-type') || 'audio/webm');
    responseHeaders.set('Accept-Ranges', 'bytes');

    if (audioRes.headers.get('content-length')) {
      responseHeaders.set('Content-Length', audioRes.headers.get('content-length')!);
    }
    if (audioRes.headers.get('content-range')) {
      responseHeaders.set('Content-Range', audioRes.headers.get('content-range')!);
    }

    return new Response(audioRes.body, {
      status: audioRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API /api/stream] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no stream' }, { status: 500 });
  }
};
