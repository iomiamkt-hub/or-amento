import { NextResponse } from 'next/server';
import { getOrcamentos, saveOrcamento } from '@/lib/google-sheets';
import type { Orcamento } from '@/types';

export async function GET() {
  try {
    const orcamentos = await getOrcamentos();
    return NextResponse.json(orcamentos);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /orcamentos GET]', msg);
    return NextResponse.json({ error: 'Erro ao buscar orçamentos', detail: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const orcamento: Orcamento = await request.json();

    if (!orcamento.numero || !orcamento.cliente?.nome) {
      return NextResponse.json({ error: 'Dados do orçamento incompletos' }, { status: 400 });
    }

    await saveOrcamento(orcamento);
    return NextResponse.json({ success: true, numero: orcamento.numero }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /orcamentos POST]', msg);
    return NextResponse.json({ error: 'Erro ao salvar orçamento', detail: msg }, { status: 500 });
  }
}
