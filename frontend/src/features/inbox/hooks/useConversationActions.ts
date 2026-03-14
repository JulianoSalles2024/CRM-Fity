import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';

export function useConversationActions(conversationId: string | null, leadId: string | null) {
  const { companyId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Limpar mensagens ───────────────────────────────────────────────────────
  // Apaga todas as mensagens da conversa e zera o preview visual.
  // A conversation permanece intacta.
  const clearMessages = useCallback(async (): Promise<boolean> => {
    if (!conversationId || !companyId) return false;
    setIsLoading(true);
    setError(null);

    const { error: delErr } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('company_id', companyId);

    if (delErr) {
      setError('Não foi possível limpar as mensagens.');
      setIsLoading(false);
      return false;
    }

    // Zera preview para não deixar rastro visual na lista
    await supabase
      .from('conversations')
      .update({ last_message_preview: null, unread_count: 0 })
      .eq('id', conversationId)
      .eq('company_id', companyId);

    setIsLoading(false);
    return true;
  }, [conversationId, companyId]);

  // ── Bloquear contato ───────────────────────────────────────────────────────
  // Proteção dupla:
  //   1. conversations.status = 'blocked' → WF-03 para de processar
  //   2. leads.is_blocked = true          → WF-01 checará em momento futuro
  const blockContact = useCallback(async (): Promise<boolean> => {
    if (!conversationId || !companyId) return false;
    setIsLoading(true);
    setError(null);

    const { error: convErr } = await supabase
      .from('conversations')
      .update({ status: 'blocked' })
      .eq('id', conversationId)
      .eq('company_id', companyId);

    if (convErr) {
      setError('Não foi possível bloquear o contato.');
      setIsLoading(false);
      return false;
    }

    // Bloqueia o lead se existir (pode ser null em conversas sem lead vinculado)
    if (leadId) {
      await supabase
        .from('leads')
        .update({ is_blocked: true })
        .eq('id', leadId)
        .eq('company_id', companyId);
    }

    setIsLoading(false);
    return true;
  }, [conversationId, leadId, companyId]);

  // ── Apagar conversa ────────────────────────────────────────────────────────
  // DELETE CASCADE já configurado no schema:
  // messages, followup_events, escalation_logs e ai_agent_runs são
  // apagados automaticamente pelo Postgres.
  const deleteConversation = useCallback(async (): Promise<boolean> => {
    if (!conversationId || !companyId) return false;
    setIsLoading(true);
    setError(null);

    const { error: delErr } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('company_id', companyId);

    if (delErr) {
      setError('Não foi possível apagar a conversa.');
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true;
  }, [conversationId, companyId]);

  return { clearMessages, blockContact, deleteConversation, isLoading, error };
}
