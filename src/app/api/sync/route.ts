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
      return NextResponse.json({ tracks: [], playlists: [] });
    }

    const rawTunnelUrl = (await gistRes.text()).trim();
    if (!rawTunnelUrl.startsWith('https://')) {
      return NextResponse.json({ tracks: [], playlists: [] });
    }

    const listRes = await fetch(`${rawTunnelUrl}/list?token=${ADMIN_TOKEN}`, {
      cache: 'no-store',
    });

    if (!listRes.ok) {
      return NextResponse.json({ tracks: [], playlists: [] });
    }

    const data = await listRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /api/sync GET] Erro:', error);
    return NextResponse.json({ tracks: [], playlists: [] });
  }
};

export const POST = async (request: Request) => {
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
      return NextResponse.json({ error: 'Gist inacessível' }, { status: 500 });
    }

    const rawTunnelUrl = (await gistRes.text()).trim();
    if (!rawTunnelUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'Túnel offline' }, { status: 503 });
    }

    const body = await request.json();

    const saveRes = await fetch(`${rawTunnelUrl}/playlists?token=${ADMIN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!saveRes.ok) {
      return NextResponse.json({ error: 'Falha ao salvar playlists no PC' }, { status: 500 });
    }

    const data = await saveRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /api/sync POST] Erro:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar' }, { status: 500 });
  }
};
