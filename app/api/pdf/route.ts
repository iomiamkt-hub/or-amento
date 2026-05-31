import { NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import type { Orcamento, ConfiguracaoEmpresa } from '@/types';
import { getDefaultConfig } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { orcamento, config }: { orcamento: Orcamento; config?: ConfiguracaoEmpresa } =
      await request.json();

    const configuracao = config ?? getDefaultConfig();
    const pdfBytes = await generatePDF(orcamento, configuracao);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="orcamento-${orcamento.numero}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
  }
}
