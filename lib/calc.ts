import type { CategoriaType, ItemOrcamento, Produto, UnidadeTipo } from '@/types';

// ─── Grupos de comportamento ──────────────────────────────────────────────────

/** Categorias que calculam com altura × largura (área m²). */
export const CAT_AREA: CategoriaType[] = ['Vidro', 'Sacada', 'Espelho'];

/** Categorias que usam quantidade extra de painéis (Vidro = área × preço × qtd). */
export const CAT_COM_PAINEL: CategoriaType[] = ['Vidro'];

/** Categorias que calculam com metragem linear (m). */
export const CAT_METRO: CategoriaType[] = ['Perfil', 'Estrutura'];

/** Categorias que calculam com quantidade de unidades. */
export const CAT_UNIDADE: CategoriaType[] = ['Kit', 'Acessorio'];

// ─── Campos exibidos por categoria ───────────────────────────────────────────

export interface CampoDef {
  usaAltura: boolean;
  usaLargura: boolean;
  usaQuantidade: boolean; // painéis (Vidro) ou unidades (Kit/Acessório)
  usaMetragem: boolean;
}

export const CAMPOS_POR_CATEGORIA: Record<CategoriaType, CampoDef> = {
  Vidro:     { usaAltura: true,  usaLargura: true,  usaQuantidade: true,  usaMetragem: false },
  Sacada:    { usaAltura: true,  usaLargura: true,  usaQuantidade: false, usaMetragem: false },
  Espelho:   { usaAltura: true,  usaLargura: true,  usaQuantidade: false, usaMetragem: false },
  Perfil:    { usaAltura: false, usaLargura: false, usaQuantidade: false, usaMetragem: true  },
  Estrutura: { usaAltura: false, usaLargura: false, usaQuantidade: false, usaMetragem: true  },
  Kit:       { usaAltura: false, usaLargura: false, usaQuantidade: true,  usaMetragem: false },
  Acessorio: { usaAltura: false, usaLargura: false, usaQuantidade: true,  usaMetragem: false },
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
    const qtd = CAT_COM_PAINEL.includes(cat) ? (campos.quantidade ?? 1) : 1;
    return { subtotal: area * preco * qtd, area };
  }

  if (CAT_METRO.includes(cat)) {
    return { subtotal: (campos.metragem ?? 0) * preco };
  }

  // Kit / Acessorio
  return { subtotal: (campos.quantidade ?? 1) * preco };
}

// ─── Textos de exibição ───────────────────────────────────────────────────────

export function descreverMedida(item: ItemOrcamento): string {
  if (CAT_AREA.includes(item.categoria)) {
    const area = (item.area ?? 0).toFixed(2);
    const base = `${item.largura ?? 0}m x ${item.altura ?? 0}m = ${area} m²`;
    if (CAT_COM_PAINEL.includes(item.categoria) && (item.quantidade ?? 1) > 1) {
      return `${base} × ${item.quantidade} painéis`;
    }
    return base;
  }
  if (CAT_METRO.includes(item.categoria)) return `${item.metragem ?? 0} m`;
  return `${item.quantidade ?? 1} un`;
}

/** Texto da coluna Área/Qtde no PDF. */
export function celulaMedidaPDF(item: ItemOrcamento): string {
  if (CAT_AREA.includes(item.categoria)) {
    const area = `${(item.area ?? 0).toFixed(2)} m2`;
    if (CAT_COM_PAINEL.includes(item.categoria) && (item.quantidade ?? 1) > 1) {
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

/**
 * Converte o texto da coluna Categoria da planilha para o tipo canônico.
 * Usa escape Unicode explícito (̀-ͯ) para remover acentos de forma
 * confiável em qualquer runtime (Node, Vercel Edge, etc.).
 */
export function normalizarCategoria(raw: string): CategoriaType {
  const v = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // remove diacríticos de forma segura

  if (v === 'vidro') return 'Vidro';
  if (v === 'kit') return 'Kit';
  if (v === 'perfil') return 'Perfil';
  if (v === 'estrutura') return 'Estrutura';
  if (v === 'acessorio' || v === 'acessorios') return 'Acessorio';
  if (v === 'sacada' || v === 'sacadas') return 'Sacada';
  if (v === 'espelho' || v === 'espelhos') return 'Espelho';
  return 'Acessorio'; // fallback seguro
}

/**
 * Interpreta a coluna "Ativo" da planilha.
 * Célula vazia = ativo por padrão (compatibilidade com planilhas sem a coluna).
 * Desativa: NÃO / N / 0 / FALSE / INATIVO / DESATIVADO / OFF.
 */
export function normalizarAtivo(raw: string | undefined): boolean {
  if (!raw || raw.trim() === '') return true;
  const v = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return !['nao', 'n', '0', 'false', 'inativo', 'desativado', 'off'].includes(v);
}
