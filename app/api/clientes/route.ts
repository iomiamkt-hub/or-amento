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
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
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
      return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
    }
    console.error('Erro ao salvar cliente:', error);
    return NextResponse.json({ error: 'Erro ao salvar cliente' }, { status: 500 });
  }
}
