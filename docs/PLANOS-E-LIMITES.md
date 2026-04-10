# Sistema de Planos e Limites — NextSales

> Documentação técnica e operacional do sistema de configuração de planos implementado em 2026-04-09.

---

## Visão Geral

O sistema de planos controla **o que cada empresa pode fazer dentro do CRM** com base no plano contratado. Toda a configuração vive no banco de dados (tabela `plan_configs`) e é gerenciada pelo back-office em `/admin/planos`. Mudanças feitas lá refletem **imediatamente** para todas as empresas daquele plano — sem deploy, sem código.

---

## Planos Disponíveis

| Slug | Nome | Preço |
|------|------|-------|
| `trial` | Thrill (Trial) | Grátis |
| `starter` | Starter | configurável no back-office |
| `growth` | Growth | configurável no back-office |
| `scale` | Scale | configurável no back-office |

> Preços armazenados em centavos (`price_monthly_cents`, `price_yearly_cents`). Exibidos via hook `usePlanConfigs` — sem hardcode. Alterar no back-office reflete imediatamente.

---

## O que cada plano controla

### Limites numéricos (NULL = ilimitado)

| Recurso | Trial | Starter | Growth | Scale |
|---------|-------|---------|--------|-------|
| Pipelines | 1 | 1 | 3 | ∞ |
| Leads ativos | 50 | 500 | 2.000 | ∞ |
| Vendedores | 1 | 2 | 10 | ∞ |
| Admins | 1 | 1 | 3 | ∞ |
| Agentes IA | 1 | 1 | 2 | ∞ |
| Instâncias WhatsApp | 1 | 1 | 2 | ∞ |
| Playbooks | 1 | 2 | 5 | ∞ |
| Campos customizados | 3 | 5 | 15 | ∞ |

### Features (flags booleanos)

| Feature | Trial | Starter | Growth | Scale |
|---------|-------|---------|--------|-------|
| WhatsApp integrado | ✅ | ✅ | ✅ | ✅ |
| Agente SDR | ✅ | ✅ | ✅ | ✅ |
| Agente Closer | ❌ | ❌ | ✅ | ✅ |
| Agente Follow-up | ❌ | ❌ | ✅ | ✅ |
| Portfólio de produtos | ❌ | ❌ | ✅ | ✅ |
| Relatórios avançados | ❌ | ❌ | ✅ | ✅ |
| Acesso à API | ❌ | ❌ | ❌ | ✅ |
| Suporte prioritário | ❌ | ❌ | ❌ | ✅ |
| Onboarding dedicado | ❌ | ❌ | ❌ | ✅ |
| Comunidade | ❌ | ✅ | ✅ | ✅ |
| Campos customizados | ✅ | ✅ | ✅ | ✅ |
| SLA garantido | ❌ | ❌ | ❌ | ✅ |

### Agentes liberados por plano

| Plano | SDR | Closer | Follow-up |
|-------|-----|--------|-----------|
| Trial | ✅ | ❌ | ❌ |
| Starter | ✅ | ❌ | ❌ |
| Growth | ✅ | ✅ | ✅ |
| Scale | ✅ | ✅ | ✅ |

---

## Onde os limites são aplicados no CRM

| Ação no CRM | Guard aplicado | Arquivo |
|-------------|---------------|---------|
| Botão "Conectar WhatsApp" | `has_whatsapp` + `max_whatsapp_instances` | `ConexoesTab.tsx` |
| Botão "Criar novo board" | `max_pipelines` | `PipelineHeader.tsx` |
| Botão "Convidar" vendedor | `max_sellers` | `TeamSettings.tsx` |
| Botão "Convidar" admin | `max_admins` | `TeamSettings.tsx` |
| Botão "Criar agente" | `max_agents` | `AgentsPage.tsx` |
| Cards de tipo (Closer/Follow-up) no wizard | `allowed_agents` | `AgentWizard.tsx` |
| Botão "Novo Playbook" | `max_playbooks` | `PlaybookSettings.tsx` |
| Menu "Relatórios" na sidebar | `has_reports_advanced` | `Sidebar.tsx` |
| Menu "Portfólio" na sidebar | `has_portfolio` | `Sidebar.tsx` |

**Comportamento dos guards:**
- Quando **limite numérico** é atingido: botão aparece bloqueado com badge "Upgrade" e tooltip explicando o motivo
- Quando **feature não está no plano**: botão aparece bloqueado ou menu some
- Quando **agente não é permitido**: card aparece cinza, desabilitado, com tooltip
- Durante carregamento dos limites: **fail-open** (não bloqueia para não quebrar UX)

---

## Arquitetura técnica

### Banco de dados

**Tabela:** `public.plan_configs`

```sql
slug                    TEXT PRIMARY KEY
display_name            TEXT
description             TEXT
is_popular              BOOLEAN
is_active               BOOLEAN
sort_order              INTEGER
price_monthly_cents     INTEGER
price_yearly_cents      INTEGER
max_pipelines           INTEGER  -- NULL = ilimitado
max_leads               INTEGER
max_users               INTEGER
max_agents              INTEGER
max_whatsapp_instances  INTEGER
max_playbooks           INTEGER
max_custom_fields       INTEGER
max_sellers             INTEGER  -- NULL = ilimitado (migration 124)
max_admins              INTEGER  -- NULL = ilimitado (migration 124)
has_whatsapp            BOOLEAN
has_ai_sdr              BOOLEAN
has_ai_closer           BOOLEAN
has_ai_followup         BOOLEAN
has_portfolio           BOOLEAN
has_reports_advanced    BOOLEAN
has_api_access          BOOLEAN
has_priority_support    BOOLEAN
has_dedicated_onboarding BOOLEAN
has_community           BOOLEAN
has_custom_fields       BOOLEAN
has_sla                 BOOLEAN
allowed_agents          JSONB   -- ex: ["sdr", "closer", "followup"]
```

### RPCs (Supabase)

| Função | Quem usa | Descrição |
|--------|----------|-----------|
| `get_my_plan_limits()` | CRM (frontend) | Retorna limites do plano da empresa logada |
| `admin_get_plan_configs()` | Back-office | Lista todos os planos |
| `admin_upsert_plan_config(p_config JSONB)` | Back-office | Cria ou atualiza um plano |

**RLS:** Qualquer usuário autenticado pode ler `plan_configs`. Apenas `platform_admin` pode escrever.

### Frontend — hooks e componentes

**Hook principal:**
```ts
// src/hooks/usePlanLimits.ts
const { limits, loading, canCreate, hasFeature, canUseAgent } = usePlanLimits()

canCreate('max_pipelines', currentCount)  // boolean
hasFeature('has_whatsapp')                // boolean
canUseAgent('closer')                     // boolean
```

**Componente guard (JSX):**
```tsx
// src/components/PlanGuard.tsx

// Por feature flag
<PlanGuard feature="has_whatsapp" reason="WhatsApp não está no seu plano">
  <button>Conectar</button>
</PlanGuard>

// Por limite numérico
<PlanGuard limit="max_pipelines" current={boards.length} reason="Limite atingido">
  <button>Nova Pipeline</button>
</PlanGuard>

// Por agente
<PlanGuard agent="closer" reason="Agente Closer não está no seu plano">
  <button>Criar Closer</button>
</PlanGuard>
```

**Hook para handlers (sem JSX):**
```ts
const { check } = usePlanBlock()
const { blocked, reason } = check({ limit: 'max_agents', current: agents.length, reason: '...' })
if (blocked) { alert(reason); return; }
```

---

## Back-office — Como configurar planos

**URL:** `/admin/planos` (requer login como `platform_admin`)

**O que é possível fazer:**
1. Expandir qualquer plano clicando no card
2. Editar limites numéricos — clica no número, digita o novo valor, vazio = ilimitado (∞)
3. Ativar/desativar features com toggle
4. Selecionar agentes liberados (SDR / Closer / Follow-up)
5. Alterar preços (em centavos)
6. Marcar plano como "popular" ou "inativo"
7. Definir ordem de exibição
8. Clicar em **Salvar alterações** (aparece só quando há mudança)

**Efeito imediato:** O CRM rebusca `get_my_plan_limits()` no mount e ao retornar o foco da aba (`window focus`). Preços são lidos via `usePlanConfigs` direto do banco. Mudanças no back-office refletem sem redeploy.

---

## Migration aplicada

| Arquivo | Data | Conteúdo |
|---------|------|----------|
| `supabase/migrations/123_plan_configs.sql` | 2026-04-09 | Tabela plan_configs, seed inicial, RPCs |
| `supabase/migrations/124_plan_role_limits.sql` | 2026-04-10 | Colunas max_sellers e max_admins, seed por plano, RPC atualizada |

---

## Como adicionar um novo guard no futuro

1. Identifique se é **feature flag**, **limite numérico** ou **agente**
2. Importe `PlanGuard` ou `usePlanBlock` no componente
3. Envolva o botão/ação com o guard apropriado
4. Configure os valores no back-office em `/admin/planos`

Exemplo para bloquear criação de campo customizado:
```tsx
<PlanGuard
  feature="has_custom_fields"
  reason="Campos customizados não estão disponíveis no seu plano"
>
  <button onClick={handleAddField}>+ Campo</button>
</PlanGuard>
```

---

## O que falta implementar

- [ ] Guard em criação de leads (bloquear quando `max_leads` atingido)
- [ ] Guard em instâncias WhatsApp adicionais (além da do próprio usuário)
- [ ] Página de upgrade dentro do CRM com CTA para cada limite atingido
- [ ] Notificação proativa quando empresa está a 80% do limite
- [ ] Webhook no n8n para notificar quando plano expira ou limite é atingido
