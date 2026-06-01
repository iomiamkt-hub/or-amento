import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Orcamento, ConfiguracaoEmpresa } from '@/types';
import { formatCurrency } from './utils';
import { celulaMedidaPDF } from './calc';

const COR_DEFAULT = { r: 0.06, g: 0.47, b: 0.81 };

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return COR_DEFAULT;
  return { r: parseInt(m[1], 16) / 255, g: parseInt(m[2], 16) / 255, b: parseInt(m[3], 16) / 255 };
}

/** Remove chars fora do WinAnsi (evita crash no pdf-lib com StandardFonts). */
function safe(text: string | undefined | null): string {
  if (!text) return '';
  return String(text).replace(/[^\x00-\xFF]/g, '?');
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const PAGE_W = 595;
const PAGE_H = 842;
const MX = 30; // margem horizontal

// Colunas da tabela de itens (x inicial de cada coluna)
// Componente | Seleção | Altura | Largura | Área/Qtde | Preço Unit. | Valor Total
const COL = {
  componente: MX + 5,   // ~70px
  selecao: 105,          // ~130px
  altura: 238,           // ~45px
  largura: 283,          // ~45px
  medida: 328,           // ~65px  (Área m² / Metros / Qtde)
  preco: 393,            // ~65px
  total: 480,            // até borda
};

export async function generatePDF(
  orcamento: Orcamento,
  config: ConfiguracaoEmpresa
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const c = hexToRgb(config.corPrimaria || '#0f77cf');
  const COR = rgb(c.r, c.g, c.b);
  const BRANCO = rgb(1, 1, 1);
  const PRETO = rgb(0, 0, 0);
  const CINZA_L = rgb(0.95, 0.95, 0.95);
  const CINZA_M = rgb(0.5, 0.5, 0.5);
  const CINZA_B = rgb(0.85, 0.85, 0.85);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  // ── Helpers de página ──────────────────────────────────────────────────────

  function cabecalho() {
    // Barra azul de cabeçalho
    page.drawRectangle({ x: 0, y: PAGE_H - 95, width: PAGE_W, height: 95, color: COR });

    page.drawText(safe(config.nomeEmpresa), {
      x: 40, y: PAGE_H - 38, size: 18, font: fontB, color: BRANCO, maxWidth: 270,
    });
    page.drawText(safe(`Tel: ${config.telefone}  |  WhatsApp: ${config.whatsapp}`), {
      x: 40, y: PAGE_H - 58, size: 9, font: fontR, color: BRANCO,
    });
    page.drawText(safe(config.email), {
      x: 40, y: PAGE_H - 72, size: 9, font: fontR, color: BRANCO,
    });

    // Bloco do número do orçamento
    page.drawText('ORCAMENTO', {
      x: PAGE_W - 180, y: PAGE_H - 33, size: 11, font: fontB, color: BRANCO,
    });
    page.drawText(safe(`N ${orcamento.numero}`), {
      x: PAGE_W - 180, y: PAGE_H - 50, size: 14, font: fontB, color: BRANCO,
    });
    page.drawText(safe(`Data: ${orcamento.data}`), {
      x: PAGE_W - 180, y: PAGE_H - 66, size: 9, font: fontR, color: BRANCO,
    });
    page.drawText(safe(`Validade: ${config.validadeOrcamento || 15} dias`), {
      x: PAGE_W - 180, y: PAGE_H - 80, size: 9, font: fontR, color: BRANCO,
    });
  }

  function rodape() {
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 50, color: COR });
    page.drawText(
      safe(config.rodapePDF || `Orcamento valido por ${config.validadeOrcamento || 15} dias.`),
      { x: 40, y: 30, size: 9, font: fontR, color: BRANCO, maxWidth: PAGE_W - 80 }
    );
    page.drawText(safe(`${config.email}  |  WhatsApp: ${config.whatsapp}`), {
      x: 40, y: 14, size: 8, font: fontR, color: BRANCO,
    });
  }

  function novaPagina() {
    rodape();
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    cabecalho();
    y = PAGE_H - 110;
  }

  function checkY(needed = 22) {
    if (y < 70 + needed) novaPagina();
  }

  // ── Cabeçalho da primeira página ───────────────────────────────────────────
  cabecalho();
  y = PAGE_H - 105;

  // ── Dados do cliente ───────────────────────────────────────────────────────
  page.drawRectangle({ x: MX, y: y - 65, width: PAGE_W - MX * 2, height: 74, color: CINZA_L });
  y -= 8;
  page.drawText('DADOS DO CLIENTE', { x: MX + 8, y, size: 9, font: fontB, color: COR });
  y -= 16;
  page.drawText(safe(orcamento.cliente.nome), { x: MX + 8, y, size: 11, font: fontB, color: PRETO });
  y -= 14;
  page.drawText(safe(`Tel: ${orcamento.cliente.telefone}`), { x: MX + 8, y, size: 9, font: fontR, color: PRETO });
  if (orcamento.cliente.email) {
    page.drawText(safe(`  |  ${orcamento.cliente.email}`), { x: MX + 95, y, size: 9, font: fontR, color: PRETO });
  }
  y -= 13;
  if (orcamento.cliente.endereco) {
    page.drawText(safe(orcamento.cliente.endereco), {
      x: MX + 8, y, size: 9, font: fontR, color: PRETO, maxWidth: PAGE_W - MX * 2 - 16,
    });
  }

  y -= 18;

  // ── Título da tabela ───────────────────────────────────────────────────────
  page.drawText('ITENS DO ORCAMENTO', { x: MX + 5, y, size: 10, font: fontB, color: COR });
  y -= 16;

  // ── Cabeçalho das colunas ──────────────────────────────────────────────────
  function desenharCabecalhoTabela() {
    page.drawRectangle({ x: MX, y: y - 6, width: PAGE_W - MX * 2, height: 20, color: COR });
    const h = (txt: string, x: number) =>
      page.drawText(txt, { x, y, size: 8, font: fontB, color: BRANCO });

    h('Componente', COL.componente);
    h('Selecao', COL.selecao);
    h('Altura', COL.altura);
    h('Largura', COL.largura);
    h('Area/Qtde', COL.medida);
    h('Preco Unit.', COL.preco);
    h('Valor Total', COL.total);
    y -= 22;
  }

  desenharCabecalhoTabela();

  // ── Linhas dos itens ───────────────────────────────────────────────────────
  for (let i = 0; i < orcamento.itens.length; i++) {
    checkY(22);
    const item = orcamento.itens[i];
    const bg = i % 2 === 0 ? BRANCO : CINZA_L;
    page.drawRectangle({ x: MX, y: y - 6, width: PAGE_W - MX * 2, height: 20, color: bg });

    const cell = (txt: string, x: number, bold = false, maxW?: number) =>
      page.drawText(safe(txt), {
        x, y, size: 8, font: bold ? fontB : fontR, color: PRETO,
        ...(maxW ? { maxWidth: maxW } : {}),
      });

    cell(item.categoria, COL.componente);
    cell(item.produto, COL.selecao, false, COL.altura - COL.selecao - 4);

    // Altura / Largura — só para Vidro
    cell(item.altura ? `${item.altura}m` : '-', COL.altura);
    cell(item.largura ? `${item.largura}m` : '-', COL.largura);

    cell(celulaMedidaPDF(item), COL.medida);
    cell(formatCurrency(item.valorUnitario), COL.preco);
    cell(formatCurrency(item.subtotal), COL.total, true);

    // Linha divisória leve entre colunas
    [COL.selecao, COL.altura, COL.largura, COL.medida, COL.preco, COL.total].forEach((cx) => {
      page.drawLine({
        start: { x: cx - 3, y: y + 12 },
        end: { x: cx - 3, y: y - 5 },
        thickness: 0.3,
        color: CINZA_B,
      });
    });

    y -= 22;
  }

  y -= 8;

  // ── Totais ─────────────────────────────────────────────────────────────────
  // Garante espaço (totais + assinaturas ≈ 160px)
  if (y < 220) novaPagina();

  const TX = PAGE_W - 230; // x início dos totais

  function totalRow(label: string, value: number, destaque = false) {
    if (destaque) {
      page.drawRectangle({ x: TX - 8, y: y - 6, width: 210, height: 20, color: COR });
    }
    const cor = destaque ? BRANCO : PRETO;
    const font = destaque ? fontB : fontR;
    const sz = destaque ? 11 : 9;
    page.drawText(label, { x: TX, y, size: sz, font, color: cor });
    page.drawText(formatCurrency(value), { x: TX + 140, y, size: sz, font, color: cor });
    y -= 22;
  }

  totalRow('Subtotal dos itens:', orcamento.itens.reduce((s, i) => s + i.subtotal, 0));
  if (orcamento.instalacao > 0) totalRow('Instalacao:', orcamento.instalacao);
  if (orcamento.frete > 0) totalRow('Frete:', orcamento.frete);
  if (orcamento.desconto > 0) totalRow('Desconto:', -orcamento.desconto);
  y -= 4;
  totalRow('VALOR TOTAL:', orcamento.total, true);

  y -= 16;

  // ── Observações ────────────────────────────────────────────────────────────
  if (orcamento.observacoes) {
    checkY(40);
    page.drawText('Observacoes:', { x: MX + 5, y, size: 9, font: fontB, color: PRETO });
    y -= 14;
    page.drawText(safe(orcamento.observacoes), {
      x: MX + 5, y, size: 9, font: fontR, color: CINZA_M, maxWidth: PAGE_W - MX * 2 - 10,
    });
    y -= 20;
  }

  // ── Assinaturas ────────────────────────────────────────────────────────────
  const ASSIN_Y = 105;
  page.drawLine({ start: { x: 60, y: ASSIN_Y }, end: { x: 235, y: ASSIN_Y }, thickness: 0.8, color: CINZA_M });
  page.drawText('Assinatura do Cliente', { x: 90, y: ASSIN_Y - 14, size: 8, font: fontR, color: CINZA_M });

  page.drawLine({ start: { x: 330, y: ASSIN_Y }, end: { x: 530, y: ASSIN_Y }, thickness: 0.8, color: CINZA_M });
  page.drawText('Assinatura do Vendedor', { x: 355, y: ASSIN_Y - 14, size: 8, font: fontR, color: CINZA_M });

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  rodape();

  return pdfDoc.save();
}
