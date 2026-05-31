import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Orcamento, ConfiguracaoEmpresa } from '@/types';
import { formatCurrency } from './utils';

const COR_PRIMARIA_DEFAULT = { r: 0.06, g: 0.47, b: 0.81 };

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return COR_PRIMARIA_DEFAULT;
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Sanitiza texto para evitar crash do pdf-lib com caracteres fora do WinAnsi encoding.
 * StandardFonts (Helvetica) suporta apenas Latin-1 / WinAnsi.
 * Caracteres fora desse range são substituídos por '?'.
 */
function safe(text: string | undefined | null): string {
  if (!text) return '';
  return String(text).replace(/[^\x00-\xFF]/g, '?');
}

export async function generatePDF(
  orcamento: Orcamento,
  config: ConfiguracaoEmpresa
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const corHex = hexToRgb(config.corPrimaria || '#0f77cf');
  const corPrimaria = rgb(corHex.r, corHex.g, corHex.b);
  const corBranco = rgb(1, 1, 1);
  const corPreto = rgb(0, 0, 0);
  const corCinzaClaro = rgb(0.95, 0.95, 0.95);
  const corCinzaMedio = rgb(0.5, 0.5, 0.5);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595;
  const PAGE_H = 842;
  const MARGIN = 30;
  const COL_PRODUTO = 40;
  const COL_MEDIDAS = 220;
  const COL_QTD = 320;
  const COL_UNIT = 390;
  const COL_SUB = 470;

  // Todos os itens (produtos + acessórios) para calcular páginas necessárias
  const linhasItens = orcamento.itens.length + orcamento.acessorios.length;

  // Função auxiliar para adicionar página e retornar y inicial do conteúdo
  function addPage() {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    return page;
  }

  let page = addPage();

  function desenharCabecalho() {
    page.drawRectangle({ x: 0, y: PAGE_H - 100, width: PAGE_W, height: 100, color: corPrimaria });

    page.drawText(safe(config.nomeEmpresa), {
      x: 40, y: PAGE_H - 40, size: 20, font: fontBold, color: corBranco,
      maxWidth: 280,
    });
    page.drawText(safe(config.telefone), {
      x: 40, y: PAGE_H - 60, size: 10, font: fontRegular, color: corBranco,
    });
    page.drawText(safe(config.email), {
      x: 40, y: PAGE_H - 75, size: 10, font: fontRegular, color: corBranco,
    });

    page.drawText('ORCAMENTO', {
      x: PAGE_W - 200, y: PAGE_H - 35, size: 14, font: fontBold, color: corBranco,
    });
    page.drawText(`N ${orcamento.numero}`, {
      x: PAGE_W - 200, y: PAGE_H - 55, size: 16, font: fontBold, color: corBranco,
    });
    page.drawText(`Data: ${safe(orcamento.data)}`, {
      x: PAGE_W - 200, y: PAGE_H - 75, size: 10, font: fontRegular, color: corBranco,
    });
  }

  function desenharRodape() {
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 55, color: corPrimaria });
    page.drawText(
      safe(config.rodapePDF || `Orcamento valido por ${config.validadeOrcamento || 15} dias.`),
      { x: 40, y: 32, size: 9, font: fontRegular, color: corBranco, maxWidth: PAGE_W - 80 }
    );
    page.drawText(
      safe(`WhatsApp: ${config.whatsapp} | ${config.email}`),
      { x: 40, y: 16, size: 9, font: fontRegular, color: corBranco, maxWidth: PAGE_W - 80 }
    );
  }

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  desenharCabecalho();

  let y = PAGE_H - 120;

  // ── Dados do Cliente ────────────────────────────────────────────────────────
  page.drawRectangle({ x: MARGIN, y: y - 70, width: PAGE_W - MARGIN * 2, height: 80, color: corCinzaClaro });
  page.drawText('DADOS DO CLIENTE', { x: 40, y: y - 10, size: 10, font: fontBold, color: corPrimaria });
  page.drawText(safe(`Nome: ${orcamento.cliente.nome}`), { x: 40, y: y - 28, size: 10, font: fontRegular, color: corPreto });
  page.drawText(safe(`Telefone: ${orcamento.cliente.telefone}`), { x: 40, y: y - 42, size: 10, font: fontRegular, color: corPreto });
  if (orcamento.cliente.endereco) {
    page.drawText(safe(`Endereco: ${orcamento.cliente.endereco}`), {
      x: 40, y: y - 56, size: 10, font: fontRegular, color: corPreto, maxWidth: PAGE_W - 80,
    });
  }

  y -= 90;

  // ── Tabela de Itens ─────────────────────────────────────────────────────────
  page.drawText('ITENS DO ORCAMENTO', { x: 40, y, size: 11, font: fontBold, color: corPrimaria });
  y -= 18;

  // Cabeçalho da tabela
  page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_W - MARGIN * 2, height: 20, color: corPrimaria });
  page.drawText('Produto', { x: COL_PRODUTO, y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Medidas', { x: COL_MEDIDAS, y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Qtd', { x: COL_QTD, y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Unitario', { x: COL_UNIT, y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Subtotal', { x: COL_SUB, y, size: 9, font: fontBold, color: corBranco });
  y -= 20;

  let rowIdx = 0;

  function checkNewPage() {
    // Se y está muito próximo do rodapé (< 80px), cria nova página
    if (y < 80) {
      desenharRodape();
      page = addPage();
      desenharCabecalho();
      y = PAGE_H - 120;

      // Repete cabeçalho da tabela
      page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_W - MARGIN * 2, height: 20, color: corPrimaria });
      page.drawText('Produto', { x: COL_PRODUTO, y, size: 9, font: fontBold, color: corBranco });
      page.drawText('Medidas', { x: COL_MEDIDAS, y, size: 9, font: fontBold, color: corBranco });
      page.drawText('Qtd', { x: COL_QTD, y, size: 9, font: fontBold, color: corBranco });
      page.drawText('Unitario', { x: COL_UNIT, y, size: 9, font: fontBold, color: corBranco });
      page.drawText('Subtotal', { x: COL_SUB, y, size: 9, font: fontBold, color: corBranco });
      y -= 20;
    }
  }

  // Linhas dos produtos
  for (const item of orcamento.itens) {
    checkNewPage();
    const bg = rowIdx % 2 === 0 ? rgb(1, 1, 1) : corCinzaClaro;
    page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_W - MARGIN * 2, height: 18, color: bg });

    const medidas = item.largura && item.altura
      ? `${item.largura}m x ${item.altura}m (${item.area?.toFixed(2)}m2)`
      : '-';

    const nomeProduto = safe(item.produto).length > 28
      ? safe(item.produto).substring(0, 26) + '..'
      : safe(item.produto);

    page.drawText(nomeProduto, { x: COL_PRODUTO, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(safe(medidas), { x: COL_MEDIDAS, y, size: 7, font: fontRegular, color: corPreto });
    page.drawText(String(item.quantidade), { x: COL_QTD, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.valorUnitario), { x: COL_UNIT, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.subtotal), { x: COL_SUB, y, size: 8, font: fontBold, color: corPreto });

    y -= 20;
    rowIdx++;
  }

  // Linhas dos acessórios
  for (const item of orcamento.acessorios) {
    checkNewPage();
    const bg = rowIdx % 2 === 0 ? rgb(1, 1, 1) : corCinzaClaro;
    page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_W - MARGIN * 2, height: 18, color: bg });

    page.drawText(safe(item.nome), { x: COL_PRODUTO, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText('Acessorio', { x: COL_MEDIDAS, y, size: 8, font: fontRegular, color: corCinzaMedio });
    page.drawText(String(item.quantidade), { x: COL_QTD, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.valor), { x: COL_UNIT, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.subtotal), { x: COL_SUB, y, size: 8, font: fontBold, color: corPreto });

    y -= 20;
    rowIdx++;
  }

  y -= 10;

  // ── Totais ──────────────────────────────────────────────────────────────────
  // Garante espaço suficiente para totais + assinaturas (≈150px)
  if (y < 230) {
    desenharRodape();
    page = addPage();
    desenharCabecalho();
    y = PAGE_H - 160;
  }

  const totaisX = PAGE_W - 240;

  function drawTotalRow(label: string, value: number, bold = false, highlight = false) {
    if (highlight) {
      page.drawRectangle({ x: totaisX - 10, y: y - 6, width: 220, height: 20, color: corPrimaria });
    }
    const font = bold ? fontBold : fontRegular;
    const color = highlight ? corBranco : corPreto;
    const size = bold ? 11 : 9;
    page.drawText(label, { x: totaisX, y, size, font, color });
    page.drawText(formatCurrency(value), { x: totaisX + 150, y, size, font, color });
    y -= 22;
  }

  drawTotalRow('Subtotal:', orcamento.subtotal);
  if (orcamento.instalacao > 0) drawTotalRow('Instalacao:', orcamento.instalacao);
  if (orcamento.frete > 0) drawTotalRow('Frete:', orcamento.frete);
  if (orcamento.desconto > 0) drawTotalRow('Desconto:', -orcamento.desconto);
  drawTotalRow('VALOR TOTAL:', orcamento.total, true, true);

  y -= 20;

  // ── Observações ─────────────────────────────────────────────────────────────
  if (orcamento.observacoes) {
    page.drawText('Observacoes:', { x: 40, y, size: 9, font: fontBold, color: corPreto });
    y -= 14;
    page.drawText(safe(orcamento.observacoes), {
      x: 40, y, size: 9, font: fontRegular, color: corCinzaMedio, maxWidth: PAGE_W - 80,
    });
    y -= 24;
  }

  // ── Assinaturas (fixas acima do rodapé) ─────────────────────────────────────
  // Posiciona sempre na mesma posição vertical acima do rodapé
  const assinaturaY = 110;
  page.drawLine({ start: { x: 60, y: assinaturaY }, end: { x: 240, y: assinaturaY }, thickness: 1, color: corCinzaMedio });
  page.drawText('Assinatura do Cliente', { x: 90, y: assinaturaY - 14, size: 9, font: fontRegular, color: corCinzaMedio });

  page.drawLine({ start: { x: 330, y: assinaturaY }, end: { x: 530, y: assinaturaY }, thickness: 1, color: corCinzaMedio });
  page.drawText('Assinatura do Vendedor', { x: 355, y: assinaturaY - 14, size: 9, font: fontRegular, color: corCinzaMedio });

  // ── Rodapé ──────────────────────────────────────────────────────────────────
  desenharRodape();

  return pdfDoc.save();
}
