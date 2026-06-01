import type { CategoriaType, ItemOrcamento, Produto, UnidadeTipo } from '@/types';

/**
 * Campos necessários por categoria.
 * Determina quais inputs o formulário exibe.
 */
export const CAMPOS_POR_CATEGORIA: Record<CategoriaType, {
  usaAltura: boolean;
  usaLargura: boolean;
  usaMetragem: boolean;
  usaQuantidade: boolean;
  labelMedida: string;
}> = {
  Vidro: {
    usaAltura: true,
    usaLargura: true,
    usaMetragem: false,
    usaQuantidade: true, // quantidade de painéis/folhas
    labelMedida: 'Área (m²)',
  },
  Kit: {
    usaAltura: false,
    usaLargura: false,
    usaMetragem: false,
    usaQuantidade: true,
    labelMedida: 'Quantidade',
  },
  Perfil: {
    usaAltura: false,
    usaLargura: false,
    usaMetragem: true,
    usaQuantidade: false,
    labelMedida: 'Metragem (m)',
  },
  Estrutura: {
    usaAltura: false,
    usaLargura: false,
    usaMetragem: true,
    usaQuantidade: false,
    labelMedida: 'Metragem (m)',
  },
  Acessorio: {
    usaAltura: false,
    usaLargura: false,
    usaMetragem: false,
    usaQuantidade: true,
    labelMedida: 'Quantidade',
  },
};

export interface CamposItem {
  altura?: number;
  largura?: number;
  metragem?: number;
  quantidade?: number;
  valorCustom?: number;
}

/**
 * Calcula o subtotal de um item com base na categoria e nos campos preenchidos.
 */
export function calcularSubtotal(
  produto: Produto,
  campos: CamposItem
): { subtotal: number; area?: number } {
  const valor = campos.valorCustom ?? produto.valorUnitario;

  switch (produto.categoria) {
    case 'Vidro': {
      const h = campos.altura ?? 0;
      const w = campos.largura ?? 0;
      const qtd = campos.quantidade ?? 1;
      const area = h * w;
      return { subtotal: area * valor * qtd, area };
    }
    case 'Kit':
    case 'Acessorio': {
      const qtd = campos.quantidade ?? 1;
      return { subtotal: qtd * valor };
    }
    case 'Perfil':
    case 'Estrutura': {
      const m = campos.metragem ?? 0;
      return { subtotal: m * valor };
    }
  }
}

/**
 * Monta a string de medida/quantidade para exibição no resumo e PDF.
 */
export function descreverMedida(item: ItemOrcamento): string {
  switch (item.categoria) {
    case 'Vidro':
      return `${item.largura ?? 0}m x ${item.altura ?? 0}m = ${(item.area ?? 0).toFixed(2)}m2 x ${item.quantidade ?? 1}`;
    case 'Kit':
    case 'Acessorio':
      return `${item.quantidade ?? 1} un`;
    case 'Perfil':
    case 'Estrutura':
      return `${item.metragem ?? 0} m`;
  }
}

/**
 * Retorna o texto da coluna "Área/Qtde" no PDF.
 */
export function celulaMedidaPDF(item: ItemOrcamento): string {
  switch (item.categoria) {
    case 'Vidro':
      return `${(item.area ?? 0).toFixed(2)} m2`;
    case 'Perfil':
    case 'Estrutura':
      return `${item.metragem ?? 0} m`;
    case 'Kit':
    case 'Acessorio':
      return `${item.quantidade ?? 1} un`;
  }
}

/**
 * Converte a unidade da planilha (string livre) para UnidadeTipo canônica.
 */
export function normalizarUnidade(raw: string): UnidadeTipo {
  const v = raw.toLowerCase().trim();
  if (v === 'm2' || v === 'm²') return 'm2';
  if (v === 'm') return 'm';
  return 'un';
}

/**
 * Infere a categoria a partir do valor da coluna na planilha.
 * Aceita variações de capitalização.
 */
export function normalizarCategoria(raw: string): CategoriaType {
  const v = raw.trim().toLowerCase();
  if (v === 'vidro') return 'Vidro';
  if (v === 'kit') return 'Kit';
  if (v === 'perfil') return 'Perfil';
  if (v === 'estrutura') return 'Estrutura';
  if (v === 'acessorio' || v === 'acessório') return 'Acessorio';
  // fallback — trata como acessório para não quebrar
  return 'Acessorio';
}
