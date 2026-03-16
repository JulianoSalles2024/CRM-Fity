import { supabaseAdmin } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';
import { AppError, apiError } from '../_lib/errors.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ctx = await requireAuth(req);
    const { companyId } = ctx;

    // Fetch all channel_connections for this company
    const { data: connections, error } = await supabaseAdmin
      .from('channel_connections')
      .select('id, name, channel, external_id, status, config, is_active, updated_at')
      .eq('company_id', companyId);

    if (error) throw new AppError(500, 'Erro ao buscar conexões.');

    const results = await Promise.all(
      (connections ?? []).map(async (conn: any) => {
        const base: Record<string, any> = {
          id: conn.id,
          name: conn.name,
          channel: conn.channel,
          external_id: conn.external_id,
          db_status: conn.status,
          is_active: conn.is_active,
          updated_at: conn.updated_at,
          evolution_state: 'unknown',
          evolution_error: null,
        };

        if (conn.channel !== 'whatsapp' || !conn.external_id) return base;

        // Evolution API config: prefer conn.config, fallback to env
        const evolutionUrl =
          conn.config?.evolution_url ??
          process.env.EVOLUTION_API_URL ??
          null;
        const apiKey =
          conn.config?.api_key ??
          process.env.EVOLUTION_API_KEY ??
          null;

        if (!evolutionUrl || !apiKey) {
          base.evolution_error = 'Evolution API URL ou API Key não configurados.';
          return base;
        }

        try {
          const url = `${evolutionUrl.replace(/\/$/, '')}/instance/connectionState/${encodeURIComponent(conn.external_id)}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: { apikey: apiKey },
            signal: AbortSignal.timeout(6000),
          });

          if (response.ok) {
            const json = await response.json();
            // Evolution API v2 returns { instance: { instanceName, state } }
            // Evolution API v1 returns { state: ... }
            const state =
              json?.instance?.state ??
              json?.state ??
              'unknown';
            base.evolution_state = state; // 'open' | 'connecting' | 'close'
          } else {
            base.evolution_state = 'error';
            base.evolution_error = `Evolution API retornou ${response.status}`;
          }
        } catch (err: any) {
          base.evolution_state = 'error';
          base.evolution_error = err?.message ?? 'Timeout ou conexão recusada';
        }

        return base;
      })
    );

    return res.status(200).json({ connections: results, checked_at: new Date().toISOString() });
  } catch (err) {
    return apiError(res, err);
  }
}
