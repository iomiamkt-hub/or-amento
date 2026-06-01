import { NextResponse } from 'next/server';
import { getProdutos } from '@/lib/google-sheets';

// Revalida a rota no servidor a cada 60 segundos (Next.js cache)
export const revalidate = 60;

export async function GET() {
  try {
    const produtos = await getProdutos();
    const res = NextResponse.json(produtos);
    // Cache HTTP de 60s para o cliente e CDN da Vercel
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /sheets/produtos GET]', msg);
    return NextResponse.json({ error: 'Erro ao buscar produtos', detail: msg }, { status: 500 });
  }
}
