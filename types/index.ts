// ─── 7 categorias com regras de cálculo distintas ────────────────────────────
export type CategoriaType =
  | 'Vidro'
  | 'Kit'
  | 'Perfil'
  | 'Estrutura'
  | 'Acessorio'
  | 'Sacada'
  | 'Espelho';

export const CATEGORIAS_TIPO: CategoriaType[] = [
  'Vidro',
  'Sacada',
  'Espelho',
  'Kit',
  'Perfil',
  'Estrutura',
  'Acessorio',
];

export type UnidadeTipo = 'm2' | 'm' | 'un';

export interface Produto {
  id: string;
  categoria: CategoriaType;
  produto: string;
  unidade: UnidadeTipo;
  valorUnitario: number;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
}

export interface ItemOrcamento {
  id: string;
  produtoId: string;
  produto: string;
  categoria: CategoriaType;
  unidade: UnidadeTipo;

  // Vidro / Sacada / Espelho — dimensões em metros
  altura?: number;
  largura?: number;
  area?: number;

  // Perfil / Estrutura — metros lineares
  metragem?: number;

  // Vidro — quantidade de painéis (multiplicador extra sobre a área)
  quantidade?: number;

  // Kit / Acessório — unidades
  // (reutiliza o campo `quantidade`)

  valorUnitario: number;
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
