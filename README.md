# CRM Zenius

> CRM comercial SaaS multitenant com Kanban, Painel 360, gestão de metas e automações de vendas.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Install Wizard](#install-wizard)
- [Instalação e execução local](#instalação-e-execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Banco de dados](#banco-de-dados)
- [Oportunidades Inteligentes](#oportunidades-inteligentes)
- [Roles e permissões](#roles-e-permissões)
- [Deploy](#deploy)

---

## Sobre o projeto

O **CRM Zenius** é uma plataforma de gestão comercial voltada para equipes de vendas. Cada empresa tem seu próprio ambiente isolado (multitenant), com controle de acesso por papel (RBAC) e dados protegidos via Row Level Security no Supabase.

**Principais funcionalidades:**

- 📋 **Pipeline Kanban** — arrastar e soltar leads entre estágios personalizáveis
- 📊 **Dashboard** — KPIs em tempo real de faturamento, conversão e carteira
- 🔭 **Painel 360** — visão gerencial com ranking de vendedores, score e metas
- 🎯 **Metas** — metas individuais e globais com acompanhamento de período
- ✅ **Tarefas** — gestão de atividades vinculadas a leads
- 🤖 **IA integrada** — assistente SDR, geração de e-mails e análise de deals
- 👥 **Multiusuário** — admin, vendedor e usuário com permissões distintas
- 🔮 **Oportunidades Inteligentes** — scoring determinístico de leads com bandas hot/warm/cold/risk/upsell
- 🎯 **Deal Detail View** — pipeline dinâmico, status em tempo real e timeline com paginação

---

## Pré-requisitos

- [Node.js](https://nodejs.org) 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (para deploy)

---

## Instalação e execução local

```bash
# 1. Clone o repositório
git clone https://github.com/JulianoSalles2024/CRM-Fity.git
cd CRM-Fity

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves (veja seção abaixo)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em: `http://localhost:3002` (Vite) — a API Express roda em `http://localhost:3000`.

> O comando `npm run dev` inicia ambos os servidores em paralelo via `concurrently`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Onde obter | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Painel Supabase → Settings → API | URL do projeto (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Painel Supabase → Settings → API | Chave anon pública (frontend) |
| `SUPABASE_URL` | Painel Supabase → Settings → API | URL do projeto (servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel Supabase → Settings → API | Service role key (servidor) |
| `ENCRYPTION_KEY` | Gere uma string aleatória | Criptografia de credenciais de IA |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | Opcional |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Opcional |

> ⚠️ **Nunca commite o `.env.local`** — ele já está no `.gitignore`.

---

## Estrutura do projeto

```
CRM-Fity/
├── index.html                  # Entry point do Vite
├── index.tsx                   # Bootstrap React
├── App.tsx                     # Root da aplicação, estado global
├── server.ts                   # Servidor Express (API local, porta 3000)
├── vite.config.ts              # Config Vite (porta 3002, proxy → 3000)
│
├── api/                        # Serverless functions (Vercel) / rotas Express
│   ├── ai/
│   │   ├── credentials.ts      # CRUD de credenciais de IA
│   │   ├── generate.ts         # Geração de texto com IA
│   │   └── test-connection.ts
│   ├── install/
│   │   └── migrate.ts
│   └── opportunities/
│       ├── analyze.ts          # Scoring determinístico de leads
│       └── list.ts             # Listagem de oportunidades por empresa
│
├── components/                 # Componentes React
│   ├── LeadDetailSlideover.tsx # Deal Detail View (pipeline dinâmico, timeline paginada)
│   ├── InboxView.tsx           # Inbox com modal de Oportunidades Inteligentes
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── KanbanBoard.tsx
│   ├── Painel360.tsx
│   ├── SellerDetail360.tsx
│   └── ...
│
├── src/
│   ├── app/
│   │   └── AppRouter.tsx       # Roteamento e guards de role
│   ├── components/
│   │   └── opportunities/
│   │       └── PredictiveOpportunitiesModal.tsx  # Modal de oportunidades inteligentes
│   ├── features/
│   │   ├── auth/               # AuthContext, AuthGate, AuthPage
│   │   ├── ai/                 # Estado e hooks de IA
│   │   ├── ai-credentials/     # Gestão de provedores de IA
│   │   └── profile/            # Perfil do usuário
│   ├── hooks/
│   │   ├── useBoards.ts        # Boards e estágios do Kanban
│   │   ├── useLeads.ts         # CRUD de leads
│   │   ├── useTasks.ts         # CRUD de tarefas
│   │   ├── useActivities.ts    # Histórico de atividades
│   │   ├── useUsers.ts         # Membros da equipe
│   │   ├── useGoals.ts         # Metas
│   │   ├── useActiveGoal.ts    # Meta ativa do vendedor
│   │   └── useOpportunityScores.ts  # Scores de oportunidades
│   ├── lib/
│   │   ├── supabase.ts         # Client Supabase
│   │   ├── permissions.ts      # RBAC — AppRole e Permissions
│   │   ├── mappers.ts          # snake_case ↔ camelCase
│   │   └── leadStatus.ts       # Status derivado de lead
│   └── types.ts                # Tipos principais (Lead, Board, User…)
│
└── supabase/
    └── migrations/             # Histórico de migrations do Supabase
        ├── 001_init.sql
        ├── 002_handle_new_user_trigger.sql
        ├── 003_fix_invite_trigger.sql
        └── 004_lead_opportunity_scores.sql   # Tabela de scoring de oportunidades
```

---

## Banco de dados

O projeto usa **Supabase** (PostgreSQL) com **Row Level Security (RLS)** ativo em todas as tabelas.

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `profiles` | Usuários com `role`, `company_id`, `is_active` |
| `leads` | Leads com `owner_id`, `column_id`, `won_at`, `is_archived` |
| `boards` | Pipelines de venda por empresa |
| `board_stages` | Estágios do Kanban vinculados ao lifecycle |
| `tasks` | Tarefas vinculadas a leads |
| `activities` | Histórico de atividades |
| `goals` | Metas individuais e globais por período |
| `sales` | Vendas fechadas (faturamento por banco/tipo) |
| `lead_opportunity_scores` | Scores de conversão, upsell e risco por lead |

### Aplicar migrations

Execute os arquivos de `supabase/migrations/` **em ordem** no SQL Editor do Supabase:

```
001 → 002 → 003 → 004
```

### RPCs disponíveis

| RPC | Descrição |
|---|---|
| `validate_invite(p_token)` | Valida token de convite |
| `admin_block_user(p_user_id)` | Bloqueia usuário |
| `admin_unblock_user(p_user_id)` | Desbloqueia usuário |

---

## Install Wizard

O CRM Zenius possui um assistente de instalação guiado que configura toda a infraestrutura automaticamente — sem precisar editar arquivos manualmente.

### Como acessar

Após fazer fork e deploy na Vercel, acesse:

```
https://seu-dominio.vercel.app/install
```

### Fluxo de instalação (4 etapas)

```
/install/start     → Dados do administrador (nome, e-mail, senha)
/install/vercel    → Token da Vercel (para configurar env vars e redeploy)
/install/supabase  → URL, Service Role Key, Anon Key e PAT do Supabase
/install/run       → Execução automática com feedback em tempo real
```

### O que o wizard faz automaticamente

| Etapa | Ação |
|---|---|
| 1 | Detecta o projeto na Vercel via token |
| 2 | Cria as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) |
| 3 | Executa as migrations no Supabase via Management API |
| 4 | Cria o usuário administrador no Supabase Auth |
| 5 | Cria o perfil do admin com `role = 'admin'` |
| 6 | Dispara redeploy automático na Vercel com as novas env vars |

### Arquivos do Install Wizard

```
src/features/install/
├── InstallRouter.tsx              # Dispatcher de rotas /install/*
├── context/InstallContext.tsx     # Estado global + guards de etapa
├── utils/installStorage.ts        # Persistência no localStorage
├── pages/
│   ├── InstallStartPage.tsx       # Etapa 1: dados do admin
│   ├── InstallVercelPage.tsx      # Etapa 2: token Vercel
│   ├── InstallSupabasePage.tsx    # Etapa 3: credenciais Supabase
│   ├── InstallRunPage.tsx         # Etapa 4: execução cinematic
│   ├── ForkInstructionsPage.tsx   # Instruções de fork
│   ├── DeployInstructionsPage.tsx # Instruções de deploy
│   └── DeployPreparationPage.tsx  # Countdown 90s pós-deploy
└── services/installService.ts     # Chamadas de API do wizard

src/server/install/
└── runMigrations.ts               # Runner de migrations via Supabase Management API

api/install/
└── migrate.ts                     # Endpoint que executa as migrations
```

### Pré-requisitos para o wizard

1. Fazer **fork** do repositório no GitHub
2. Fazer **deploy** na Vercel conectando o fork (com env vars vazias por enquanto)
3. Ter em mãos:
   - Token da Vercel (em [vercel.com/account/tokens](https://vercel.com/account/tokens))
   - URL do projeto Supabase
   - Service Role Key do Supabase
   - Anon Key do Supabase
   - Personal Access Token do Supabase (para rodar migrations)

---

## Oportunidades Inteligentes

O módulo analisa automaticamente os leads ativos e gera scores determinísticos:

| Score | Descrição |
|---|---|
| `conversion_score` | Probabilidade de fechar o negócio (0–100) |
| `upsell_score` | Potencial de venda adicional (0–100) |
| `risk_score` | Risco de perda por inatividade (0–100) |

**Bandas de prioridade:** `hot` · `warm` · `cold` · `risk` · `upsell`

Para rodar a análise, execute no console do browser (após login):

```js
const { data } = await (await import('/src/lib/supabase.ts')).supabase.auth.getSession();
const token = data.session.access_token;
const res = await fetch('/api/opportunities/analyze', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
console.log(await res.json()); // { analyzed: N, upserted: N }
```

---

## Roles e permissões

| Role (Supabase) | Exibição na UI | Acesso |
|---|---|---|
| `admin` | Admin | Acesso total — Painel 360, equipe, configurações, todos os leads |
| `seller` | Vendedor | Pipeline, leads próprios, tarefas, atividades |
| `user` | Usuário | Acesso básico limitado |

> Usuários com `is_active = false` são **bloqueados automaticamente** no login, sem acesso a nenhuma rota.

---

## Deploy

O projeto é deployado automaticamente na **Vercel** a cada push na branch `main`.

```bash
# Validar o build localmente antes de subir
npm run build
```

Configure as mesmas variáveis de ambiente do `.env.local` no painel da Vercel em **Settings → Environment Variables**.

---

<div align="center">
  <sub>© 2026 CRM Zenius. Todos os direitos reservados.</sub>
</div>
