import { NextResponse } from 'next/server';
import { getAcessorios } from '@/lib/google-sheets';

export async function GET() {
  try {
    const acessorios = await getAcessorios();
    return NextResponse.json(acessorios);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /sheets/acessorios GET]', msg);
    return NextResponse.json({ error: 'Erro ao buscar acessórios', detail: msg }, { status: 500 });
  }
}
