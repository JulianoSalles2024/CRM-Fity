// ── Rate limiter — sliding window em memória ──────────────────
//
// Sem dependências externas. Estado por instância de função Vercel —
// cold starts resetam o mapa, o que é aceitável para este uso.
//
// Limite padrão: 20 requisições / minuto por userId.

const requestTimestamps = new Map<string, number[]>();

const WINDOW_MS  = 60_000;  // 1 minuto
const MAX_REQUESTS = 20;

/**
 * Retorna true se o userId excedeu o limite da janela atual.
 * Em caso negativo, registra o timestamp da requisição corrente.
 */
export function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (requestTimestamps.get(userId) ?? [])
    .filter(t => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    requestTimestamps.set(userId, recent);
    return true;
  }

  recent.push(now);
  requestTimestamps.set(userId, recent);
  return false;
}
