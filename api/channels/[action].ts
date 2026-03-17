import { supabaseAdmin } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';
import { AppError, apiError } from '../_lib/errors.js';

/* ─────────────────────────────────────────────────────────────────────────
   Single entry-point for all /api/channels/:action routes.
   Vercel maps each [action] segment to this function.
───────────────────────────────────────────────────────────────────────── */
export default async function handler(req: any, res: any) {
  const action = (req.query.action ?? req.params?.action) as string;
  switch (action) {
    case 'connect':        return handleConnect(req, res);
    case 'instance-state': return handleInstanceState(req, res);
    case 'register':       return handleRegister(req, res);
    case 'health':         return handleHealth(req, res);
    case 'send':           return handleSend(req, res);
    case 'disconnect':     return handleDisconnect(req, res);
    default:               return res.status(404).json({ error: `Unknown action: ${action}` });
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

async function checkInstanceState(evolutionUrl: string, apiKey: string, instanceName: string): Promise<string> {
  try {
    const r = await fetch(
      `${evolutionUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`,
      { headers: { apikey: apiKey }, signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return 'unknown';
    const d = await r.json();
    return d?.instance?.state ?? d?.state ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

async function fetchQRWithRetry(evolutionUrl: string, apiKey: string, instanceName: string, attempts = 3) {
  const url = `${evolutionUrl}/instance/connect/${encodeURIComponent(instanceName)}`;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, { headers: { apikey: apiKey }, signal: AbortSignal.timeout(8000) });
      const rawText = await r.text().catch(() => '(falha ao ler body)');
      if (r.ok) {
        const d = (() => { try { return JSON.parse(rawText); } catch { return {}; } })();
        const code   = d?.code   ?? d?.qrcode?.code   ?? null;
        const base64 = d?.base64 ?? d?.qrcode?.base64 ?? null;
        if (code || base64) return { code, base64 };
      }
    } catch { /* ignora */ }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 1500));
  }
  return { base64: null, code: null };
}

/* ── connect ─────────────────────────────────────────────────────────── */
async function handleConnect(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const apiKey       = process.env.EVOLUTION_API_KEY;
    const n8nWebhook   = process.env.N8N_INBOUND_WEBHOOK_URL ?? '';

    if (!evolutionUrl || !apiKey) throw new AppError(500, 'Evolution API não configurada.');

    const ctx = await requireAuth(req);
    const { userId, companyId } = ctx;
    const instanceName = `ns_${userId.replace(/-/g, '').slice(0, 20)}`;

    console.log(`[connect] userId=${userId} role=${ctx.role} instanceName=${instanceName}`);

    // Busca ESTRITAMENTE pelo owner_id do usuário logado — nunca vaza conexões de outros
    const { data: existing } = await supabaseAdmin
      .from('channel_connections')
      .select('id, external_id')
      .eq('owner_id', userId)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp')
      .maybeSingle();

    console.log(`[connect] existing in DB: ${existing ? existing.id : 'none'}`);

    if (existing) {
      const existingName = existing.external_id ?? instanceName;
      const state = await checkInstanceState(evolutionUrl, apiKey, existingName);
      console.log(`[connect] Evolution state for ${existingName}: ${state}`);

      if (state === 'open') {
        return res.status(200).json({ instanceName: existingName, alreadyConnected: true });
      }

      const qr = await fetchQRWithRetry(evolutionUrl, apiKey, existingName);
      if (qr.code || qr.base64) {
        return res.status(200).json({ instanceName: existingName, ...qr, alreadyRegistered: true });
      }
      // Instância existe no banco mas Evolution não retornou QR — recria abaixo
    }

    // Tenta criar a instância
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        ...(n8nWebhook ? {
          webhook: {
            url: n8nWebhook,
            byEvents: false,
            base64: true,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED', 'SEND_MESSAGE'],
          },
        } : {}),
      }),
      signal: AbortSignal.timeout(12000),
    });

    const createBody = await createRes.text().catch(() => '');
    console.log(`[connect] create status=${createRes.status} body=${createBody.slice(0, 200)}`);

    if (createRes.status === 401) {
      throw new AppError(502, `EVOLUTION_API_KEY inválida ou sem permissão (401).`);
    }

    // 403 = instância fantasma na Evolution (registro CRM deletado mas Evolution não foi limpa)
    // Solução: deletar a instância fantasma e recriar
    if (createRes.status === 403) {
      console.log(`[connect] 403 — instância fantasma detectada. Tentando limpar ${instanceName}...`);
      try {
        await fetch(`${evolutionUrl}/instance/delete/${encodeURIComponent(instanceName)}`, {
          method: 'DELETE',
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(8000),
        });
        console.log(`[connect] instância fantasma deletada. Aguardando e recriando...`);
      } catch (e) {
        console.warn(`[connect] erro ao deletar fantasma:`, e);
      }

      await new Promise(r => setTimeout(r, 2000));

      const retryRes = await fetch(`${evolutionUrl}/instance/create`, {
        method: 'POST',
        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          ...(n8nWebhook ? {
            webhook: {
              url: n8nWebhook,
              byEvents: false,
              base64: true,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED', 'SEND_MESSAGE'],
            },
          } : {}),
        }),
        signal: AbortSignal.timeout(12000),
      });
      console.log(`[connect] retry create status=${retryRes.status}`);
      if (!retryRes.ok && retryRes.status !== 201) {
        throw new AppError(502, `Não foi possível recriar a instância após limpeza (status ${retryRes.status}).`);
      }
    }

    // Aguarda instância ficar pronta
    await new Promise(r => setTimeout(r, 2000));

    const stateAfterCreate = await checkInstanceState(evolutionUrl, apiKey, instanceName);
    console.log(`[connect] state after create: ${stateAfterCreate}`);

    if (stateAfterCreate === 'open') {
      return res.status(200).json({ instanceName, alreadyConnected: true });
    }

    const qr = await fetchQRWithRetry(evolutionUrl, apiKey, instanceName);

    if (!qr.code && !qr.base64) {
      throw new AppError(502, `QR Code não disponível para "${instanceName}". Verifique a Evolution API.`);
    }

    return res.status(200).json({ instanceName, base64: qr.base64, code: qr.code, alreadyRegistered: false });
  } catch (err: any) {
    console.error('[connect] erro:', err?.statusCode ?? err?.status ?? '?', err?.message ?? err);
    return apiError(res, err);
  }
}

/* ── instance-state ──────────────────────────────────────────────────── */
async function handleInstanceState(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAuth(req);
    const { name } = req.query;
    if (!name) throw new AppError(400, 'Parâmetro "name" obrigatório.');

    const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const apiKey       = process.env.EVOLUTION_API_KEY;
    if (!evolutionUrl || !apiKey) throw new AppError(500, 'Evolution API não configurada.');

    const instanceName = encodeURIComponent(name as string);
    const stateRes = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`,
      { headers: { apikey: apiKey }, signal: AbortSignal.timeout(6000) });

    if (!stateRes.ok) return res.status(200).json({ state: 'error', base64: null });

    const stateData = await stateRes.json();
    const state = stateData?.instance?.state ?? stateData?.state ?? 'unknown';

    let code: string | null   = null;
    let base64: string | null = null;
    if (state !== 'open') {
      try {
        const qrRes = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`,
          { headers: { apikey: apiKey }, signal: AbortSignal.timeout(6000) });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          code   = qrData?.code   ?? qrData?.qrcode?.code   ?? null;
          base64 = qrData?.base64 ?? qrData?.qrcode?.base64 ?? null;
        }
      } catch { /* ignora */ }
    }

    return res.status(200).json({ state, code, base64 });
  } catch (err) { return apiError(res, err); }
}

/* ── register ────────────────────────────────────────────────────────── */
async function handleRegister(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const ctx = await requireAuth(req);
    const { userId, companyId } = ctx;
    const { instanceName, displayName } = req.body ?? {};
    if (!instanceName) throw new AppError(400, 'instanceName obrigatório.');

    const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const apiKey       = process.env.EVOLUTION_API_KEY;

    if (evolutionUrl && apiKey) {
      let state = await checkInstanceState(evolutionUrl, apiKey, instanceName);
      console.log(`[register] userId=${userId} instanceName=${instanceName} state=${state}`);

      // Se não 'open' na primeira checagem, aguarda 3s e tenta mais uma vez
      // (evita falso-negativo por delay entre connect e register)
      if (state !== 'open') {
        await new Promise(r => setTimeout(r, 3000));
        state = await checkInstanceState(evolutionUrl, apiKey, instanceName);
        console.log(`[register] retry state=${state}`);
      }

      if (state !== 'open') {
        throw new AppError(400, `WhatsApp ainda não conectado (state: ${state}). Escaneie o QR e tente novamente.`);
      }
    }

    const name = displayName?.trim() || `WhatsApp (${instanceName})`;
    const { data, error } = await supabaseAdmin
      .from('channel_connections')
      .upsert({
        company_id:  companyId,
        owner_id:    userId,
        channel:     'whatsapp',
        name,
        external_id: instanceName,
        status:      'active',
        is_active:   true,
        config: { evolution_url: evolutionUrl ?? null, api_key: apiKey ?? null },
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'company_id,external_id' })
      .select()
      .single();

    if (error) throw new AppError(500, 'Erro ao registrar conexão no banco.');
    return res.status(201).json({ connection: data });
  } catch (err) { return apiError(res, err); }
}

/* ── health ──────────────────────────────────────────────────────────── */
async function handleHealth(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const ctx = await requireAuth(req);
    const { companyId } = ctx;

    const { data: connections, error } = await supabaseAdmin
      .from('channel_connections')
      .select('id, name, channel, external_id, status, config, is_active, updated_at')
      .eq('company_id', companyId);

    if (error) throw new AppError(500, 'Erro ao buscar conexões.');

    const results = await Promise.all(
      (connections ?? []).map(async (conn: any) => {
        const base: Record<string, any> = {
          id: conn.id, name: conn.name, channel: conn.channel,
          external_id: conn.external_id, db_status: conn.status,
          is_active: conn.is_active, updated_at: conn.updated_at,
          evolution_state: 'unknown', evolution_error: null,
        };
        if (conn.channel !== 'whatsapp' || !conn.external_id) return base;

        const evolutionUrl = conn.config?.evolution_url ?? process.env.EVOLUTION_API_URL ?? null;
        const apiKey       = conn.config?.api_key       ?? process.env.EVOLUTION_API_KEY  ?? null;
        if (!evolutionUrl || !apiKey) { base.evolution_error = 'Evolution API não configurada.'; return base; }

        try {
          const r = await fetch(
            `${evolutionUrl.replace(/\/$/, '')}/instance/connectionState/${encodeURIComponent(conn.external_id)}`,
            { headers: { apikey: apiKey }, signal: AbortSignal.timeout(6000) });
          if (r.ok) {
            const j = await r.json();
            base.evolution_state = j?.instance?.state ?? j?.state ?? 'unknown';
          } else {
            base.evolution_state = 'error';
            base.evolution_error = `Evolution API retornou ${r.status}`;
          }
        } catch (e: any) {
          base.evolution_state = 'error';
          base.evolution_error = e?.message ?? 'Timeout ou conexão recusada';
        }
        return base;
      })
    );

    return res.status(200).json({ connections: results, checked_at: new Date().toISOString() });
  } catch (err) { return apiError(res, err); }
}

/* ── send ────────────────────────────────────────────────────────────── */
async function handleSend(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const ctx = await requireAuth(req);
    const { conversationId, content } = req.body ?? {};

    if (!conversationId || typeof conversationId !== 'string') throw new AppError(400, 'conversationId é obrigatório.');
    if (!content || typeof content !== 'string' || !content.trim()) throw new AppError(400, 'content não pode ser vazio.');
    if (content.length > 4096) throw new AppError(400, 'Mensagem excede o limite de 4096 caracteres.');

    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, company_id, channel_connection_id, contact_identifier, assignee_id, status')
      .eq('id', conversationId)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (convError || !conversation) throw new AppError(404, 'Conversa não encontrada.');
    if (ctx.role !== 'admin' && conversation.assignee_id !== ctx.userId) throw new AppError(403, 'Você não é o responsável por esta conversa.');
    if (conversation.status !== 'in_progress') throw new AppError(400, 'Mensagens só podem ser enviadas em conversas em atendimento.');

    const { data: channel, error: channelError } = await supabaseAdmin
      .from('channel_connections')
      .select('id, name, external_id, channel')
      .eq('id', conversation.channel_connection_id)
      .eq('company_id', ctx.companyId)
      .maybeSingle();

    if (channelError || !channel) throw new AppError(500, 'Canal de comunicação não encontrado.');

    const webhookUrl = process.env.N8N_OUTBOUND_WEBHOOK_URL;
    if (!webhookUrl) throw new AppError(500, 'Webhook de saída não configurado.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let n8nRes: Response;
    try {
      n8nRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id, companyId: ctx.companyId,
          channelConnectionId: conversation.channel_connection_id,
          channelType: channel.channel, instanceName: channel.external_id,
          contactIdentifier: conversation.contact_identifier,
          content: content.trim(), agentId: ctx.userId,
        }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }

    if (!n8nRes.ok) throw new AppError(502, 'Falha ao encaminhar mensagem. Tente novamente.');
    return res.status(200).json({ ok: true });
  } catch (err) { return apiError(res, err); }
}

/* ── disconnect ──────────────────────────────────────────────────────── */
async function handleDisconnect(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const ctx = await requireAuth(req);
    const { userId, companyId } = ctx;
    const { connectionId } = req.body ?? {};

    const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const apiKey       = process.env.EVOLUTION_API_KEY;

    // Admin pode desconectar qualquer instância pelo connectionId
    // Seller só pode desconectar a própria
    const { data: conn } = await supabaseAdmin
      .from('channel_connections')
      .select('id, external_id, owner_id, channel')
      .eq('company_id', companyId)
      .eq(
        connectionId && ctx.role === 'admin' ? 'id' : 'owner_id',
        connectionId && ctx.role === 'admin' ? connectionId : userId
      )
      .maybeSingle();

    // Garante que seller não pode desconectar instância de outro usuário
    // Fallback: instâncias com owner_id null são identificadas pelo padrão ns_{userId}
    if (conn && ctx.role !== 'admin') {
      const expectedExtId = `ns_${userId.replace(/-/g, '').slice(0, 20)}`;
      const isOwner = conn.owner_id === userId || conn.external_id === expectedExtId;
      if (!isOwner) return res.status(403).json({ error: 'Permissão insuficiente.' });
    }

    // Deleta instância na Evolution API
    if (evolutionUrl && apiKey && conn?.external_id) {
      try {
        await fetch(`${evolutionUrl}/instance/delete/${encodeURIComponent(conn.external_id)}`, {
          method: 'DELETE',
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(8000),
        });
      } catch { /* ignora */ }
    }

    // Remove do banco
    const { error } = await supabaseAdmin
      .from('channel_connections')
      .delete()
      .eq('company_id', companyId)
      .eq(
        connectionId && ctx.role === 'admin' ? 'id' : 'owner_id',
        connectionId && ctx.role === 'admin' ? connectionId : userId
      );

    if (error) throw new AppError(500, 'Erro ao remover conexão do banco.');

    return res.status(200).json({ ok: true });
  } catch (err) { return apiError(res, err); }
}
