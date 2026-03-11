import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Inline auth helper ────────────────────────────────────────
// Temporário — será substituído por api/_lib/auth.ts na Fase 2.
// Valida JWT do header Authorization, retorna companyId e role do perfil.
// companyId NUNCA vem de query params ou body.
async function getAuthContext(req: any) {
  const raw = (req.headers['authorization'] ?? req.headers['Authorization']) as string | undefined;
  const token = raw?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) return null;

  return {
    userId: user.id,
    companyId: profile.company_id,
    role: profile.role as string,
  };
}

export default async function handler(req: any, res: any) {
  try {
    // ── 1. Autenticação obrigatória para todos os métodos ─────
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return res.status(401).json({ error: 'Autenticação obrigatória.' });
    }

    if (req.method === 'GET') {
      // companyId do JWT — organizationId do query param é ignorado.
      const { data, error } = await supabase
        .from('organization_ai_credentials')
        .select('ai_provider, ai_api_key, model')
        .eq('organization_id', ctx.companyId);

      if (error) {
        return res.status(500).json({ error: 'Falha ao buscar credenciais.' });
      }

      if (!data || data.length === 0) return res.json({});

      const result: Record<string, object> = {};
      for (const row of data) {
        result[row.ai_provider] = {
          provider: row.ai_provider,
          model: row.model,
          status: 'connected',
          apiKey: '********',  // a chave real nunca é retornada ao cliente
        };
      }

      return res.json(result);
    }

    if (req.method === 'POST') {
      // ── 2. Modificações exigem role admin ─────────────────
      if (ctx.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão insuficiente.' });
      }

      const body = req.body || {};
      // organizationId removido do body — nunca confiamos em IDs do cliente.
      const { provider, apiKey, model, action } = body;

      if (action === 'disconnect') {
        if (!provider) {
          return res.status(400).json({ error: 'provider é obrigatório.' });
        }

        const { error } = await supabase
          .from('organization_ai_credentials')
          .delete()
          .eq('organization_id', ctx.companyId)   // companyId do JWT
          .eq('ai_provider', provider);

        if (error) return res.status(500).json({ error: 'Falha ao desconectar.' });
        return res.json({ success: true });
      }

      if (!provider || !model) {
        return res.status(400).json({ error: 'provider e model são obrigatórios.' });
      }

      let finalKey = apiKey;
      if (!apiKey || apiKey === '********') {
        const { data: existing } = await supabase
          .from('organization_ai_credentials')
          .select('ai_api_key')
          .eq('organization_id', ctx.companyId)   // companyId do JWT
          .eq('ai_provider', provider)
          .single();

        if (!existing?.ai_api_key) {
          return res.status(400).json({ error: 'API key é obrigatória.' });
        }
        finalKey = existing.ai_api_key;
      }

      const { error } = await supabase
        .from('organization_ai_credentials')
        .upsert(
          {
            organization_id: ctx.companyId,         // companyId do JWT
            ai_provider: provider,
            ai_api_key: finalKey,
            model,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,ai_provider' }
        );

      if (error) return res.status(500).json({ error: 'Falha ao salvar credencial.' });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[api/ai/credentials] Error:', error);
    return res.status(500).json({ error: 'Erro interno.' });  // sem leak de detalhes
  }
}
