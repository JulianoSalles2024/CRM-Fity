import { supabaseAdmin } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';
import { AppError, apiError } from '../_lib/errors.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ── 1. Autenticação — companyId vem do JWT, nunca do body ─────
    const ctx = await requireAuth(req);

    // ── 2. Validação do body ──────────────────────────────────────
    const { conversationId, content } = req.body ?? {};

    if (!conversationId || typeof conversationId !== 'string') {
      throw new AppError(400, 'conversationId é obrigatório.');
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      throw new AppError(400, 'content não pode ser vazio.');
    }
    if (content.length > 4096) {
      throw new AppError(400, 'Mensagem excede o limite de 4096 caracteres.');
    }

    // ── 3. Buscar conversa — company_id do JWT garante isolamento ─
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, company_id, channel_connection_id, contact_identifier, assignee_id, status')
      .eq('id', conversationId)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (convError || !conversation) {
      throw new AppError(404, 'Conversa não encontrada.');
    }

    // ── 4. Permissão: admin ou assignee ──────────────────────────
    if (ctx.role !== 'admin' && conversation.assignee_id !== ctx.userId) {
      throw new AppError(403, 'Você não é o responsável por esta conversa.');
    }

    // ── 5. Status: só envia em conversas ativas ──────────────────
    if (conversation.status !== 'in_progress') {
      throw new AppError(400, 'Mensagens só podem ser enviadas em conversas em atendimento.');
    }

    // ── 6. Buscar canal — external_id = instance name no Evolution
    const { data: channel, error: channelError } = await supabaseAdmin
      .from('channel_connections')
      .select('id, name, external_id, channel')
      .eq('id', conversation.channel_connection_id)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (channelError || !channel) {
      throw new AppError(500, 'Canal de comunicação não encontrado.');
    }

    // ── 7. Verificar variável de ambiente ─────────────────────────
    const webhookUrl = process.env.N8N_OUTBOUND_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new AppError(500, 'Webhook de saída não configurado. Contate o suporte.');
    }

    // ── 8. Montar payload rico para o n8n WF-02 ───────────────────
    const payload = {
      conversationId:      conversation.id,
      companyId:           ctx.companyId,
      channelConnectionId: conversation.channel_connection_id,
      channelType:         channel.channel,          // 'whatsapp' | 'email' | ...
      instanceName:        channel.external_id,       // Evolution API instance name
      contactIdentifier:   conversation.contact_identifier,
      content:             content.trim(),
      agentId:             ctx.userId,
    };

    // ── 9. Disparar para o n8n (timeout 10 s) ────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let n8nRes: Response;
    try {
      n8nRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!n8nRes.ok) {
      console.error('[api/channels/send] n8n retornou erro:', n8nRes.status, await n8nRes.text().catch(() => ''));
      throw new AppError(502, 'Falha ao encaminhar mensagem. Tente novamente.');
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return apiError(res, err);
  }
}
