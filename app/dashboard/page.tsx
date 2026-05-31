'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, STATUS_COLORS } from '@/lib/utils';
import { FileText, Users, TrendingUp, CheckCircle, PlusCircle, RefreshCw } from 'lucide-react';

interface OrcamentoRow {
  numero: string; data: string; cliente: string; valorTotal: number; status: string;
}

export default function Dashboard() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/orcamentos');
      if (res.ok) setOrcamentos(await res.json());
    } catch {}
    setLoading(false);
  }

  const total = orcamentos.length;
  const aprovados = orcamentos.filter((o) => o.status === 'Aprovado');
  const taxaAprovacao = total > 0 ? Math.round((aprovados.length / total) * 100) : 0;
  const valorVendido = aprovados.reduce((s, o) => s + o.valorTotal, 0);

  const hoje = new Date();
  const mesAtual = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
  const orcamentosMes = orcamentos.filter((o) => o.data?.includes(mesAtual)).length;

  const recentes = [...orcamentos].reverse().slice(0, 8);

  const stats = [
    { label: 'Total Orçamentos', value: total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Valor Vendido', value: formatCurrency(valorVendido), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Orçamentos do Mês', value: orcamentosMes, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Taxa de Aprovação', value: `${taxaAprovacao}%`, icon: CheckCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral do sistema de orçamentos</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{loading ? '—' : stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabela Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : recentes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum orçamento encontrado.</p>
              <Link href="/orcamentos/novo">
                <Button className="mt-4">Criar Primeiro Orçamento</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Nº</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes.map((o) => (
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
