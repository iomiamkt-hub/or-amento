import { NextResponse } from 'next/server';
import { ensureSheetTabs } from '@/lib/google-sheets';

export async function POST() {
  try {
    await ensureSheetTabs();
    return NextResponse.json({ success: true, message: 'Abas criadas/verificadas com sucesso' });
  } catch (error) {
    console.error('Erro ao inicializar planilha:', error);
    return NextResponse.json({ error: 'Erro ao inicializar planilha' }, { status: 500 });
  }
}
