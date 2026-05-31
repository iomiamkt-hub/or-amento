'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getConfiguracao, saveConfiguracao } from '@/lib/config';
import type { ConfiguracaoEmpresa } from '@/types';
import { Settings, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<ConfiguracaoEmpresa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [inicializando, setInicializando] = useState(false);
  const [msgInit, setMsgInit] = useState('');

  useEffect(() => {
    setConfig(getConfiguracao());
  }, []);

  function handleChange(field: keyof ConfiguracaoEmpresa, value: string | number) {
    setConfig((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function salvar() {
    if (!config) return;
    setSalvando(true);
    saveConfiguracao(config);
    setTimeout(() => {
      setSalvando(false);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    }, 500);
  }

  async function inicializarPlanilha() {
    setInicializando(true);
    setMsgInit('');
    try {
      const res = await fetch('/api/sheets/init', { method: 'POST' });
      const data = await res.json();
      setMsgInit(res.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    } catch {
      setMsgInit('✗ Erro ao conectar com a planilha');
    }
    setInicializando(false);
  }

  if (!config) return null;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Personalize o sistema sem alterar o código</p>
      </div>

      <div className="space-y-6">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" /> Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome da Empresa</Label>
              <Input
                value={config.nomeEmpresa}
                onChange={(e) => handleChange('nomeEmpresa', e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={config.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label>WhatsApp (com DDI)</Label>
                <Input
                  value={config.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="5511999999999"
                />
              </div>
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={config.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                value={config.endereco ?? ''}
                onChange={(e) => handleChange('endereco', e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
            <div>
              <Label>URL do Logo (opcional)</Label>
              <Input
                value={config.logoUrl ?? ''}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-gray-400 mt-1">URL pública de uma imagem PNG/JPG</p>
            </div>
          </CardContent>
        </Card>

        {/* PDF */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações do PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Texto do Rodapé</Label>
              <Textarea
                value={config.rodapePDF}
                onChange={(e) => handleChange('rodapePDF', e.target.value)}
                placeholder="Orçamento válido por 15 dias..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Validade do Orçamento (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.validadeOrcamento}
                  onChange={(e) => handleChange('validadeOrcamento', parseInt(e.target.value) || 15)}
                />
              </div>
              <div>
                <Label>Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.corPrimaria}
                    onChange={(e) => handleChange('corPrimaria', e.target.value)}
                    className="h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.corPrimaria}
                    onChange={(e) => handleChange('corPrimaria', e.target.value)}
                    placeholder="#0f77cf"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Sheets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Sheets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Configure as variáveis de ambiente no arquivo <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code> para conectar com o Google Sheets.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-1">
              <p>GOOGLE_SHEETS_ID=sua_planilha_id</p>
              <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=conta@projeto.iam.gserviceaccount.com</p>
              <p>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."</p>
            </div>
            <Button
              variant="outline"
              onClick={inicializarPlanilha}
              disabled={inicializando}
            >
              <RefreshCw className={`w-4 h-4 ${inicializando ? 'animate-spin' : ''}`} />
              {inicializando ? 'Inicializando...' : 'Verificar/Criar Abas da Planilha'}
            </Button>
            {msgInit && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${msgInit.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msgInit.startsWith('✓') ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {msgInit}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salvar */}
        <div className="flex gap-3">
          <Button onClick={salvar} disabled={salvando} size="lg">
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
          {salvo && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Configurações salvas!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
