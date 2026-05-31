'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import OrcamentoResumo from '@/components/OrcamentoResumo';
import ClienteModal from '@/components/ClienteModal';
import type { Cliente, Produto, Acessorio, ItemOrcamento, AcessorioItem, Orcamento } from '@/types';
import { generateNumeroOrcamento, CATEGORIAS } from '@/lib/utils';
import { PlusCircle, Trash2, UserPlus } from 'lucide-react';

function today() {
  return new Date().toLocaleDateString('pt-BR');
}

export default function NovoOrcamentoPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [acessoriosDB, setAcessoriosDB] = useState<Acessorio[]>([]);

  const [clienteId, setClienteId] = useState('');
  const [clienteModal, setClienteModal] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [status] = useState<Orcamento['status']>('Em aberto');

  // Item sendo adicionado
  const [categoria, setCategoria] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [tipoCalculo, setTipoCalculo] = useState<'m2' | 'unitario'>('m2');
  const [largura, setLargura] = useState('');
  const [altura, setAltura] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [valorCustom, setValorCustom] = useState('');

  // Itens adicionados
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [acessorios, setAcessorios] = useState<AcessorioItem[]>([]);

  // Adicionais
  const [instalacao, setInstalacao] = useState('');
  const [frete, setFrete] = useState('');
  const [desconto, setDesconto] = useState('');

  // PDF/salvar
  const [salvando, setSalvando] = useState(false);
  const [numero] = useState(generateNumeroOrcamento());

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then(setClientes).catch(() => {});
    fetch('/api/sheets/produtos').then((r) => r.json()).then(setProdutos).catch(() => {});
    fetch('/api/sheets/acessorios').then((r) => r.json()).then(setAcessoriosDB).catch(() => {});
  }, []);

  const categorias = [...new Set([...CATEGORIAS, ...produtos.map((p) => p.categoria)])];
  const produtosFiltrados = produtos.filter((p) => !categoria || p.categoria === categoria);
  const produtoSelecionado = produtos.find((p) => p.id === produtoId);

  function adicionarItem() {
    if (!produtoSelecionado) return;

    const w = parseFloat(largura) || 0;
    const h = parseFloat(altura) || 0;
    const area = tipoCalculo === 'm2' ? w * h : 0;
    const qtd = parseFloat(quantidade) || 1;
    const unitario = valorCustom ? parseFloat(valorCustom) : produtoSelecionado.valorUnitario;
    const subtotal = tipoCalculo === 'm2' ? area * unitario * qtd : qtd * unitario;

    const item: ItemOrcamento = {
      id: `item-${Date.now()}`,
      produtoId: produtoSelecionado.id,
      produto: produtoSelecionado.produto,
      categoria: produtoSelecionado.categoria,
      largura: tipoCalculo === 'm2' ? w : undefined,
      altura: tipoCalculo === 'm2' ? h : undefined,
      area: tipoCalculo === 'm2' ? area : undefined,
      quantidade: qtd,
      valorUnitario: unitario,
      subtotal,
      tipoCalculo,
    };

    setItens((prev) => [...prev, item]);
    setProdutoId('');
    setLargura('');
    setAltura('');
    setQuantidade('1');
    setValorCustom('');
  }

  function adicionarAcessorio(ac: Acessorio) {
    const existe = acessorios.find((a) => a.id === ac.id);
    if (existe) {
      setAcessorios((prev) => prev.map((a) =>
        a.id === ac.id ? { ...a, quantidade: a.quantidade + 1, subtotal: (a.quantidade + 1) * a.valor } : a
      ));
    } else {
      setAcessorios((prev) => [...prev, { id: ac.id, nome: ac.nome, quantidade: 1, valor: ac.valor, subtotal: ac.valor }]);
    }
  }

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);

  const subtotalItens = itens.reduce((s, i) => s + i.subtotal, 0);
  const subtotalAcessorios = acessorios.reduce((s, a) => s + a.subtotal, 0);
  const instVal = parseFloat(instalacao) || 0;
  const freteVal = parseFloat(frete) || 0;
  const descontoVal = parseFloat(desconto) || 0;
  const subtotal = subtotalItens + subtotalAcessorios + instVal + freteVal;
  const total = subtotal - descontoVal;

  const orcamento: Orcamento = {
    numero,
    data: today(),
    clienteId,
    cliente: clienteSelecionado ?? { id: '', nome: 'Cliente não selecionado', telefone: '' },
    itens,
    acessorios,
    instalacao: instVal,
    frete: freteVal,
    desconto: descontoVal,
    subtotal,
    total,
    status,
    observacoes,
    validade: 15,
  };

  async function salvarOrcamento() {
    if (!clienteId) { alert('Selecione um cliente'); return; }
    if (itens.length === 0) { alert('Adicione pelo menos um item'); return; }
    setSalvando(true);
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orcamento),
      });
      if (!res.ok) throw new Error();
      alert(`Orçamento ${numero} salvo com sucesso!`);
    } catch {
      alert('Erro ao salvar orçamento');
    } finally {
      setSalvando(false);
    }
  }

  const area = tipoCalculo === 'm2' && largura && altura
    ? (parseFloat(largura) * parseFloat(altura)).toFixed(2)
    : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Novo Orçamento</h1>
        <p className="text-gray-500 text-sm mt-1">Nº {numero} · {today()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">

          {/* Cliente */}
          <Card>
            <CardHeader><CardTitle className="text-base">1. Selecionar Cliente</CardTitle></CardHeader>
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

          {/* Produto */}
          <Card>
            <CardHeader><CardTitle className="text-base">2. Adicionar Produto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={(v) => { setCategoria(v); setProdutoId(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Produto</Label>
                  <Select value={produtoId} onValueChange={setProdutoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosFiltrados.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.produto}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {produtoSelecionado && (
                <>
                  <div>
                    <Label>Tipo de Cálculo</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        type="button"
                        variant={tipoCalculo === 'm2' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTipoCalculo('m2')}
                      >
                        Por m²
                      </Button>
                      <Button
                        type="button"
                        variant={tipoCalculo === 'unitario' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTipoCalculo('unitario')}
                      >
                        Unitário
                      </Button>
                    </div>
                  </div>

                  {tipoCalculo === 'm2' ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Largura (m)</Label>
                        <Input type="number" step="0.01" placeholder="0.00" value={largura} onChange={(e) => setLargura(e.target.value)} />
                      </div>
                      <div>
                        <Label>Altura (m)</Label>
                        <Input type="number" step="0.01" placeholder="0.00" value={altura} onChange={(e) => setAltura(e.target.value)} />
                      </div>
                      <div>
                        <Label>Área (m²)</Label>
                        <Input value={area ?? ''} readOnly className="bg-gray-50" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Quantidade</Label>
                      <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Valor Unitário (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={produtoSelecionado.valorUnitario.toString()}
                        value={valorCustom}
                        onChange={(e) => setValorCustom(e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Padrão: R$ {produtoSelecionado.valorUnitario}</p>
                    </div>
                    {tipoCalculo === 'm2' && (
                      <div>
                        <Label>Quantidade</Label>
                        <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <Button onClick={adicionarItem} className="w-full">
                    <PlusCircle className="w-4 h-4" />
                    Adicionar Item
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Itens adicionados */}
          {itens.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Itens do Orçamento</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.produto}</p>
                        <p className="text-xs text-gray-500">
                          {item.tipoCalculo === 'm2'
                            ? `${item.largura}m × ${item.altura}m = ${item.area?.toFixed(2)}m² × R$${item.valorUnitario} × ${item.quantidade}`
                            : `${item.quantidade} un × R$${item.valorUnitario}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">R$ {item.subtotal.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setItens((prev) => prev.filter((i) => i.id !== item.id))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acessórios */}
          {acessoriosDB.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">3. Acessórios (opcional)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {acessoriosDB.map((ac) => {
                    const adicionado = acessorios.find((a) => a.id === ac.id);
                    return (
                      <div key={ac.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium">{ac.nome}</p>
                          <p className="text-xs text-gray-500">R$ {ac.valor.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {adicionado && (
                            <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                              ×{adicionado.quantidade}
                            </span>
                          )}
                          <Button size="sm" variant="outline" onClick={() => adicionarAcessorio(ac)}>
                            <PlusCircle className="w-3.5 h-3.5" />
                          </Button>
                          {adicionado && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => setAcessorios((prev) => prev.filter((a) => a.id !== ac.id))}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adicionais */}
          <Card>
            <CardHeader><CardTitle className="text-base">4. Adicionais e Descontos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Instalação (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={instalacao} onChange={(e) => setInstalacao(e.target.value)} />
                </div>
                <div>
                  <Label>Frete (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={frete} onChange={(e) => setFrete(e.target.value)} />
                </div>
                <div>
                  <Label>Desconto (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <Label>Observações</Label>
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

        {/* Resumo lateral */}
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
