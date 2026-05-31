import { NextResponse } from 'next/server';
import { ensureSheetTabs } from '@/lib/google-sheets';

export async function POST() {
  try {
    const result = await ensureSheetTabs();
    return NextResponse.json({
      success: true,
      message: result.created.length > 0
        ? `Abas criadas: ${result.created.join(', ')}`
        : 'Todas as abas já existem.',
      created: result.created,
      existing: result.existing,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /sheets/init POST]', msg);
    return NextResponse.json({ error: 'Erro ao inicializar planilha', detail: msg }, { status: 500 });
  }
}
