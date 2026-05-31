import { NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import type { Orcamento, ConfiguracaoEmpresa } from '@/types';
import { getDefaultConfig } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orcamento: Orcamento = body.orcamento;
    const config: ConfiguracaoEmpresa = body.config ?? getDefaultConfig();

    if (!orcamento?.numero || !orcamento?.cliente) {
      return NextResponse.json({ error: 'Dados do orçamento inválidos' }, { status: 400 });
    }

    const pdfBytes = await generatePDF(orcamento, config);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orcamento-${orcamento.numero}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API /pdf POST]', msg);
    return NextResponse.json({ error: 'Erro ao gerar PDF', detail: msg }, { status: 500 });
  }
}
