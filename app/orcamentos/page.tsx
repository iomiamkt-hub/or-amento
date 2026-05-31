'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, STATUS_COLORS } from '@/lib/utils';
import type { StatusOrcamento } from '@/types';
import { FileText, PlusCircle, Search, RefreshCw } from 'lucide-react';

interface OrcamentoRow {
  numero: string; data: string; cliente: string; valorTotal: number; status: string;
}

const STATUS_OPTIONS: StatusOrcamento[] = ['Em aberto', 'Aprovado', 'Reprovado', 'Em negociação'];

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/orcamentos');
      if (res.ok) setOrcamentos(await res.json());
    } catch {}
    setLoading(false);
  }

  async function atualizarStatus(numero: string, status: string) {
    try {
      await fetch(`/api/orcamentos/${encodeURIComponent(numero)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOrcamentos((prev) => prev.map((o) => o.numero === numero ? { ...o, status } : o));
    } catch {
      alert('Erro ao atualizar status');
    }
  }

  const filtrados = orcamentos.filter((o) => {
    const matchBusca =
      o.numero.toLowerCase().includes(busca.toLowerCase()) ||
      o.cliente.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || o.status === filtroStatus;
    return matchBusca && matchStatus;
  }).reverse();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">{orcamentos.length} orçamento(s) no total</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Link href="/orcamentos/novo">
            <Button>
              <PlusCircle className="w-4 h-4" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Buscar por nº ou cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum orçamento encontrado.</p>
              <Link href="/orcamentos/novo">
                <Button className="mt-4">Criar Orçamento</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Nº Orçamento</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Valor Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((o) => (
                    <tr key={o.numero} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-600">{o.numero}</td>
                      <td className="py-3 px-4 text-gray-600">{o.data}</td>
                      <td className="py-3 px-4 font-medium">{o.cliente}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(o.valorTotal)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Select value={o.status} onValueChange={(v) => atualizarStatus(o.numero, v)}>
                          <SelectTrigger className="h-7 text-xs w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
