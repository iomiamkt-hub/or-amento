import { NextResponse } from 'next/server';
import { updateOrcamentoStatus } from '@/lib/google-sheets';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const { status } = await request.json();
    await updateOrcamentoStatus(numero, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
