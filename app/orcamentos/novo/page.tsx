'use client';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import OrcamentoResumo from '@/components/OrcamentoResumo';
import ClienteModal from '@/components/ClienteModal';
import type { Cliente, Produto, ItemOrcamento, Orcamento, CategoriaType } from '@/types';
import { CATEGORIAS_TIPO } from '@/types';
import { generateNumeroOrcamento, formatCurrency } from '@/lib/utils';
import { calcularSubtotal, descreverMedida, CAMPOS_POR_CATEGORIA } from '@/lib/calc';
import { PlusCircle, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import { CAT_AREA, CAT_METRO } from '@/lib/calc';

function today() {
  return new Date().toLocaleDateString('pt-BR');
}

export const BADGE_CORES: Record<CategoriaType, string> = {
  Vidro:     'bg-blue-100 text-blue-700',
  Sacada:    'bg-cyan-100 text-cyan-700',
  Espelho:   'bg-indigo-100 text-indigo-700',
  Kit:       'bg-purple-100 text-purple-700',
  Perfil:    'bg-orange-100 text-orange-700',
  Estrutura: 'bg-red-100 text-red-700',
  Acessorio: 'bg-gray-100 text-gray-700',
};

export default function NovoOrcamentoPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState('');

  const [clienteId, setClienteId] = useState('');
  const [clienteModal, setClienteModal] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  // ── Campos do item atual ──────────────────────────────────────────────────
  const [categoria, setCategoria] = useState<CategoriaType | ''>('');
  const [produtoId, setProdutoId] = useState('');
  const [altura, setAltura] = useState('');
  const [largura, setLargura] = useState('');
  const [metragem, setMetragem] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [valorCustom, setValorCustom] = useState('');
  const [obsItem, setObsItem] = useState('');
  const [erroItem, setErroItem] = useState('');

  // ── Lista de itens adicionados ────────────────────────────────────────────
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  // ── Adicionais ────────────────────────────────────────────────────────────
  const [instalacao, setInstalacao] = useState('');
  const [frete, setFrete] = useState('');
  const [desconto, setDesconto] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState('');
  const [erroSalvar, setErroSalvar] = useState('');
  const [numero] = useState(generateNumeroOrcamento());

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then(setClientes).catch(() => {});
    setLoadingProdutos(true);
    fetch('/api/sheets/produtos')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProdutos(data);
        else setErroProdutos(data?.detail ?? data?.error ?? 'Erro ao carregar produtos');
      })
      .catch(() => setErroProdutos('Erro de rede ao carregar produtos'))
      .finally(() => setLoadingProdutos(false));
  }, []);

  // Produto selecionado
  const produtoSelecionado = produtos.find((p) => p.id === produtoId);
  const campos = categoria ? CAMPOS_POR_CATEGORIA[categoria] : null;

  // Produtos da categoria selecionada
  const produtosFiltrados = produtos.filter((p) => !categoria || p.categoria === categoria);

  // Preview de cálculo em tempo real
  const previewSubtotal = (() => {
    if (!produtoSelecionado || !campos) return null;
    const result = calcularSubtotal(produtoSelecionado, {
      altura: parseFloat(altura) || undefined,
      largura: parseFloat(largura) || undefined,
      metragem: parseFloat(metragem) || undefined,
      quantidade: parseFloat(quantidade) || undefined,
      valorCustom: valorCustom ? parseFloat(valorCustom) : undefined,
    });
    return result.subtotal > 0 ? result : null;
  })();

  function resetCamposItem() {
    setProdutoId('');
    setAltura('');
    setLargura('');
    setMetragem('');
    setQuantidade('1');
    setValorCustom('');
    setObsItem('');
    setErroItem('');
  }

  function adicionarItem() {
    setErroItem('');
    if (!produtoSelecionado) { setErroItem('Selecione um produto'); return; }

    const camposItem = {
      altura: parseFloat(altura) || undefined,
      largura: parseFloat(largura) || undefined,
      metragem: parseFloat(metragem) || undefined,
      quantidade: parseFloat(quantidade) || undefined,
      valorCustom: valorCustom ? parseFloat(valorCustom) : undefined,
    };

    // Validações por grupo de categoria
    if (CAT_AREA.includes(produtoSelecionado.categoria)) {
      if (!camposItem.altura || camposItem.altura <= 0) { setErroItem('Informe a altura'); return; }
      if (!camposItem.largura || camposItem.largura <= 0) { setErroItem('Informe a largura'); return; }
    }
    if (CAT_METRO.includes(produtoSelecionado.categoria)) {
      if (!camposItem.metragem || camposItem.metragem <= 0) { setErroItem('Informe a metragem'); return; }
    }
    if (campos?.usaQuantidade && !campos.usaAltura) {
      if (!camposItem.quantidade || camposItem.quantidade <= 0) { setErroItem('Informe a quantidade'); return; }
    }

    const { subtotal, area } = calcularSubtotal(produtoSelecionado, camposItem);

    const item: ItemOrcamento = {
      id: `item-${Date.now()}`,
      produtoId: produtoSelecionado.id,
      produto: produtoSelecionado.produto,
      categoria: produtoSelecionado.categoria,
      unidade: produtoSelecionado.unidade,
      altura: camposItem.altura,
      largura: camposItem.largura,
      area,
      metragem: camposItem.metragem,
      quantidade: camposItem.quantidade,
      valorUnitario: camposItem.valorCustom ?? produtoSelecionado.valorUnitario,
      subtotal,
      observacao: obsItem || undefined,
    };

    setItens((prev) => [...prev, item]);
    resetCamposItem();
  }

  // Totais
  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const subtotalItens = itens.reduce((s, i) => s + i.subtotal, 0);
  const instVal = parseFloat(instalacao) || 0;
  const freteVal = parseFloat(frete) || 0;
  const descontoVal = parseFloat(desconto) || 0;
  const subtotal = subtotalItens + instVal + freteVal;
  const total = subtotal - descontoVal;

  const orcamento: Orcamento = {
    numero,
    data: today(),
    clienteId,
    cliente: clienteSelecionado ?? { id: '', nome: 'Cliente não selecionado', telefone: '' },
    itens,
    instalacao: instVal,
    frete: freteVal,
    desconto: descontoVal,
    subtotal,
    total,
    status: 'Em aberto',
    observacoes,
    validade: 15,
  };

  async function salvarOrcamento() {
    setErroSalvar('');
    setSalvoOk('');
    if (!clienteId) { setErroSalvar('Selecione um cliente'); return; }
    if (itens.length === 0) { setErroSalvar('Adicione pelo menos um item'); return; }
    setSalvando(true);
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orcamento),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`);
      }
      setSalvoOk(`Orçamento ${numero} salvo com sucesso!`);
    } catch (err) {
      setErroSalvar(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Novo Orçamento</h1>
        <p className="text-gray-500 text-sm mt-1">Nº {numero} · {today()}</p>
      </div>

      {/* Erros de salvar */}
      {erroSalvar && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erroSalvar}
        </div>
      )}
      {salvoOk && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {salvoOk}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Formulário ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Cliente */}
          <Card>
            <CardHeader><CardTitle className="text-base">1. Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome} — {c.telefone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setClienteModal(true)}>
                  <UserPlus className="w-4 h-4" />
                  Novo
                </Button>
              </div>
              {clienteSelecionado && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <p className="font-semibold">{clienteSelecionado.nome}</p>
                  <p className="text-gray-600">{clienteSelecionado.telefone}</p>
                  {clienteSelecionado.endereco && <p className="text-gray-600">{clienteSelecionado.endereco}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Adicionar item */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Adicionar Item</CardTitle>
              {loadingProdutos && <p className="text-xs text-gray-400">Carregando produtos da planilha...</p>}
              {erroProdutos && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {erroProdutos}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Categoria + Produto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={categoria}
                    onValueChange={(v) => {
                      setCategoria(v as CategoriaType);
                      setProdutoId('');
                      resetCamposItem();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set(produtos.map((p) => p.categoria))]
                        .sort((a, b) => CATEGORIAS_TIPO.indexOf(a) - CATEGORIAS_TIPO.indexOf(b))
                        .map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Produto</Label>
                  <Select
                    value={produtoId}
                    onValueChange={setProdutoId}
                    disabled={!categoria || loadingProdutos}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoria ? 'Selecione...' : 'Escolha a categoria primeiro'} />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosFiltrados.length === 0 ? (
                        <SelectItem value="__empty__" disabled>
                          Nenhum produto nesta categoria
                        </SelectItem>
                      ) : (
                        produtosFiltrados.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.produto}
                            <span className="ml-1 text-gray-400 text-xs">
                              — {formatCurrency(p.valorUnitario)}/{p.unidade}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campos dinâmicos por categoria */}
              {produtoSelecionado && campos && (
                <>
                  {/* Info do produto selecionado */}
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_CORES[produtoSelecionado.categoria]}`}>
                        {produtoSelecionado.categoria}
                      </span>
                      <span className="ml-2 text-sm font-medium">{produtoSelecionado.produto}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatCurrency(produtoSelecionado.valorUnitario)} / {produtoSelecionado.unidade}
                    </span>
                  </div>

                  {/* Área: altura + largura [+ painéis se Vidro] */}
                  {campos.usaAltura && campos.usaLargura && (
                    <div className={`grid gap-3 ${campos.usaQuantidade ? 'grid-cols-4' : 'grid-cols-3'}`}>
                      <div>
                        <Label>Altura (m)</Label>
                        <Input
                          type="number" step="0.01" min="0" placeholder="0.00"
                          value={altura} onChange={(e) => setAltura(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Largura (m)</Label>
                        <Input
                          type="number" step="0.01" min="0" placeholder="0.00"
                          value={largura} onChange={(e) => setLargura(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Área (m²)</Label>
                        <Input
                          value={altura && largura
                            ? (parseFloat(altura) * parseFloat(largura)).toFixed(2)
                            : ''}
                          readOnly className="bg-gray-50 font-semibold"
                        />
                      </div>
                      {campos.usaQuantidade && (
                        <div>
                          <Label>Painéis</Label>
                          <Input
                            type="number" min="1" placeholder="1"
                            value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Perfil / Estrutura: metragem linear */}
                  {campos.usaMetragem && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Metragem (m)</Label>
                        <Input
                          type="number" step="0.01" min="0" placeholder="0.00"
                          value={metragem} onChange={(e) => setMetragem(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Kit / Acessório: quantidade */}
                  {campos.usaQuantidade && !campos.usaAltura && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number" min="1" placeholder="1"
                          value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Valor personalizado + Observação */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Valor Unitário (opcional)</Label>
                      <Input
                        type="number" step="0.01" min="0"
                        placeholder={`Padrão: ${formatCurrency(produtoSelecionado.valorUnitario)}`}
                        value={valorCustom} onChange={(e) => setValorCustom(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Observação do item</Label>
                      <Input
                        placeholder="Ex: cor, espessura, modelo..."
                        value={obsItem} onChange={(e) => setObsItem(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Preview de valor */}
                  {previewSubtotal && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm text-blue-700">Subtotal calculado</span>
                      <span className="font-bold text-blue-700 text-lg">
                        {formatCurrency(previewSubtotal.subtotal)}
                      </span>
                    </div>
                  )}

                  {/* Erro de validação */}
                  {erroItem && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                      <AlertCircle className="w-4 h-4" /> {erroItem}
                    </div>
                  )}

                  <Button onClick={adicionarItem} className="w-full">
                    <PlusCircle className="w-4 h-4" />
                    Adicionar Item ao Orçamento
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* 3. Itens adicionados */}
          {itens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Itens do Orçamento
                  <span className="ml-2 text-sm font-normal text-gray-500">({itens.length} item{itens.length !== 1 ? 's' : ''})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-[1fr_2fr_auto] gap-2 text-xs font-semibold text-gray-500 uppercase pb-2 border-b mb-2">
                  <span>Componente</span>
                  <span>Seleção / Medidas</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="space-y-2">
                  {itens.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center bg-gray-50 rounded-lg px-3 py-2.5"
                    >
                      <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_CORES[item.categoria]}`}>
                          {item.categoria}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.produto}</p>
                        <p className="text-xs text-gray-500">{descreverMedida(item)} · {formatCurrency(item.valorUnitario)}/{item.unidade}</p>
                        {item.observacao && <p className="text-xs text-gray-400 italic">{item.observacao}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
                        <button
                          onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal dos itens</span>
                  <span className="font-bold">{formatCurrency(subtotalItens)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Adicionais */}
          <Card>
            <CardHeader><CardTitle className="text-base">3. Adicionais e Desconto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Instalação (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00"
                    value={instalacao} onChange={(e) => setInstalacao(e.target.value)} />
                </div>
                <div>
                  <Label>Frete (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00"
                    value={frete} onChange={(e) => setFrete(e.target.value)} />
                </div>
                <div>
                  <Label>Desconto (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00"
                    value={desconto} onChange={(e) => setDesconto(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Observações do orçamento</Label>
                <Textarea
                  placeholder="Prazo de entrega, condições de pagamento, etc."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Resumo lateral ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <OrcamentoResumo
              orcamento={orcamento}
              onSalvar={salvarOrcamento}
              salvando={salvando}
            />
          </div>
        </div>
      </div>

      <ClienteModal
        open={clienteModal}
        onClose={() => setClienteModal(false)}
        onSaved={(c) => {
          setClientes((prev) => [c, ...prev]);
          setClienteId(c.id);
          setClienteModal(false);
        }}
      />
    </div>
  );
}
