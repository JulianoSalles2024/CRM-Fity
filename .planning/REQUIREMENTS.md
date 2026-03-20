# Requirements: Mídia Inbox + Notificações Bell

**Defined:** 2026-03-20
**Core Value:** Sellers veem mídia recebida no WhatsApp e recebem notificações em tempo real

## v1 Requirements

### Mídia no Inbox

- [ ] **MEDIA-01**: Imagens recebidas via WhatsApp renderizam como `<img>` no MessageBubble
- [ ] **MEDIA-02**: Áudios recebidos via WhatsApp renderizam como player `<audio>` no MessageBubble
- [ ] **MEDIA-03**: Transcrição do áudio aparece abaixo do player quando disponível
- [ ] **MEDIA-04**: WF-01 baixa mídia da Evolution API e salva URL permanente no Supabase Storage
- [ ] **MEDIA-05**: Mensagens com mídia sem URL válida exibem placeholder adequado ("Imagem" / "Áudio")

### Notificações Bell

- [ ] **NOTIF-01**: Query de notificações usa `recipient_user_id` (schema real da tabela)
- [ ] **NOTIF-02**: Query usa `is_read` (não `read`) para filtrar não-lidas
- [ ] **NOTIF-03**: Badge no bell do Sidebar exibe contagem correta de não-lidas para o seller
- [ ] **NOTIF-04**: Supabase Realtime atualiza badge em tempo real quando nova notificação chega
- [ ] **NOTIF-05**: Marcar como lida funciona (UPDATE com campo correto `is_read`)
- [ ] **NOTIF-06**: Sellers veem apenas suas próprias notificações (RLS + filtro por `recipient_user_id`)

## v2 Requirements

### Mídia

- **MEDIA-06**: Visualizador de imagem em tela cheia (lightbox)
- **MEDIA-07**: Download de arquivos recebidos
- **MEDIA-08**: Suporte a vídeos recebidos

### Notificações

- **NOTIF-07**: Agrupamento de notificações por tipo
- **NOTIF-08**: Notificação sonora opcional

## Out of Scope

| Feature | Reason |
|---------|--------|
| Upload de mídia pelo seller | Escopo separado, alta complexidade |
| Notificações push/email | In-app suficiente para MVP |
| Redesign UI de notificações | Apenas correção funcional |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MEDIA-01 | Phase 1 | Pending |
| MEDIA-02 | Phase 1 | Pending |
| MEDIA-03 | Phase 1 | Pending |
| MEDIA-04 | Phase 2 | Pending |
| MEDIA-05 | Phase 1 | Pending |
| NOTIF-01 | Phase 3 | Pending |
| NOTIF-02 | Phase 3 | Pending |
| NOTIF-03 | Phase 3 | Pending |
| NOTIF-04 | Phase 3 | Pending |
| NOTIF-05 | Phase 3 | Pending |
| NOTIF-06 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
