import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.MPTRECO_ADMIN_TOKEN || 'a8ead6af9a2e9d762a087839b245b246ef2da951889a9912';
const GIST_URL = 'https://gist.githubusercontent.com/du-vrgs/32466da6692cf6e85f1ae35fc410189d/raw/current_tunnel_url.txt';

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID obrigatório' }, { status: 400 });
    }

    // 1. Tentar primeiro o daemon local se o app estiver rodando localmente no PC
    try {
      const localCheck = await fetch(`http://127.0.0.1:7777/file/${videoId}.mp3?token=${ADMIN_TOKEN}`, {
        method: 'HEAD',
      });
      if (localCheck.ok) {
        return NextResponse.redirect(`http://127.0.0.1:7777/file/${videoId}.mp3?token=${ADMIN_TOKEN}`, {
          status: 307,
        });
      }
    } catch {
      // Ignora e continua para o túnel
    }

    // 2. Se for pelo túnel (celular ou Vercel)
    const gistRes = await fetch(`${GIST_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (gistRes.ok) {
      const rawTunnelUrl = (await gistRes.text()).trim();
      if (rawTunnelUrl.startsWith('https://')) {
        const fileUrl = `${rawTunnelUrl}/file/${videoId}.mp3?token=${ADMIN_TOKEN}`;
        return NextResponse.redirect(fileUrl, {
          status: 307,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Túnel local offline' }, { status: 503 });
  } catch (error) {
    console.error('[API /api/stream] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no stream' }, { status: 500 });
  }
};
