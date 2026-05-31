import { NextResponse } from 'next/server';
import { getProdutos } from '@/lib/google-sheets';

export async function GET() {
  try {
    const produtos = await getProdutos();
    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}
