import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase.js';
import { AuthError } from './errors.js';

// ── Contexto de autenticação retornado por requireAuth() ──────
export interface AuthContext {
  userId: string;
  companyId: string;             // sempre derivado do JWT — nunca do request
  role: 'admin' | 'seller' | 'user';
}

// ── requireAuth ───────────────────────────────────────────────
//
// Valida o JWT do header Authorization e retorna o contexto
// seguro do usuário autenticado.
//
// Usa um client Supabase por-requisição com o token do usuário
// (abordagem correta para Supabase JS v2 — evita o bug
// "Auth session missing!" do supabaseAdmin.auth.getUser(jwt)).
//
export async function requireAuth(req: any): Promise<AuthContext> {
  const raw = (
    req.headers['authorization'] ?? req.headers['Authorization']
  ) as string | undefined;

  const token = raw?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new AuthError(401, 'Token de autenticação obrigatório.');
  }

  const supabaseUrl  = process.env.SUPABASE_URL!.trim();
  const supabaseAnon = (process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

  if (!supabaseAnon) {
    throw new AuthError(500, 'SUPABASE_ANON_KEY não configurada no servidor.');
  }

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    throw new AuthError(401, 'Token inválido ou expirado.');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new AuthError(403, 'Perfil sem empresa associada. Contate o suporte.');
  }

  return {
    userId: user.id,
    companyId: profile.company_id,
    role: profile.role as AuthContext['role'],
  };
}

// ── requireRole ───────────────────────────────────────────────
export function requireRole(ctx: AuthContext, role: 'admin'): void {
  if (ctx.role !== role) {
    throw new AuthError(403, 'Permissão insuficiente.');
  }
}
