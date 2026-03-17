# Status do Projeto Omnichannel - NextSales

## 1. Visão Geral
O módulo Omnichannel é o sistema nervoso da operação comercial do NextSales, integrando múltiplos canais (inicialmente WhatsApp via Evolution API) em uma única interface de atendimento (Inbox). O objetivo é centralizar a comunicação, automatizar qualificações e garantir que nenhum lead fique sem resposta.

## 2. O que já foi concluído ✅

### Infraestrutura & Banco de Dados
- **Omnichannel Foundation**: Tabelas base para conversas, mensagens e canais (`018`).
- **Automação & AI RAG**: Tabelas para regras de automação e base de conhecimento RAG para suporte a agentes Inteligentes (`019`).
- **RPCs Especializados**: Funções para resolução automática de leads, atribuição de proprietários e gestão de conversas via banco (`020`, `021`, `025`, `029`, `034`, `038`).
- **Sistema de Follow-up**: Motor de regras de acompanhamento automático (Follow-up) e lógica de reativação de leads (`042`, `043`, `049`).
- **Realtime**: Implementação completa de Supabase Realtime para mensagens instantâneas e atualização de status de leads sem refresh (`046`, `048`).
- **Mídia**: Estrutura para suporte a URLs de mídia em mensagens e integração com Storage para arquivos recebidos (`051`, `053`).
- **Gestão de Instâncias**: Estabilização da conexão com Evolution API e tratamento de `external_id` (`20260313`).
- **Estabilização n8n & API**: Resolução de erros 401 via atualização de API Key e correção de escopo de role (`role_scope`) para Follow-ups (`20260317`).

### Frontend (Interface)
- **Inbox Centralizado**: Visualização organizada por estados (Pendentes, Aguardando, Resolvidos).
- **Painel de Conversa (ConversationPanel)**: Interface rica com balões de mensagem, histórico completo e alternância de canais.
- **Compositor de Mensagens**: Suporte total para envio de mensagens via WhatsApp Outbound.
- **Filtros e Busca**: Capacidade de filtrar conversas por canal, status e realizar busca textual rápida.
- **Integração Nativa CRM**: Vinculação automática de conversas a leads existentes ou criação de novos leads a partir do atendimento.
- **Gestão de Conexões V2**: Grid responsivo com 3 cards, paginação suave e tags de identificação Admin/Seller (`20260317`).
- **Módulo de Leads 2.0**: Redesign sênior do Kanban e Lista, com a integração da aba **Recuperação** diretamente na gestão de leads (`20260317`).
- **Painel 360 & Radar**: Visualizações de supervisão para administradores acompanharem o fluxo de mensagens.
- **Funil de Conversão Premium**: Redesign completo da aba Relatórios com barras animadas, badges de contagem e indicadores de conversão entre estágios (`20260317`).

## 3. Em Andamento / O que precisa ser feito ⏳

### Melhorias de UI/UX
- [ ] **Player de Mídia**: Renderizar imagens, vídeos e audios diretamente nos balões de mensagem (atualmente exibe links/botões).
- [ ] **Templates HSM**: Componente para seleção e envio de templates aprovados do WhatsApp.
- [ ] **Feedback de Digitação**: Exibir "digitando..." em tempo real no Inbox.
- [ ] **Otimização Mobile**: Refinar a experiência do Inbox para dispositivos móveis.

### Funcionalidades Core
- [ ] **Transferência entre Vendedores**: Interface simples para passar a "posse" de uma conversa para outro colega.
- [ ] **Expansão Multicanal**: Homologar e integrar Directs do Instagram e E-mail (Inbound/Outbound).
- [ ] **Módulo de Agentes de IA (Fase 4 do Plano Mestre)**:
    - [ ] Interface de Configuração (Wizard) para criação de Agentes (SDR, Hunter, Follow-up).
    - [ ] Ativação do Agente SDR para respostas automáticas inteligentes.
    - [ ] Sistema de Escalada Inteligente (Transferência automática IA -> Humano baseada em intenção).

### Qualidade & Observabilidade
- [ ] **Monitor de Webhooks**: Tela para verificar se as integrações (Evolution API, n8n) estão saudáveis.
- [ ] **Histórico de Auditoria**: Log de quem (humano ou robô) enviou cada mensagem para fins de supervisão.

## 4. Próximos Passos Imediatos
1. Implementar a renderização visual de mídias no frontend (`MessageBubble`).
2. Criar a tela de configuração de Agentes Comerciais para iniciar a Fase 4.
3. Configurar os workflows de performance diária (WF-09) para relatórios de conversão automática.

---
*Última atualização: 2026-03-17*
