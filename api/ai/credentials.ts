import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { organizationId } = req.query;
      if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

      const { data, error } = await supabase
        .from('organization_ai_credentials')
        .select('ai_provider, ai_api_key, model')
        .eq('organization_id', organizationId);

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch credentials', detail: error.message });
      }

      if (!data || data.length === 0) return res.json({});

      const result: Record<string, object> = {};
      for (const row of data) {
        result[row.ai_provider] = {
          provider: row.ai_provider,
          model: row.model,
          status: 'connected',
          apiKey: '********',
        };
      }

      return res.json(result);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { organizationId, provider, apiKey, model, action } = body;

      if (action === 'disconnect') {
        if (!organizationId || !provider) {
          return res.status(400).json({ error: 'Missing fields' });
        }
        const { error } = await supabase
          .from('organization_ai_credentials')
          .delete()
          .eq('organization_id', organizationId)
          .eq('ai_provider', provider);

        if (error) return res.status(500).json({ error: 'Failed to disconnect' });
        return res.json({ success: true });
      }

      if (!organizationId || !provider || !model) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let finalKey = apiKey;
      if (!apiKey || apiKey === '********') {
        const { data: existing } = await supabase
          .from('organization_ai_credentials')
          .select('ai_api_key')
          .eq('organization_id', organizationId)
          .eq('ai_provider', provider)
          .single();

        if (!existing?.ai_api_key) {
          return res.status(400).json({ error: 'API key is required' });
        }
        finalKey = existing.ai_api_key;
      }

      const { error } = await supabase
        .from('organization_ai_credentials')
        .upsert(
          {
            organization_id: organizationId,
            ai_provider: provider,
            ai_api_key: finalKey,
            model,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,ai_provider' }
        );

      if (error) return res.status(500).json({ error: 'Failed to save credential' });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[api/ai/credentials] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
