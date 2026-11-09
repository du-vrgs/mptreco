import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.MPTRECO_ADMIN_TOKEN || 'a8ead6af9a2e9d762a087839b245b246ef2da951889a9912';
const GIST_URL = 'https://gist.githubusercontent.com/du-vrgs/32466da6692cf6e85f1ae35fc410189d/raw/current_tunnel_url.txt';

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token') || ADMIN_TOKEN;

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // 1. Tentar primeiro o daemon local direto na porta 7777 (quando rodando no PC)
    let targetUrl = 'http://127.0.0.1:7777';
    let isLocalUp = false;

    try {
      const localPing = await fetch('http://127.0.0.1:7777/health', { signal: AbortSignal.timeout(1000) });
      if (localPing.ok) {
        isLocalUp = true;
      }
    } catch {
      isLocalUp = false;
    }

    // Se o localhost:7777 não estiver respondendo direto, tenta pegar pelo túnel do Gist (quando acessado via celular/Vercel)
    if (!isLocalUp) {
      try {
        const gistRes = await fetch(`${GIST_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (gistRes.ok) {
          const tunnel = (await gistRes.text()).trim();
          if (tunnel.startsWith('https://')) {
            targetUrl = tunnel;
          }
        }
      } catch {
        // continua
      }
    }

    const res = await fetch(`${targetUrl}/file/${id}?token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /api/delete] Erro:', error);
    return NextResponse.json({ error: 'Falha ao deletar arquivo no PC' }, { status: 500 });
  }
};
