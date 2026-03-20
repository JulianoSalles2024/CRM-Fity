# Roadmap: Mídia Inbox + Notificações Bell

**Created:** 2026-03-20
**Status:** Phase 1 ready to start

## Phase 1 — Renderização de Mídia no Frontend

**Goal:** MessageBubble renderiza imagens e áudio corretamente, com fallback quando URL inválida
**Requirements:** MEDIA-01, MEDIA-02, MEDIA-03, MEDIA-05
**Estimate:** ~2.5h

### Tasks

1. **Audit MessageBubble.tsx** — mapear como `message.mediaUrl` e `message.mediaType` chegam ao componente
2. **Fix `<img>` rendering** — adicionar `onError` fallback para exibir placeholder "Imagem" quando URL expira
3. **Fix `<audio>` rendering** — player HTML5 nativo com `onError` fallback para placeholder "Áudio"
4. **Transcrição** — exibir `message.transcription` abaixo do player de áudio quando disponível
5. **Placeholder component** — componente `MediaPlaceholder` com ícone + label para estados de erro
6. **Test** — verificar com mensagens reais no Inbox (imagem, áudio, texto)

### Acceptance Criteria

- [ ] Imagem recebida via WhatsApp renderiza como `<img>` no chat
- [ ] Áudio recebido renderiza como `<audio>` player
- [ ] Transcrição aparece abaixo do player quando `message.transcription` existe
- [ ] Mensagem com URL expirada/inválida exibe placeholder sem quebrar o chat
- [ ] Sem erros no console para mensagens de mídia

---

## Phase 2 — Pipeline de Mídia no n8n WF-01

**Goal:** WF-01 baixa mídia da Evolution API e salva URL permanente no Supabase Storage
**Requirements:** MEDIA-04
**Estimate:** ~5h

### Tasks

1. **Audit WF-01 V13** — mapear nós existentes de download de mídia, identificar o problema com `getBase64FromMediaMessage`
2. **Fix endpoint Evolution API** — testar `/chat/getBase64FromMediaMessage/` vs `/message/getBase64FromMediaMessage/`
3. **Fix download lógica** — tratar resposta vazia; adicionar retry com backoff
4. **Upload Supabase Storage** — `inbox-media` bucket; path: `{company_id}/{conversation_id}/{messageId}.{ext}`
5. **Salvar URL permanente** — UPDATE `omnichannel_messages.media_url` com URL pública do Storage
6. **Criar WF-01 V14** — exportar JSON atualizado
7. **Test** — enviar imagem e áudio via WhatsApp, verificar URL no banco

### Acceptance Criteria

- [ ] WF-01 chama endpoint correto da Evolution API
- [ ] Mídia baixada com sucesso (base64 → Buffer → upload)
- [ ] URL pública salva em `omnichannel_messages.media_url`
- [ ] Imagem aparece no frontend após nova mensagem
- [ ] Áudio aparece no frontend após nova mensagem
- [ ] Erro de download não quebra o fluxo (continua sem mídia)

---

## Phase 3 — Notificações Bell

**Goal:** Bell do Sidebar exibe contagem correta e atualiza em tempo real para sellers
**Requirements:** NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06
**Estimate:** ~4.5h

### Tasks

1. **Audit schema `notifications`** — confirmar colunas: `recipient_user_id`, `is_read`, demais campos
2. **Fix query de notificações** — usar `recipient_user_id` (não `user_id`) e `is_read` (não `read`)
3. **Fix badge count** — query conta apenas `is_read = false` para o seller autenticado
4. **Fix Realtime subscription** — canal correto, filtro por `recipient_user_id = auth.uid()`
5. **Fix marcar como lida** — UPDATE `is_read = true` (campo correto)
6. **Verificar RLS** — policy garante que seller vê apenas `recipient_user_id = auth.uid()`
7. **Test** — criar notificação manualmente, verificar badge, marcar como lida

### Acceptance Criteria

- [ ] Badge exibe número correto de notificações não-lidas
- [ ] Badge atualiza automaticamente quando nova notificação chega (sem reload)
- [ ] Seller A não vê notificações do Seller B
- [ ] Marcar como lida decrementa o badge
- [ ] Sem erros Supabase no console relacionados a notificações

---

## Summary

| Phase | Focus | Requirements | Est. |
|-------|-------|--------------|------|
| 1 | Mídia Frontend | MEDIA-01,02,03,05 | 2.5h |
| 2 | Mídia n8n WF-01 | MEDIA-04 | 5h |
| 3 | Notificações Bell | NOTIF-01..06 | 4.5h |

**Total estimate:** ~12h

---
*Roadmap created: 2026-03-20*
