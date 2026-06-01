import { google } from 'googleapis';
import type { Cliente, Produto, Orcamento } from '@/types';
import { normalizarCategoria, normalizarUnidade, normalizarAtivo } from './calc';
import { withCache } from './sheets-cache';

// ─── Auth (singleton por instância serverless) ────────────────────────────────

let _sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getPrivateKey(): string {
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  if (!raw) throw new Error('[Sheets] GOOGLE_PRIVATE_KEY não configurada');
  // Suporta três formatos possíveis de como a Vercel entrega a variável:
  // 1. Chave com quebras de linha reais  2. \n literal  3. \\n duplo-escapado
  return raw
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim();
}

function validateEnv() {
  const missing: string[] = [];
  if (!process.env.GOOGLE_SHEETS_ID) missing.push('GOOGLE_SHEETS_ID');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!process.env.GOOGLE_PRIVATE_KEY) missing.push('GOOGLE_PRIVATE_KEY');
  if (missing.length > 0) {
    throw new Error(`[Sheets] Variáveis faltando: ${missing.join(', ')}`);
  }
}

function getSheets() {
  if (_sheetsClient) return _sheetsClient;
  validateEnv();
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: getPrivateKey(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _sheetsClient = google.sheets({ version: 'v4', auth });
  return _sheetsClient;
}

const SPREADSHEET_ID = () => {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) throw new Error('[Sheets] GOOGLE_SHEETS_ID não configurada');
  return id;
};

// ─── Produtos — com cache de 60s ─────────────────────────────────────────────

export async function getProdutos(): Promise<Produto[]> {
  return withCache('produtos', async () => {
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID(),
      // A=ID  B=Categoria  C=Produto  D=Unidade  E=Valor  F=Ativo
      range: 'PRODUTOS!A2:F',
    });
    return (res.data.values ?? [])
      .filter((row) => row[0] && row[2]) // ID e Produto obrigatórios
      .filter((row) => normalizarAtivo(String(row[5] ?? ''))) // só ativos
      .map((row) => ({
        id: String(row[0] ?? ''),
        categoria: normalizarCategoria(String(row[1] ?? '')),
        produto: String(row[2] ?? ''),
        unidade: normalizarUnidade(String(row[3] ?? 'un')),
        valorUnitario: parseFloat(String(row[4] ?? '0').replace(',', '.')) || 0,
        ativo: true,
      }));
  });
}

// ─── Clientes — com cache de 60s ─────────────────────────────────────────────

export async function getClientes(): Promise<Cliente[]> {
  return withCache('clientes', async () => {
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID(),
      range: 'CLIENTES!A2:E',
    });
    return (res.data.values ?? [])
      .filter((row) => row[0])
      .map((row) => ({
        id: String(row[0] ?? ''),
        nome: String(row[1] ?? ''),
        telefone: String(row[2] ?? ''),
        email: String(row[3] ?? ''),
        endereco: String(row[4] ?? ''),
      }));
  });
}

export async function saveCliente(cliente: Omit<Cliente, 'id'>): Promise<string> {
  const sheets = getSheets();
  const id = `CLI${Date.now()}`;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'CLIENTES!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, cliente.nome, cliente.telefone, cliente.email ?? '', cliente.endereco ?? '']],
    },
  });
  // Invalida cache de clientes após escrita
  const { cacheInvalidate } = await import('./sheets-cache');
  cacheInvalidate('clientes');
  return id;
}

// ─── Orçamentos — sem cache (dados transacionais) ─────────────────────────────

export async function getOrcamentos(): Promise<Array<{
  numero: string; data: string; cliente: string; valorTotal: number; status: string;
}>> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'ORÇAMENTOS!A2:E',
  });
  return (res.data.values ?? [])
    .filter((row) => row[0])
    .map((row) => ({
      numero: String(row[0] ?? ''),
      data: String(row[1] ?? ''),
      cliente: String(row[2] ?? ''),
      valorTotal: parseFloat(String(row[3] ?? '0').replace(',', '.')) || 0,
      status: String(row[4] ?? 'Em aberto'),
    }));
}

export async function saveOrcamento(orcamento: Orcamento): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'ORÇAMENTOS!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        orcamento.numero,
        orcamento.data,
        orcamento.cliente.nome,
        orcamento.total.toFixed(2),
        orcamento.status,
      ]],
    },
  });
}

export async function updateOrcamentoStatus(numero: string, status: string): Promise<boolean> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: 'ORÇAMENTOS!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[0] === numero);
  if (rowIndex < 0) return false;
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID(),
    range: `ORÇAMENTOS!E${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  });
  return true;
}

// ─── Inicialização das abas ───────────────────────────────────────────────────

export async function ensureSheetTabs(): Promise<{ created: string[]; existing: string[] }> {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID() });
  const existing = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? '');

  const required = ['PRODUTOS', 'CLIENTES', 'ORÇAMENTOS'];
  const headers: Record<string, string[][]> = {
    PRODUTOS: [['ID', 'Categoria', 'Produto', 'Unidade', 'Valor', 'Ativo']],
    CLIENTES: [['ID', 'Nome', 'Telefone', 'Email', 'Endereço']],
    'ORÇAMENTOS': [['Nº Orçamento', 'Data', 'Cliente', 'Valor Total', 'Status']],
  };

  const toCreate = required.filter((t) => !existing.includes(t));

  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID(),
      requestBody: {
        requests: toCreate.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    for (const title of toCreate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID(),
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: headers[title] },
      });
    }
  }

  return {
    created: toCreate,
    existing: required.filter((t) => existing.includes(t)),
  };
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkConnection(): Promise<{
  ok: boolean; error?: string; spreadsheetTitle?: string;
}> {
  try {
    validateEnv();
    const sheets = getSheets();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID(),
      fields: 'properties.title',
    });
    return { ok: true, spreadsheetTitle: meta.data.properties?.title ?? '' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
