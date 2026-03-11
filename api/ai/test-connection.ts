import { createClient } from '@supabase/supabase-js';
import { testProviderConnection } from '../_utils.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Inline auth helper ────────────────────────────────────────
// Temporário — será substituído por api/_lib/auth.ts na Fase 2.
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Autenticação obrigatória ───────────────────────────
  const ctx = await getAuthContext(req);
  if (!ctx) {
    return res.status(401).json({ error: 'Autenticação obrigatória.' });
  }

  // userId removido do body — não é necessário quando temos o JWT.
  // A apiKey vem do formulário do frontend (antes de salvar).
  const { provider, model, apiKey } = req.body;

  if (!provider || !model) {
    return res.status(400).json({ error: 'provider e model são obrigatórios.' });
  }

  // Se a apiKey for o placeholder, recusa — não buscamos mais por userId livre.
  // O teste deve sempre ser feito com a chave real digitada no formulário.
  if (!apiKey || apiKey === '********') {
    return res.status(400).json({
      success: false,
      message: 'Insira uma API Key válida para testar a conexão.',
    });
  }

  try {
    await testProviderConnection(provider, model, apiKey);
    res.json({ success: true, message: 'Conexão estabelecida com sucesso!' });
  } catch (error: any) {
    console.error('[api/ai/test-connection]', error);
    res.status(400).json({ success: false, message: 'Falha na conexão. Verifique a chave e o modelo.' });
  }
}
