# OrcaVidro — Sistema de Orçamentos para Vidraçaria

Sistema web completo para automação de orçamentos de vidraçaria, esquadrias de alumínio, box de banheiro, sacadas, espelhos e mais.

## Funcionalidades

- **Dashboard** — KPIs: total de orçamentos, valor vendido, orçamentos do mês, taxa de aprovação
- **Orçamentos** — Criação rápida com cálculo automático (m² ou unitário), lista com filtros e atualização de status
- **Clientes** — Cadastro completo com busca
- **Geração de PDF** — PDF profissional com logo, dados do cliente, tabela de itens, totais e rodapé
- **WhatsApp** — Envio de mensagem pré-formatada com dados do orçamento
- **Google Sheets** — Banco de dados na nuvem (produtos, acessórios, clientes, orçamentos)
- **Configurações** — Personalização da empresa sem alterar código

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 |
| Backend | Next.js API Routes |
| Banco de dados | Google Sheets API |
| PDF | pdf-lib |
| UI Components | Radix UI + CVA |
| Deploy | Vercel |

## Instalação

```bash
# 1. Clone o repositório
git clone <repo-url>
cd or-amento

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Rode em desenvolvimento
npm run dev
```

## Configuração do Google Sheets

### 1. Criar Service Account

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto ou selecione um existente
3. Ative a **Google Sheets API**
4. Vá em **IAM & Admin → Service Accounts → Criar**
5. Baixe o arquivo JSON de credenciais

### 2. Criar a Planilha

1. Crie uma nova Google Sheets
2. Compartilhe com o e-mail da Service Account (permissão de Editor)
3. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/**SEU_ID**/edit`

### 3. Variáveis de Ambiente

```env
GOOGLE_SHEETS_ID=seu_id_aqui
GOOGLE_SERVICE_ACCOUNT_EMAIL=conta@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Inicializar Abas

Acesse **Configurações → Verificar/Criar Abas da Planilha** para criar as abas automaticamente.

### Estrutura da Planilha

**Aba PRODUTOS**
| ID | Categoria | Produto | Unidade | Valor Unitário | Observação |
|----|-----------|---------|---------|----------------|------------|
| BOX001 | Box para Banheiro | Box Articulado 8mm | m² | 350 | ... |

**Aba ACESSÓRIOS**
| ID | Nome | Valor |
|----|------|-------|
| ACE001 | Puxador Cromado | 85 |

**Aba CLIENTES** — Preenchida automaticamente pelo sistema

**Aba ORÇAMENTOS** — Preenchida automaticamente pelo sistema

## Deploy na Vercel

```bash
npm install -g vercel
vercel --prod
```

Configure as mesmas variáveis de ambiente no painel da Vercel.

## Estrutura do Projeto

```
├── app/
│   ├── api/
│   │   ├── clientes/          # CRUD clientes
│   │   ├── orcamentos/        # CRUD orçamentos + status
│   │   ├── pdf/               # Geração de PDF
│   │   └── sheets/            # Produtos, Acessórios, Init
│   ├── dashboard/             # Página principal com KPIs
│   ├── clientes/              # Lista e cadastro de clientes
│   ├── orcamentos/
│   │   ├── novo/              # Criação de orçamento
│   │   └── page.tsx           # Lista de orçamentos
│   └── configuracoes/         # Config da empresa
├── components/
│   ├── ui/                    # Componentes base (Button, Input, etc.)
│   ├── Sidebar.tsx
│   ├── ClienteModal.tsx
│   └── OrcamentoResumo.tsx    # Resumo + ações PDF/WhatsApp
├── lib/
│   ├── google-sheets.ts       # Integração Google Sheets
│   ├── pdf-generator.ts       # Geração de PDF com pdf-lib
│   ├── config.ts              # Config da empresa (localStorage)
│   └── utils.ts
└── types/index.ts             # Tipos TypeScript
```
