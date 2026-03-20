# NextSales — Mídia no Inbox + Notificações Bell

## What This Is

Correção de duas features críticas do NextSales CRM: renderização de mídia (imagens e áudio) nas conversas do Omnichannel Inbox, e funcionamento do sistema de notificações bell para sellers. Ambas estão implementadas mas quebradas por problemas de integração com a Evolution API e mismatch de schema no banco.

## Core Value

Sellers conseguem ver imagens e ouvir áudios recebidos no WhatsApp dentro do Inbox, e recebem notificações de novos leads e tarefas sem precisar recarregar a tela.

## Requirements

### Validated

- ✓ Estrutura de conversas e mensagens no banco (Omnichannel) — existente
- ✓ MessageBubble.tsx com player de áudio e renderização de imagem — implementado
- ✓ Schema de notificações (`notifications` table) — existente
- ✓ NotificationsView.tsx — implementado
- ✓ Bell icon no Sidebar com badge de contagem — implementado

### Active

- [ ] Mídia (imagens/áudio) renderiza corretamente no chat do Inbox
- [ ] Transcrição de áudio aparece abaixo do player
- [ ] Notificações bell funcionam para sellers (query corrigida para schema real)
- [ ] Sellers recebem notificações em tempo real via Supabase Realtime

### Out of Scope

- Upload de mídia pelo seller no chat — não é escopo desta fase
- Notificações por email/push — apenas in-app nesta fase
- Redesign da UI de notificações — apenas correção funcional

## Context

**Mídia no Inbox:**
- Evolution API `getBase64FromMediaMessage` pode estar retornando vazio
- Endpoint pode ser `/chat/getBase64FromMediaMessage/` (não `/message/`)
- Bucket `inbox-media` existe e está público no Supabase Storage
- WF-01 V13 já tem lógica de download de mídia implementada
- MessageBubble.tsx já renderiza `<audio>` e `<img>` mas recebe URL encriptada do WhatsApp (mmg.whatsapp.net) que expira

**Notificações bell:**
- Schema real: `recipient_user_id` (não `user_id`) e `is_read` (não `read`)
- Sellers devem ver apenas suas próprias notificações
- Sistema de Realtime subscription pode estar apontando para coluna errada

**Stack:** React 19 + TypeScript + Supabase + Tailwind + n8n + Evolution API
**Deploy:** Vercel (frontend + API) + n8n self-hosted (n8n.julianosalles.com.br)

## Constraints

- **Vercel Hobby:** Máximo 12 serverless functions — já no limite exato
- **Evolution API:** Credenciais: `EVOLUTION_API_URL` + `EVOLUTION_API_KEY`
- **n8n:** WF-01 V13 já ativo — modificações requerem reimport
- **Supabase Free:** RLS ativa em todas as tabelas, `my_company_id()` obrigatório

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Proxy mídia via backend | URL do WhatsApp expira; baixar e salvar no Supabase Storage é a solução duradoura | — Pending |
| Corrigir schema de notificações no frontend | Schema do banco está correto; bug está na query do frontend | — Pending |

---
*Last updated: 2026-03-20 after initialization*
