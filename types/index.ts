export interface Produto {
  id: string;
  categoria: string;
  produto: string;
  unidade: 'm²' | 'un' | 'm' | 'kit';
  valorUnitario: number;
  observacao?: string;
}

export interface Acessorio {
  id: string;
  nome: string;
  valor: number;
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
  categoria: string;
  largura?: number;
  altura?: number;
  area?: number;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
  tipoCalculo: 'm2' | 'unitario';
  observacao?: string;
}

export interface AcessorioItem {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
  subtotal: number;
}

export type StatusOrcamento = 'Em aberto' | 'Aprovado' | 'Reprovado' | 'Em negociação';

export interface Orcamento {
  numero: string;
  data: string;
  clienteId: string;
  cliente: Cliente;
  itens: ItemOrcamento[];
  acessorios: AcessorioItem[];
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

export interface DashboardStats {
  totalOrcamentos: number;
  valorTotalVendido: number;
  orcamentosMes: number;
  taxaAprovacao: number;
  orcamentosRecentes: Array<{
    numero: string;
    cliente: string;
    valor: number;
    status: StatusOrcamento;
    data: string;
  }>;
}
