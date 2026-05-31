import { google } from 'googleapis';
import type { Cliente, Produto, Acessorio, Orcamento } from '@/types';

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

// ─── Produtos ───────────────────────────────────────────────────────────────

export async function getProdutos(): Promise<Produto[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'PRODUTOS!A2:F',
  });
  return (res.data.values ?? []).map((row) => ({
    id: row[0] ?? '',
    categoria: row[1] ?? '',
    produto: row[2] ?? '',
    unidade: (row[3] ?? 'm²') as Produto['unidade'],
    valorUnitario: parseFloat(row[4] ?? '0') || 0,
    observacao: row[5] ?? '',
  }));
}

// ─── Acessórios ─────────────────────────────────────────────────────────────

export async function getAcessorios(): Promise<Acessorio[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'ACESSÓRIOS!A2:C',
  });
  return (res.data.values ?? []).map((row) => ({
    id: row[0] ?? '',
    nome: row[1] ?? '',
    valor: parseFloat(row[2] ?? '0') || 0,
  }));
}

// ─── Clientes ────────────────────────────────────────────────────────────────

export async function getClientes(): Promise<Cliente[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CLIENTES!A2:E',
  });
  return (res.data.values ?? []).map((row) => ({
    id: row[0] ?? '',
    nome: row[1] ?? '',
    telefone: row[2] ?? '',
    email: row[3] ?? '',
    endereco: row[4] ?? '',
  }));
}

export async function saveCliente(cliente: Omit<Cliente, 'id'>): Promise<string> {
  const sheets = getSheets();
  const id = `CLI${Date.now()}`;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CLIENTES!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, cliente.nome, cliente.telefone, cliente.email ?? '', cliente.endereco ?? '']],
    },
  });
  return id;
}

// ─── Orçamentos ──────────────────────────────────────────────────────────────

export async function getOrcamentos(): Promise<Array<{
  numero: string; data: string; cliente: string; valorTotal: number; status: string;
}>> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'ORÇAMENTOS!A2:E',
  });
  return (res.data.values ?? []).map((row) => ({
    numero: row[0] ?? '',
    data: row[1] ?? '',
    cliente: row[2] ?? '',
    valorTotal: parseFloat(row[3] ?? '0') || 0,
    status: row[4] ?? 'Em aberto',
  }));
}

export async function saveOrcamento(orcamento: Orcamento): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'ORÇAMENTOS!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        orcamento.numero,
        orcamento.data,
        orcamento.cliente.nome,
        orcamento.total.toString(),
        orcamento.status,
      ]],
    },
  });
}

export async function updateOrcamentoStatus(numero: string, status: string): Promise<void> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'ORÇAMENTOS!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[0] === numero);
  if (rowIndex < 0) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `ORÇAMENTOS!E${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function ensureSheetTabs(): Promise<void> {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? '');
  const required = ['PRODUTOS', 'ACESSÓRIOS', 'CLIENTES', 'ORÇAMENTOS'];
  const headers: Record<string, string[][]> = {
    PRODUTOS: [['ID', 'Categoria', 'Produto', 'Unidade', 'Valor Unitário', 'Observação']],
    'ACESSÓRIOS': [['ID', 'Nome', 'Valor']],
    CLIENTES: [['ID', 'Nome', 'Telefone', 'Email', 'Endereço']],
    'ORÇAMENTOS': [['Nº Orçamento', 'Data', 'Cliente', 'Valor Total', 'Status']],
  };
  const toCreate = required.filter((t) => !existing.includes(t));
  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: toCreate.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    for (const title of toCreate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: headers[title] },
      });
    }
  }
}
