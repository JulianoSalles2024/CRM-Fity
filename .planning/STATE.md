# Project State: Mídia Inbox + Notificações Bell

**Last updated:** 2026-03-20
**Active phase:** None (ready to start Phase 1)

## Phase Status

| Phase | Name | Status | Started | Completed |
|-------|------|--------|---------|-----------|
| 1 | Renderização de Mídia no Frontend | Pending | — | — |
| 2 | Pipeline de Mídia no n8n WF-01 | Pending | — | — |
| 3 | Notificações Bell | Pending | — | — |

## Requirements Status

| Requirement | Description | Phase | Status |
|-------------|-------------|-------|--------|
| MEDIA-01 | Imagens renderizam como `<img>` no MessageBubble | 1 | Pending |
| MEDIA-02 | Áudios renderizam como player `<audio>` | 1 | Pending |
| MEDIA-03 | Transcrição aparece abaixo do player | 1 | Pending |
| MEDIA-04 | WF-01 baixa mídia e salva URL no Supabase Storage | 2 | Pending |
| MEDIA-05 | Placeholder para mídia sem URL válida | 1 | Pending |
| NOTIF-01 | Query usa `recipient_user_id` | 3 | Pending |
| NOTIF-02 | Query usa `is_read` para filtrar | 3 | Pending |
| NOTIF-03 | Badge exibe contagem correta | 3 | Pending |
| NOTIF-04 | Realtime atualiza badge em tempo real | 3 | Pending |
| NOTIF-05 | Marcar como lida funciona | 3 | Pending |
| NOTIF-06 | Sellers veem apenas suas notificações | 3 | Pending |

## Decisions Made

- **Proxy de mídia via backend**: Descartado para v1 — Phase 1 usa `onError` fallback no frontend; Phase 2 (n8n) é a solução duradoura
- **Schema fix no frontend**: Bug de notificações está nas queries do frontend, não no banco

## Blockers

None.

## Notes

- Bucket `inbox-media` já existe e é público no Supabase Storage
- WF-01 V13 tem lógica de download mas endpoint Evolution API pode estar errado
- MessageBubble.tsx já tem `<audio>` e `<img>` mas recebe URLs expiradas do WhatsApp
- Schema notifications: `recipient_user_id` (não `user_id`), `is_read` (não `read`)

---
*State initialized: 2026-03-20*
