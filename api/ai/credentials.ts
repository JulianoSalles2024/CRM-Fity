import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('ai_provider, ai_api_key, model')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found — não é erro, apenas sem credencial salva
      return res.status(500).json({ error: 'Failed to fetch credentials' });
    }

    if (!data) {
      return res.json({});
    }

    // Retorna no formato Record<provider, AICredential> esperado pelo frontend
    const credentials: Record<string, unknown> = {
      [data.ai_provider]: {
        provider: data.ai_provider,
        model: data.model,
        status: 'connected',
        apiKey: '********',
      },
    };

    return res.json(credentials);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { userId, provider, apiKey, model } = body;

    if (!userId || !provider || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let finalKey = apiKey;

    // Se o frontend enviou '********', preservar a chave existente
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
        {
          user_id: userId,
          ai_provider: provider,
          ai_api_key: finalKey,
          model,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      return res.status(500).json({ error: 'Failed to save credential' });
    }

    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
