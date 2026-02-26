import { createClient } from '@supabase/supabase-js';
import { testProviderConnection } from '../_utils.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { provider, model, apiKey, userId } = req.body;

  if (!apiKey || apiKey === '********') {
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId necessário para testar chave armazenada.' });
    }
    const { data } = await supabase
      .from('user_settings')
      .select('ai_api_key')
      .eq('user_id', userId)
      .single();

    if (!data?.ai_api_key) {
      return res.status(400).json({ success: false, message: 'Nenhuma chave armazenada para este provedor.' });
    }
    apiKey = data.ai_api_key;
  }

  try {
    await testProviderConnection(provider, model, apiKey);
    res.json({ success: true, message: 'Conexão estabelecida com sucesso!' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Falha na conexão' });
  }
}
