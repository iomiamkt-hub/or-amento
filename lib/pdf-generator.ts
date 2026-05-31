import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';
import type { Orcamento, ConfiguracaoEmpresa } from '@/types';
import { formatCurrency } from './utils';

const COR_PRIMARIA = { r: 0.06, g: 0.47, b: 0.81 }; // azul padrão

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return COR_PRIMARIA;
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

export async function generatePDF(
  orcamento: Orcamento,
  config: ConfiguracaoEmpresa
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const cor = hexToRgb(config.corPrimaria || '#0f77cf');
  const corPrimaria = rgb(cor.r, cor.g, cor.b);
  const corBranco = rgb(1, 1, 1);
  const corPreto = rgb(0, 0, 0);
  const corCinzaClaro = rgb(0.95, 0.95, 0.95);
  const corCinzaMedio = rgb(0.5, 0.5, 0.5);

  let y = height;

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: corPrimaria });

  page.drawText(config.nomeEmpresa, {
    x: 40, y: height - 40,
    size: 22, font: fontBold, color: corBranco,
  });

  page.drawText(config.telefone, {
    x: 40, y: height - 60,
    size: 10, font: fontRegular, color: corBranco,
  });

  page.drawText(config.email, {
    x: 40, y: height - 75,
    size: 10, font: fontRegular, color: corBranco,
  });

  // Número do orçamento no canto direito
  page.drawText(`ORÇAMENTO`, {
    x: width - 200, y: height - 35,
    size: 14, font: fontBold, color: corBranco,
  });

  page.drawText(`Nº ${orcamento.numero}`, {
    x: width - 200, y: height - 55,
    size: 18, font: fontBold, color: corBranco,
  });

  page.drawText(`Data: ${orcamento.data}`, {
    x: width - 200, y: height - 75,
    size: 10, font: fontRegular, color: corBranco,
  });

  y = height - 120;

  // ── Dados do Cliente ────────────────────────────────────────────────────────
  page.drawRectangle({ x: 30, y: y - 70, width: width - 60, height: 80, color: corCinzaClaro });
  page.drawText('DADOS DO CLIENTE', {
    x: 40, y: y - 10,
    size: 10, font: fontBold, color: corPrimaria,
  });

  page.drawText(`Nome: ${orcamento.cliente.nome}`, {
    x: 40, y: y - 28, size: 10, font: fontRegular, color: corPreto,
  });

  page.drawText(`Telefone: ${orcamento.cliente.telefone}`, {
    x: 40, y: y - 42, size: 10, font: fontRegular, color: corPreto,
  });

  if (orcamento.cliente.endereco) {
    page.drawText(`Endereço: ${orcamento.cliente.endereco}`, {
      x: 40, y: y - 56, size: 10, font: fontRegular, color: corPreto,
    });
  }

  y -= 90;

  // ── Tabela de Itens ─────────────────────────────────────────────────────────
  page.drawText('ITENS DO ORÇAMENTO', {
    x: 40, y, size: 11, font: fontBold, color: corPrimaria,
  });

  y -= 18;

  // Cabeçalho da tabela
  const cols = { produto: 40, medidas: 220, qtd: 320, unitario: 390, subtotal: 470 };
  page.drawRectangle({ x: 30, y: y - 6, width: width - 60, height: 20, color: corPrimaria });

  page.drawText('Produto', { x: cols.produto, y: y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Medidas', { x: cols.medidas, y: y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Qtd', { x: cols.qtd, y: y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Unitário', { x: cols.unitario, y: y, size: 9, font: fontBold, color: corBranco });
  page.drawText('Subtotal', { x: cols.subtotal, y: y, size: 9, font: fontBold, color: corBranco });

  y -= 20;

  // Linhas dos itens
  for (let i = 0; i < orcamento.itens.length; i++) {
    const item = orcamento.itens[i];
    const bg = i % 2 === 0 ? rgb(1, 1, 1) : corCinzaClaro;
    page.drawRectangle({ x: 30, y: y - 6, width: width - 60, height: 18, color: bg });

    const medidas = item.largura && item.altura
      ? `${item.largura}m × ${item.altura}m (${item.area?.toFixed(2)}m²)`
      : '-';

    const nomeProduto = item.produto.length > 30
      ? item.produto.substring(0, 28) + '...'
      : item.produto;

    page.drawText(nomeProduto, { x: cols.produto, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(medidas, { x: cols.medidas, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(item.quantidade.toString(), { x: cols.qtd, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.valorUnitario), { x: cols.unitario, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.subtotal), { x: cols.subtotal, y, size: 8, font: fontBold, color: corPreto });

    y -= 20;
  }

  // Acessórios
  for (let i = 0; i < orcamento.acessorios.length; i++) {
    const item = orcamento.acessorios[i];
    const bg = (orcamento.itens.length + i) % 2 === 0 ? rgb(1, 1, 1) : corCinzaClaro;
    page.drawRectangle({ x: 30, y: y - 6, width: width - 60, height: 18, color: bg });

    page.drawText(item.nome, { x: cols.produto, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText('Acessório', { x: cols.medidas, y, size: 8, font: fontRegular, color: corCinzaMedio });
    page.drawText(item.quantidade.toString(), { x: cols.qtd, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.valor), { x: cols.unitario, y, size: 8, font: fontRegular, color: corPreto });
    page.drawText(formatCurrency(item.subtotal), { x: cols.subtotal, y, size: 8, font: fontBold, color: corPreto });

    y -= 20;
  }

  y -= 10;

  // ── Totais ──────────────────────────────────────────────────────────────────
  const totaisX = width - 240;

  function drawTotalRow(label: string, value: number, bold = false, highlight = false) {
    if (highlight) {
      page.drawRectangle({ x: totaisX - 10, y: y - 6, width: 220, height: 20, color: corPrimaria });
    }
    page.drawText(label, {
      x: totaisX, y,
      size: bold ? 11 : 9,
      font: bold ? fontBold : fontRegular,
      color: highlight ? corBranco : corPreto,
    });
    page.drawText(formatCurrency(value), {
      x: totaisX + 150, y,
      size: bold ? 11 : 9,
      font: bold ? fontBold : fontRegular,
      color: highlight ? corBranco : corPreto,
    });
    y -= 22;
  }

  drawTotalRow('Subtotal:', orcamento.subtotal);
  if (orcamento.instalacao > 0) drawTotalRow('Instalação:', orcamento.instalacao);
  if (orcamento.frete > 0) drawTotalRow('Frete:', orcamento.frete);
  if (orcamento.desconto > 0) drawTotalRow(`Desconto:`, -orcamento.desconto);
  drawTotalRow('VALOR TOTAL:', orcamento.total, true, true);

  y -= 20;

  // ── Observações ─────────────────────────────────────────────────────────────
  if (orcamento.observacoes) {
    page.drawText('Observações:', { x: 40, y, size: 9, font: fontBold, color: corPreto });
    y -= 14;
    page.drawText(orcamento.observacoes, { x: 40, y, size: 9, font: fontRegular, color: corCinzaMedio });
    y -= 20;
  }

  // ── Assinatura ──────────────────────────────────────────────────────────────
  y = Math.min(y, 160);

  page.drawLine({ start: { x: 60, y: 100 }, end: { x: 240, y: 100 }, thickness: 1, color: corCinzaMedio });
  page.drawText('Assinatura do Cliente', { x: 90, y: 86, size: 9, font: fontRegular, color: corCinzaMedio });

  page.drawLine({ start: { x: 330, y: 100 }, end: { x: 530, y: 100 }, thickness: 1, color: corCinzaMedio });
  page.drawText('Assinatura do Vendedor', { x: 360, y: 86, size: 9, font: fontRegular, color: corCinzaMedio });

  // ── Rodapé ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 55, color: corPrimaria });

  page.drawText(config.rodapePDF || `Orçamento válido por ${config.validadeOrcamento || 15} dias.`, {
    x: 40, y: 32, size: 9, font: fontRegular, color: corBranco,
  });

  page.drawText(`WhatsApp: ${config.whatsapp} | ${config.email}`, {
    x: 40, y: 16, size: 9, font: fontRegular, color: corBranco,
  });

  return pdfDoc.save();
}
