import { NextResponse } from 'next/server';
import { getOrcamentos, saveOrcamento } from '@/lib/google-sheets';
import type { Orcamento } from '@/types';

export async function GET() {
  try {
    const orcamentos = await getOrcamentos();
    return NextResponse.json(orcamentos);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const orcamento: Orcamento = await request.json();
    await saveOrcamento(orcamento);
    return NextResponse.json({ success: true, numero: orcamento.numero }, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    return NextResponse.json({ error: 'Erro ao salvar orçamento' }, { status: 500 });
  }
}
