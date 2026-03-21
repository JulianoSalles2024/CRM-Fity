import { supabaseAdmin } from './supabase.js';

// ── Entrega eventos para os webhooks de saída cadastrados ──────
//
// Fire-and-forget: não bloqueia a resposta ao cliente.
// Erros de entrega são logados mas não propagados.
//
export async function deliverWebhooks(
  companyId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: webhooks } = await supabaseAdmin
      .from('outgoing_webhooks')
      .select('id, url')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .contains('events', [event]);

    if (!webhooks?.length) return;

    const body = JSON.stringify({
      event,
      company_id: companyId,
      timestamp:  new Date().toISOString(),
      data:       payload,
    });

    await Promise.allSettled(
      webhooks.map(wh =>
        fetch(wh.url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal:  AbortSignal.timeout(8000),
        }).then(r => {
          if (!r.ok) console.warn(`[webhook] ${wh.url} respondeu ${r.status}`);
        }).catch(err => {
          console.warn(`[webhook] falha ao entregar para ${wh.url}:`, err.message);
        }),
      ),
    );
  } catch (err) {
    console.error('[deliverWebhooks] erro interno:', err);
  }
}
