import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.MPTRECO_ADMIN_TOKEN || 'a8ead6af9a2e9d762a087839b245b246ef2da951889a9912';
const GIST_URL = 'https://gist.githubusercontent.com/du-vrgs/32466da6692cf6e85f1ae35fc410189d/raw/current_tunnel_url.txt';

export const POST = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const title = searchParams.get('title') || '';
    const artist = searchParams.get('artist') || '';
    const durationFormatted = searchParams.get('durationFormatted') || '--:--';
    const durationSeconds = searchParams.get('durationSeconds') || '0';
    const thumbnailUrl = searchParams.get('thumbnailUrl') || '';
    const token = searchParams.get('token') || ADMIN_TOKEN;

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    // 1. Tentar acionar o daemon local via túnel ou direto no localhost:7777
    let targetUrl = 'http://127.0.0.1:7777';
    try {
      const gistRes = await fetch(`${GIST_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (gistRes.ok) {
        const tunnel = (await gistRes.text()).trim();
        if (tunnel.startsWith('https://')) {
          targetUrl = tunnel;
        }
      }
    } catch {
      // continua com localhost
    }

    const downloadParams = new URLSearchParams({
      id,
      title,
      artist,
      durationFormatted,
      durationSeconds,
      thumbnailUrl,
      token,
    });

    const res = await fetch(`${targetUrl}/download?${downloadParams.toString()}`, {
      method: 'POST',
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /api/download] Erro:', error);
    return NextResponse.json({ error: 'Falha ao baixar no PC' }, { status: 500 });
  }
};
