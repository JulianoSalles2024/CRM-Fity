import type { InstallState } from '../context/InstallContext';
import { runMigrations } from '../../../server/install/runMigrations';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, '');
}

// ── 1. Verificar infraestrutura ───────────────────────────────────────────────
// Tests both tokens and auto-detects the Vercel project (matches current domain
// or falls back to the first project in the account).
export async function verificarInfraestrutura(
  state: InstallState,
): Promise<{ vercelProjectId: string }> {
  // Verify Vercel token
  const vRes = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${state.vercelToken}` },
  });
  if (!vRes.ok) {
    throw new Error('Token da Vercel inválido. Verifique e tente novamente.');
  }

  // Verify Supabase connection
  const sbUrl = normalizeUrl(state.supabaseUrl);
  const sRes = await fetch(`${sbUrl}/rest/v1/`, {
    headers: {
      Authorization: `Bearer ${state.supabaseServiceKey}`,
      apikey: state.supabaseServiceKey,
    },
  });
  if (!sRes.ok) {
    throw new Error('Não foi possível conectar ao Supabase. Verifique a URL e o token.');
  }

  // List Vercel projects and match current hostname (or use first)
  const pRes = await fetch('https://api.vercel.com/v9/projects?limit=20', {
    headers: { Authorization: `Bearer ${state.vercelToken}` },
  });
  if (!pRes.ok) throw new Error('Erro ao listar projetos da Vercel.');
  const { projects } = await pRes.json();
  if (!projects?.length) throw new Error('Nenhum projeto encontrado na Vercel.');

  const hostname = window.location.hostname;
  const matched = projects.find((p: any) =>
    p.alias?.some((a: any) => (a.domain ?? '').includes(hostname)),
  );
  const project = matched ?? projects[0];

  return { vercelProjectId: project.id as string };
}

// ── 2. Criar variáveis de ambiente na Vercel ──────────────────────────────────
export async function criarEnvVars(
  state: InstallState,
  projectId: string,
): Promise<void> {
  const sbUrl = normalizeUrl(state.supabaseUrl);

  const vars = [
    { key: 'VITE_SUPABASE_URL',      value: sbUrl,                 type: 'plain', target: ['production'] },
    { key: 'VITE_SUPABASE_ANON_KEY', value: state.supabaseAnonKey, type: 'plain', target: ['production'] },
    { key: 'SUPABASE_SERVICE_ROLE_KEY',     value: state.supabaseServiceKey,  type: 'encrypted', target: ['production'] },
  ];

  for (const v of vars) {
    const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${state.vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(v),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Vercel returns 400 + ENV_ALREADY_EXISTS when the variable was created
      // by a previous run. This is expected on retries — skip and continue.
      if (err?.error?.code === 'ENV_ALREADY_EXISTS') continue;
      throw new Error(err.error?.message ?? `Erro ao criar variável ${v.key}.`);
    }
  }
}

// ── 3. Criar usuário administrador no Supabase Auth ───────────────────────────
export async function criarAdmin(state: InstallState): Promise<string> {
  const sbUrl = normalizeUrl(state.supabaseUrl);

  const res = await fetch(`${sbUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${state.supabaseServiceKey}`,
      apikey: state.supabaseServiceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: state.adminEmail,
      password: state.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: state.adminName },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Erro ao criar usuário administrador.');
  }

  const data = await res.json();
  return data.id as string;
}

// ── 4. Rodar migrations ───────────────────────────────────────────────────────
// Must run BEFORE criarAdmin so the profiles table exists when the
// handle_new_user trigger fires on Auth user creation.
// Requires a Personal Access Token (PAT). Non-fatal if absent or on failure.
export async function rodarMigrations(state: InstallState): Promise<void> {
  if (!state.supabasePatToken) return;

  const sbUrl = normalizeUrl(state.supabaseUrl);
  try {
    const { ran, skipped, error } = await runMigrations(sbUrl, state.supabasePatToken);
    if (error) {
      console.warn('[install] Migration warning (non-fatal):', error);
    } else {
      console.info('[install] Migrations ran:', ran, '| skipped:', skipped);
    }
  } catch (err) {
    console.warn('[install] Migration error (non-fatal):', err);
  }

  await sleep(600);
}

// ── 5. Upsert perfil do administrador ────────────────────────────────────────
// Runs AFTER criarAdmin. Writes role='admin' to the profiles table.
// Non-fatal: if the table doesn't exist (no PAT provided) the row will be
// created by the handle_new_user trigger once the schema is applied.
export async function upsertAdminProfile(
  state: InstallState,
  adminUserId: string,
): Promise<void> {
  const sbUrl = normalizeUrl(state.supabaseUrl);

  await fetch(`${sbUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${state.supabaseServiceKey}`,
      apikey: state.supabaseServiceKey,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: adminUserId,
      full_name: state.adminName,
      role: 'admin',
      is_active: true,
    }),
  });
}

// ── 5. Acionar redeploy na Vercel ─────────────────────────────────────────────
export async function triggerRedeploy(
  vercelToken: string,
  projectId: string,
): Promise<void> {
  // Get the latest production deployment
  const dRes = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${projectId}&target=production&limit=1`,
    { headers: { Authorization: `Bearer ${vercelToken}` } },
  );
  if (!dRes.ok) throw new Error('Erro ao buscar deployments da Vercel.');

  const { deployments } = await dRes.json();
  if (!deployments?.length) return; // Nothing to redeploy on a fresh project

  const deployment = deployments[0];
  const rRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deploymentId: deployment.uid,
      name: deployment.name,
      target: 'production',
    }),
  });

  if (!rRes.ok) {
    const err = await rRes.json().catch(() => ({}));
    throw new Error(err.error?.message ?? 'Erro ao acionar redeploy na Vercel.');
  }
}
