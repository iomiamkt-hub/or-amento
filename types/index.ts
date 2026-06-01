// ─── Categorias de produto com regras de cálculo distintas ──────────────────
export type CategoriaType = 'Vidro' | 'Kit' | 'Perfil' | 'Estrutura' | 'Acessorio';

export const CATEGORIAS_TIPO: CategoriaType[] = [
  'Vidro',
  'Kit',
  'Perfil',
  'Estrutura',
  'Acessorio',
];

// Unidade de medida que a planilha usa para cada categoria
export type UnidadeTipo = 'm2' | 'm' | 'un';

export interface Produto {
  id: string;
  categoria: CategoriaType;
  produto: string;
  unidade: UnidadeTipo;
  valorUnitario: number;
  observacao?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
}

// ─── Item unificado — engloba vidros, kits, perfis, estruturas e acessórios ──
export interface ItemOrcamento {
  id: string;
  produtoId: string;
  produto: string;
  categoria: CategoriaType;
  unidade: UnidadeTipo;

  // Vidro: dimensões em metros
  altura?: number;
  largura?: number;
  area?: number; // altura × largura

  // Perfil / Estrutura: metros lineares
  metragem?: number;

  // Kit / Acessório: unidades
  quantidade?: number;

  // Valor base da planilha (por m², por m ou por un)
  valorUnitario: number;

  // Total calculado
  subtotal: number;

  observacao?: string;
}

export type StatusOrcamento = 'Em aberto' | 'Aprovado' | 'Reprovado' | 'Em negociação';

export interface Orcamento {
  numero: string;
  data: string;
  clienteId: string;
  cliente: Cliente;
  itens: ItemOrcamento[];
  instalacao: number;
  frete: number;
  desconto: number;
  subtotal: number;
  total: number;
  status: StatusOrcamento;
  observacoes?: string;
  validade: number;
}

export interface ConfiguracaoEmpresa {
  nomeEmpresa: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco?: string;
  logoUrl?: string;
  rodapePDF: string;
  validadeOrcamento: number;
  corPrimaria: string;
}
