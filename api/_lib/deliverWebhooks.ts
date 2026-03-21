import { supabaseAdmin } from './supabase.js';

export async function deliverWebhooks(
  companyId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    // Busca todos os webhooks ativos da empresa e filtra por evento em JS
    // (evita problemas com tipo da coluna events no Supabase)
    const { data: webhooks, error } = await supabaseAdmin
      .from('outgoing_webhooks')
      .select('id, url, events')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      console.error('[deliverWebhooks] erro ao buscar webhooks:', error.message);
      return;
    }

    console.log(`[deliverWebhooks] empresa=${companyId} evento=${event} webhooks encontrados=${webhooks?.length ?? 0}`);

    if (!webhooks?.length) return;

    // Filtra os que têm o evento cadastrado (suporta array e string)
    const targets = webhooks.filter(wh => {
      const evts = wh.events;
      if (!evts) return false;
      if (Array.isArray(evts)) return evts.includes(event);
      if (typeof evts === 'string') return evts.includes(event);
      return false;
    });

    console.log(`[deliverWebhooks] targets após filtro de evento: ${targets.length}`);

    if (!targets.length) return;

    const body = JSON.stringify({
      event,
      company_id: companyId,
      timestamp:  new Date().toISOString(),
      data:       payload,
    });

    await Promise.allSettled(
      targets.map(wh =>
        fetch(wh.url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal:  AbortSignal.timeout(8000),
        })
        .then(r => {
          console.log(`[deliverWebhooks] ${wh.url} → ${r.status}`);
          if (!r.ok) console.warn(`[deliverWebhooks] resposta não-ok: ${r.status}`);
        })
        .catch(err => {
          console.warn(`[deliverWebhooks] falha ao entregar para ${wh.url}:`, err.message);
        }),
      ),
    );
  } catch (err) {
    console.error('[deliverWebhooks] erro interno:', err);
  }
}
