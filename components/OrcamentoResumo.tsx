'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatCurrency } from '@/lib/utils';
import { descreverMedida } from '@/lib/calc';
import { getConfiguracao } from '@/lib/config';
import type { Orcamento, CategoriaType } from '@/types';
import { FileText, Download, MessageCircle } from 'lucide-react';

const BADGE_CORES: Record<CategoriaType, string> = {
  Vidro: 'bg-blue-100 text-blue-700',
  Kit: 'bg-purple-100 text-purple-700',
  Perfil: 'bg-orange-100 text-orange-700',
  Estrutura: 'bg-red-100 text-red-700',
  Acessorio: 'bg-gray-100 text-gray-700',
};

interface Props {
  orcamento: Orcamento;
  onSalvar?: () => void;
  salvando?: boolean;
}

export default function OrcamentoResumo({ orcamento, onSalvar, salvando }: Props) {
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [erroPDF, setErroPDF] = useState('');

  async function gerarPDF(download = true) {
    setGerandoPDF(true);
    setErroPDF('');
    try {
      const config = getConfiguracao();
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamento, config }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `orcamento-${orcamento.numero}.pdf`;
        a.click();
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      setErroPDF(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setGerandoPDF(false);
    }
  }

  function enviarWhatsApp() {
    const config = getConfiguracao();
    const msg = encodeURIComponent(
      `Olá, ${orcamento.cliente.nome}!\n\nSegue seu orçamento nº ${orcamento.numero}.\n\nValor total: ${formatCurrency(orcamento.total)}\n\nValidade: ${config.validadeOrcamento || 15} dias.\n\nQualquer dúvida estou à disposição!`
    );
    const numero = orcamento.cliente.telefone.replace(/\D/g, '');
    const numeroCompleto = numero.startsWith('55') ? numero : `55${numero}`;
    window.open(`https://wa.me/${numeroCompleto}?text=${msg}`, '_blank');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do Orçamento</CardTitle>
          <p className="text-sm text-gray-500">Nº {orcamento.numero} · {orcamento.data}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Cliente */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-semibold text-sm">{orcamento.cliente.nome}</p>
            <p className="text-xs text-gray-600">{orcamento.cliente.telefone}</p>
            {orcamento.cliente.endereco && (
              <p className="text-xs text-gray-600">{orcamento.cliente.endereco}</p>
            )}
          </div>

          {/* Itens */}
          {orcamento.itens.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase">Itens</p>
              {orcamento.itens.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm py-1.5 border-b border-gray-100 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-px rounded-full font-semibold ${BADGE_CORES[item.categoria]}`}>
                        {item.categoria}
                      </span>
                      <span className="font-medium truncate">{item.produto}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{descreverMedida(item)}</p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totais */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal itens:</span>
              <span>{formatCurrency(orcamento.itens.reduce((s, i) => s + i.subtotal, 0))}</span>
            </div>
            {orcamento.instalacao > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Instalação:</span><span>{formatCurrency(orcamento.instalacao)}</span>
              </div>
            )}
            {orcamento.frete > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Frete:</span><span>{formatCurrency(orcamento.frete)}</span>
              </div>
            )}
            {orcamento.desconto > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto:</span><span>-{formatCurrency(orcamento.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(orcamento.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {erroPDF && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          <strong>Erro ao gerar PDF:</strong> {erroPDF}
        </div>
      )}

      <div className="space-y-2">
        {onSalvar && (
          <Button onClick={onSalvar} disabled={salvando} className="w-full" size="lg">
            {salvando ? 'Salvando...' : 'Salvar Orçamento'}
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={() => gerarPDF(false)} disabled={gerandoPDF}>
          <FileText className="w-4 h-4" />
          {gerandoPDF ? 'Gerando...' : 'Visualizar PDF'}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => gerarPDF(true)} disabled={gerandoPDF}>
          <Download className="w-4 h-4" />
          Baixar PDF
        </Button>
        <Button variant="success" className="w-full" onClick={enviarWhatsApp}>
          <MessageCircle className="w-4 h-4" />
          Enviar por WhatsApp
        </Button>
      </div>
    </div>
  );
}
