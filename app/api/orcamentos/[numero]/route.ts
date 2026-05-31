import { NextResponse } from 'next/server';
import { updateOrcamentoStatus } from '@/lib/google-sheets';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 });
    }

    const found = await updateOrcamentoStatus(numero, status);

    if (!found) {
      return NextResponse.json({ error: `Orçamento ${numero} não encontrado` }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /orcamentos/[numero] PATCH]', msg);
    return NextResponse.json({ error: 'Erro ao atualizar status', detail: msg }, { status: 500 });
  }
}
