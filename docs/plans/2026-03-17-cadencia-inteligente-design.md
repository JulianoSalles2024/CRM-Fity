# Cadência Inteligente — Design Document
**Data:** 2026-03-17
**Produto:** NextSales CRM
**Status:** Validado — pronto para implementação

---

## Visão Geral

Sistema de cadência inteligente onde a conversa WhatsApp dirige a pipeline automaticamente. O agente de IA (WF-05) monitora mensagens, detecta gatilhos configurados por estágio e move leads automaticamente ou notifica o vendedor para aprovação (Modo Híbrido).

**Três pilares:**
1. **Auto-move** — lead avança de estágio quando IA detecta gatilho na conversa
2. **Auto-playbook** — playbook é ativado automaticamente ao entrar num estágio
3. **Human gate** — estágios críticos (fechamento) exigem aprovação humana

---

## Arquitetura

### Novos campos em `board_stages`

```sql
ALTER TABLE board_stages ADD COLUMN auto_triggers jsonb DEFAULT '[]';
-- ex: [{"keyword": "quanto custa"}, {"keyword": "quero saber mais"}]

ALTER TABLE board_stages ADD COLUMN auto_playbook_id uuid REFERENCES playbooks(id) ON DELETE SET NULL;
-- playbook ativado automaticamente quando lead entra neste estágio

ALTER TABLE board_stages ADD COLUMN requires_approval boolean DEFAULT false;
-- true = notifica vendedor em vez de mover automaticamente
```

### Nova tabela `notifications`

```sql
CREATE TABLE public.notifications (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  type            text not null, -- 'stage_approval' | 'playbook_suggestion' | 'info'
  title           text not null,
  body            text,
  lead_id         uuid references public.leads(id) on delete cascade,
  metadata        jsonb default '{}',
  -- para stage_approval: { suggested_column_id, trigger_text, auto_playbook_id }
  read            boolean default false,
  created_at      timestamptz not null default now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_access" ON public.notifications
  FOR ALL USING (company_id = public.my_company_id())
  WITH CHECK (company_id = public.my_company_id());
```

### Novo endpoint `/api/ai/generate-playbook`

```typescript
// POST /api/ai/generate-playbook
// Body: { mode: 'prompt' | 'methodology', prompt?, methodology?, objective?, stageNames[] }
// Retorna: { name: string, steps: PlaybookStep[] }

// Usa claude-sonnet-4-6 via Anthropic SDK
// System prompt inclui: contexto da empresa, estágios disponíveis
// Structured output: JSON com name + steps[]
```

---

## Fluxo End-to-End

```
WhatsApp Lead
    │
    ▼
Evolution API → WF-01 V9 → salva conversation
    │
    ▼
WF-05 V4 (NOVO)
    ├── Busca stage: auto_triggers[], requires_approval, auto_playbook_id
    ├── Analisa texto vs gatilhos
    └── Gera resposta com stage_prompt (fluxo atual mantido)
         │
    gatilho detectado?
    ├── NÃO → responde normalmente (fluxo atual)
    └── SIM →
         requires_approval?
         ├── false → AUTO-MOVE
         │    UPDATE leads SET column_id = next_stage
         │    SET active_playbook = auto_playbook_id
         │    → Supabase Realtime → KanbanBoard atualiza
         │    → Gera tasks do playbook (dia 1, 3, 5...)
         │    → WF-03 executa cadência de mensagens
         │
         └── true → HUMAN GATE
              INSERT notifications {
                type: 'stage_approval',
                lead_id, suggested_column_id,
                trigger_text, auto_playbook_id
              }
              → CRM mostra alerta ao vendedor
              → Vendedor clica "Aprovar e Mover"
              → Mesmo fluxo do AUTO-MOVE
```

---

## Componentes Frontend

### 1. Nova aba "Cadência" no `PipelineAIModal.tsx`

Para cada estágio da pipeline, o admin configura:
- **Playbook automático ao entrar** — dropdown com playbooks cadastrados
- **Gatilhos de avanço** — tags de palavras/frases que a IA detecta
- **Modo** — "Mover automaticamente" ou "Notificar vendedor para aprovar"

Estágios de fechamento (`requires_approval = true` fixo) exibem aviso visual de bloqueio.

### 2. `CreateEditPlaybookModal` — versão AI

Duas abas na criação:
- **Gerar com IA**
  - Modo "Prompt livre": textarea descritivo → Claude gera playbook completo
  - Modo "Metodologia": escolha BANT/SPIN/MEDDIC/GPCT + objetivo → Claude adapta
  - Resultado editável passo a passo antes de salvar
- **Criar Manual** — formulário atual preservado

### 3. Componente `NotificationBell` (novo)

- Ícone de sino no header com badge de contagem
- Drawer lateral com lista de notificações
- Card de `stage_approval` com botões "Aprovar e Mover" / "Ignorar"
- Supabase Realtime subscription em `notifications`

---

## Plano de Implementação — 4 Fases

### Fase 1 — Fundação de dados (migration + schema)
- Migration: `auto_triggers`, `auto_playbook_id`, `requires_approval` em `board_stages`
- Migration: tabela `notifications`
- Sem mudança de UI ainda

### Fase 2 — PlaybookAI Modal (criação com IA)
- Endpoint `POST /api/ai/generate-playbook`
- Refatorar `CreateEditPlaybookModal` com abas IA + Manual
- Admin já pode criar playbooks com IA

### Fase 3 — Aba Cadência no PipelineAIModal
- Nova aba "Cadência" com configuração por estágio
- Persistência dos novos campos no Supabase
- Admin configura gatilhos e playbooks automáticos

### Fase 4 — WF-05 V4 + NotificationBell
- Atualizar WF-05 no n8n para detectar gatilhos e mover leads
- `NotificationBell` com aprovações humanas
- Integração completa end-to-end

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---|---|---|
| Autonomia do agente | Modo Híbrido | Fechamentos sempre exigem humano |
| Geração de playbook | Prompt + Metodologia | Máxima flexibilidade para o admin |
| Notificações | Tabela Supabase + Realtime | Consistente com stack atual |
| Gatilhos | Keywords simples (jsonb) | Evita complexidade de regex/NLP próprio |
| Aprovação | 1 clique no CRM | Mínimo atrito para o vendedor |

---

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---|---|
| `supabase/migrations/XXX_cadencia_inteligente.sql` | Novo — schema |
| `api/ai/generate-playbook.ts` | Novo — endpoint Claude API |
| `frontend/src/features/playbooks/CreateEditPlaybookModal.tsx` | Refatorar — adicionar IA |
| `frontend/src/features/leads/PipelineAIModal.tsx` | Editar — nova aba Cadência |
| `frontend/src/features/notifications/NotificationBell.tsx` | Novo — componente |
| `frontend/src/hooks/useNotifications.ts` | Novo — hook Supabase |
| `frontend/src/app/RootLayout.tsx` | Editar — adicionar NotificationBell |
| `n8n/WF-05-AI-AGENT-V4.json` | Novo — lógica de gatilhos |
