import type { CategoriaType, ItemOrcamento, Produto, UnidadeTipo } from '@/types';

// ─── Grupos de comportamento ──────────────────────────────────────────────────
// Facilita adicionar futuras categorias sem alterar switch/case em vários lugares.

/** Categorias que calculam com altura × largura (área m²). */
export const CAT_AREA: CategoriaType[] = ['Vidro', 'Sacada', 'Espelho'];

/** Categorias que calculam com metragem linear (m). */
export const CAT_METRO: CategoriaType[] = ['Perfil', 'Estrutura'];

/** Categorias que calculam com quantidade de unidades. */
export const CAT_UNIDADE: CategoriaType[] = ['Kit', 'Acessorio'];

/** Apenas Vidro tem multiplicador extra de quantidade de painéis. */
export const CAT_COM_QUANTIDADE_PAINEL: CategoriaType[] = ['Vidro'];

// ─── Campos exibidos por categoria ───────────────────────────────────────────

export interface CampoDef {
  usaAltura: boolean;
  usaLargura: boolean;
  usaMetragem: boolean;
  usaQuantidade: boolean;
  labelMedida: string;
}

function defArea(comQtd: boolean): CampoDef {
  return {
    usaAltura: true,
    usaLargura: true,
    usaMetragem: false,
    usaQuantidade: comQtd,
    labelMedida: comQtd ? 'Área (m²) × Qtd painéis' : 'Área (m²)',
  };
}

export const CAMPOS_POR_CATEGORIA: Record<CategoriaType, CampoDef> = {
  Vidro:     defArea(true),   // área × preço × nº painéis
  Sacada:    defArea(false),  // área × preço
  Espelho:   defArea(false),  // área × preço
  Perfil:    { usaAltura: false, usaLargura: false, usaMetragem: true,  usaQuantidade: false, labelMedida: 'Metragem (m)' },
  Estrutura: { usaAltura: false, usaLargura: false, usaMetragem: true,  usaQuantidade: false, labelMedida: 'Metragem (m)' },
  Kit:       { usaAltura: false, usaLargura: false, usaMetragem: false, usaQuantidade: true,  labelMedida: 'Quantidade'   },
  Acessorio: { usaAltura: false, usaLargura: false, usaMetragem: false, usaQuantidade: true,  labelMedida: 'Quantidade'   },
};

// ─── Cálculo de subtotal ──────────────────────────────────────────────────────

export interface CamposItem {
  altura?: number;
  largura?: number;
  metragem?: number;
  quantidade?: number;
  valorCustom?: number;
}

export function calcularSubtotal(
  produto: Produto,
  campos: CamposItem,
): { subtotal: number; area?: number } {
  const preco = campos.valorCustom ?? produto.valorUnitario;
  const cat = produto.categoria;

  if (CAT_AREA.includes(cat)) {
    const h = campos.altura ?? 0;
    const w = campos.largura ?? 0;
    const area = h * w;
    const qtd = CAT_COM_QUANTIDADE_PAINEL.includes(cat) ? (campos.quantidade ?? 1) : 1;
    return { subtotal: area * preco * qtd, area };
  }

  if (CAT_METRO.includes(cat)) {
    return { subtotal: (campos.metragem ?? 0) * preco };
  }

  // CAT_UNIDADE (Kit / Acessorio)
  return { subtotal: (campos.quantidade ?? 1) * preco };
}

// ─── Textos de exibição ───────────────────────────────────────────────────────

export function descreverMedida(item: ItemOrcamento): string {
  if (CAT_AREA.includes(item.categoria)) {
    const area = (item.area ?? 0).toFixed(2);
    const base = `${item.largura ?? 0}m x ${item.altura ?? 0}m = ${area} m2`;
    if (CAT_COM_QUANTIDADE_PAINEL.includes(item.categoria) && (item.quantidade ?? 1) > 1) {
      return `${base} x ${item.quantidade} paineis`;
    }
    return base;
  }
  if (CAT_METRO.includes(item.categoria)) return `${item.metragem ?? 0} m`;
  return `${item.quantidade ?? 1} un`;
}

/** Texto da coluna "Área/Qtde" no PDF. */
export function celulaMedidaPDF(item: ItemOrcamento): string {
  if (CAT_AREA.includes(item.categoria)) {
    const area = `${(item.area ?? 0).toFixed(2)} m2`;
    if (CAT_COM_QUANTIDADE_PAINEL.includes(item.categoria) && (item.quantidade ?? 1) > 1) {
      return `${area} x${item.quantidade}`;
    }
    return area;
  }
  if (CAT_METRO.includes(item.categoria)) return `${item.metragem ?? 0} m`;
  return `${item.quantidade ?? 1} un`;
}

// ─── Normalização da planilha ─────────────────────────────────────────────────

export function normalizarUnidade(raw: string): UnidadeTipo {
  const v = raw.toLowerCase().trim();
  if (v === 'm2' || v === 'm²') return 'm2';
  if (v === 'm') return 'm';
  return 'un';
}

export function normalizarCategoria(raw: string): CategoriaType {
  const v = raw.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Normaliza sem acentos para aceitar "Acessório" e "Acessorio" etc.
  if (v === 'vidro') return 'Vidro';
  if (v === 'kit') return 'Kit';
  if (v === 'perfil') return 'Perfil';
  if (v === 'estrutura') return 'Estrutura';
  if (v === 'acessorio' || v === 'acessorios') return 'Acessorio';
  if (v === 'sacada' || v === 'sacadas') return 'Sacada';
  if (v === 'espelho' || v === 'espelhos') return 'Espelho';
  return 'Acessorio'; // fallback seguro
}

/** Interpreta a coluna "Ativo" da planilha. Aceita: SIM, S, 1, TRUE, ATIVO (e vazios = ativo). */
export function normalizarAtivo(raw: string | undefined): boolean {
  if (!raw || raw.trim() === '') return true; // célula vazia = ativo por padrão
  const v = raw.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return !['nao', 'n', '0', 'false', 'inativo', 'desativado', 'off'].includes(v);
}
