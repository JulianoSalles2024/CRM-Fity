import { createHash, randomBytes } from 'crypto';
import { supabaseAdmin } from '../_lib/supabase.js';
import { requireAuth, requireRole } from '../_lib/auth.js';
import { AppError, apiError } from '../_lib/errors.js';

export default async function handler(req: any, res: any) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, 'admin');
    const { companyId } = ctx;

    // ── GET /api/api-keys — list ────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .select('id, name, key_preview, last_used_at, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw new AppError(500, 'Erro ao listar chaves.');
      return res.status(200).json({ keys: data ?? [] });
    }

    // ── POST /api/api-keys — create ─────────────────────────────
    if (req.method === 'POST') {
      const { name } = req.body ?? {};
      if (!name?.trim()) throw new AppError(400, 'Nome é obrigatório.');

      // Generate: sk_live_ + 64 hex chars (256 bits of entropy)
      const raw     = `sk_live_${randomBytes(32).toString('hex')}`;
      const hash    = createHash('sha256').update(raw).digest('hex');
      const preview = `${raw.slice(0, 16)}...${raw.slice(-4)}`;

      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .insert({ company_id: companyId, name: name.trim(), key_hash: hash, key_preview: preview })
        .select('id, name, key_preview, last_used_at, created_at')
        .single();

      if (error) throw new AppError(500, 'Erro ao criar chave.');
      // 'key' (plain text) returned ONCE — never stored
      return res.status(201).json({ key: raw, ...data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
