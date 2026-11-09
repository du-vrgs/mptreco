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
        { error: 'Acesso restrito: Token de administrador necessário.' },
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
        { error: 'Túnel local offline.' },
        { status: 503 }
      );
    }

    // 2. Redirecionar o navegador para o endpoint de áudio do túnel com CORS e streaming total
    const audioStreamUrl = `${rawTunnelUrl}/audio?id=${videoId}&token=${ADMIN_TOKEN}`;

    return NextResponse.redirect(audioStreamUrl, {
      status: 307,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API /api/stream] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no stream' }, { status: 500 });
  }
};
