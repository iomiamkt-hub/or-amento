import { NextResponse } from 'next/server';
import { getClientes, saveCliente } from '@/lib/google-sheets';
import { z } from 'zod';

const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  telefone: z.string().min(8, 'Telefone obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
});

export async function GET() {
  try {
    const clientes = await getClientes();
    return NextResponse.json(clientes);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /clientes GET]', msg);
    return NextResponse.json({ error: 'Erro ao buscar clientes', detail: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = clienteSchema.parse(body);
    const id = await saveCliente(data);
    return NextResponse.json({ id, ...data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', detail: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /clientes POST]', msg);
    return NextResponse.json({ error: 'Erro ao salvar cliente', detail: msg }, { status: 500 });
  }
}
