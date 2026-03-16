import { supabaseAdmin } from '../_lib/supabase.js';
import { requireAuth, requireRole } from '../_lib/auth.js';
import { AppError, apiError } from '../_lib/errors.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, 'admin');
    const { companyId } = ctx;

    const { id } = req.query;
    if (!id) throw new AppError(400, 'ID obrigatório.');

    // company_id guard — impede revogar chave de outra empresa
    const { error } = await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw new AppError(500, 'Erro ao revogar chave.');
    return res.status(204).end();
  } catch (err) {
    return apiError(res, err);
  }
}
