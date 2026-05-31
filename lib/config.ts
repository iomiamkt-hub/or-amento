import type { ConfiguracaoEmpresa } from '@/types';

const CONFIG_KEY = 'empresa_config';

export function getConfiguracao(): ConfiguracaoEmpresa {
  if (typeof window === 'undefined') {
    return getDefaultConfig();
  }
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return { ...getDefaultConfig(), ...JSON.parse(saved) };
  } catch {}
  return getDefaultConfig();
}

export function saveConfiguracao(config: ConfiguracaoEmpresa): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

export function getDefaultConfig(): ConfiguracaoEmpresa {
  return {
    nomeEmpresa: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Vidraçaria Premium',
    telefone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '(11) 99999-9999',
    whatsapp: process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || '5511999999999',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'contato@empresa.com',
    endereco: '',
    logoUrl: '',
    rodapePDF: 'Orçamento válido por 15 dias. Agradecemos sua preferência!',
    validadeOrcamento: 15,
    corPrimaria: '#0f77cf',
  };
}
