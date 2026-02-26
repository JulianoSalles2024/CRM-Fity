import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_provider, ai_api_key, model')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ error: 'Failed to fetch credentials', detail: error.message, code: error.code });
      }

      if (!data) return res.json({});

      return res.json({
        [data.ai_provider]: {
          provider: data.ai_provider,
          model: data.model,
          status: 'connected',
          apiKey: '********',
        },
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { userId, provider, apiKey, model, action } = body;

      if (action === 'disconnect') {
        if (!userId || !provider) {
          return res.status(400).json({ error: 'Missing fields' });
        }
        const { error } = await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', userId);

        if (error) return res.status(500).json({ error: 'Failed to disconnect' });
        return res.json({ success: true });
      }

      if (!userId || !provider || !model) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let finalKey = apiKey;
      if (!apiKey || apiKey === '********') {
        const { data: existing } = await supabase
          .from('user_settings')
          .select('ai_api_key')
          .eq('user_id', userId)
          .single();

        if (!existing?.ai_api_key) {
          return res.status(400).json({ error: 'API key is required' });
        }
        finalKey = existing.ai_api_key;
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: userId, ai_provider: provider, ai_api_key: finalKey, model, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
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
