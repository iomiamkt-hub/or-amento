import { NextResponse } from 'next/server';
import { checkConnection } from '@/lib/google-sheets';

/**
 * GET /api/health
 * Verifica se as variáveis de ambiente estão configuradas e se
 * a conexão com o Google Sheets está funcionando.
 * Use este endpoint no painel da Vercel para diagnosticar problemas.
 */
export async function GET() {
  const envCheck = {
    GOOGLE_SHEETS_ID: !!process.env.GOOGLE_SHEETS_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    // Não expõe o valor da chave — apenas confirma que começa corretamente
    GOOGLE_PRIVATE_KEY_VALID_FORMAT:
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').includes('BEGIN PRIVATE KEY') ?? false,
  };

  const allEnvOk = Object.values(envCheck).every(Boolean);

  if (!allEnvOk) {
    return NextResponse.json(
      {
        ok: false,
        stage: 'env_vars',
        env: envCheck,
        message: 'Variáveis de ambiente não configuradas. Configure-as no painel da Vercel.',
      },
      { status: 503 }
    );
  }

  const sheetsCheck = await checkConnection();

  return NextResponse.json(
    {
      ok: sheetsCheck.ok,
      stage: sheetsCheck.ok ? 'all_ok' : 'google_sheets_auth',
      env: envCheck,
      sheets: {
        connected: sheetsCheck.ok,
        spreadsheetTitle: sheetsCheck.spreadsheetTitle,
        error: sheetsCheck.error,
      },
      message: sheetsCheck.ok
        ? `Tudo funcionando. Planilha: "${sheetsCheck.spreadsheetTitle}"`
        : `Erro na autenticação com Google Sheets: ${sheetsCheck.error}`,
    },
    { status: sheetsCheck.ok ? 200 : 503 }
  );
}
