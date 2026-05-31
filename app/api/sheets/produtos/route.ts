import { NextResponse } from 'next/server';
import { getProdutos } from '@/lib/google-sheets';

export async function GET() {
  try {
    const produtos = await getProdutos();
    return NextResponse.json(produtos);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /sheets/produtos GET]', msg);
    return NextResponse.json({ error: 'Erro ao buscar produtos', detail: msg }, { status: 500 });
  }
}
