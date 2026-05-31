import { NextResponse } from 'next/server';
import { getAcessorios } from '@/lib/google-sheets';

export async function GET() {
  try {
    const acessorios = await getAcessorios();
    return NextResponse.json(acessorios);
  } catch (error) {
    console.error('Erro ao buscar acessórios:', error);
    return NextResponse.json({ error: 'Erro ao buscar acessórios' }, { status: 500 });
  }
}
