'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatCurrency } from '@/lib/utils';
import { getConfiguracao } from '@/lib/config';
import type { Orcamento } from '@/types';
import { FileText, Download, MessageCircle } from 'lucide-react';

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
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setErroPDF(msg);
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

  const totalItens = orcamento.itens.reduce((s, i) => s + i.subtotal, 0);
  const totalAcessorios = orcamento.acessorios.reduce((s, a) => s + a.subtotal, 0);

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

          {/* Produtos */}
          {orcamento.itens.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Produtos</p>
              {orcamento.itens.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <div>
                    <p className="font-medium">{item.produto}</p>
                    {item.largura && item.altura && (
                      <p className="text-xs text-gray-500">
                        {item.largura}m × {item.altura}m = {item.area?.toFixed(2)}m²
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Qtd: {item.quantidade}</p>
                  </div>
                  <p className="font-semibold text-right">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Acessórios */}
          {orcamento.acessorios.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Acessórios</p>
              {orcamento.acessorios.map((a) => (
                <div key={a.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span>{a.nome} (×{a.quantidade})</span>
                  <span className="font-semibold">{formatCurrency(a.subtotal)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Totais */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Produtos:</span><span>{formatCurrency(totalItens)}</span>
            </div>
            {totalAcessorios > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Acessórios:</span><span>{formatCurrency(totalAcessorios)}</span>
              </div>
            )}
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

      {/* Erro do PDF */}
      {erroPDF && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          <strong>Erro ao gerar PDF:</strong> {erroPDF}
        </div>
      )}

      {/* Ações */}
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
