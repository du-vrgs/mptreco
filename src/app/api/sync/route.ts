import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.MPTRECO_ADMIN_TOKEN || 'a8ead6af9a2e9d762a087839b245b246ef2da951889a9912';
const GIST_URL = 'https://gist.githubusercontent.com/du-vrgs/32466da6692cf6e85f1ae35fc410189d/raw/current_tunnel_url.txt';

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const gistRes = await fetch(`${GIST_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!gistRes.ok) {
      return NextResponse.json({ tracks: [] });
    }

    const rawTunnelUrl = (await gistRes.text()).trim();
    if (!rawTunnelUrl.startsWith('https://')) {
      return NextResponse.json({ tracks: [] });
    }

    const listRes = await fetch(`${rawTunnelUrl}/list?token=${ADMIN_TOKEN}`, {
      cache: 'no-store',
    });

    if (!listRes.ok) {
      return NextResponse.json({ tracks: [] });
    }

    const data = await listRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /api/sync] Erro:', error);
    return NextResponse.json({ tracks: [] });
  }
};
