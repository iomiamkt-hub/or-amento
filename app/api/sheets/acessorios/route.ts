import { NextResponse } from 'next/server';

// Acessórios agora são uma categoria dentro da aba PRODUTOS.
// Este endpoint retorna os produtos da categoria "Acessorio" para
// compatibilidade com código existente.
import { getProdutos } from '@/lib/google-sheets';

export const revalidate = 60;

export async function GET() {
  try {
    const todos = await getProdutos();
    const acessorios = todos
      .filter((p) => p.categoria === 'Acessorio')
      .map((p) => ({ id: p.id, nome: p.produto, valor: p.valorUnitario }));
    const res = NextResponse.json(acessorios);
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /sheets/acessorios GET]', msg);
    return NextResponse.json({ error: 'Erro ao buscar acessórios', detail: msg }, { status: 500 });
  }
}
