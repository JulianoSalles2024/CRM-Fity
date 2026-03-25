/**
 * StartConversationModal.tsx
 *
 * Permite ao vendedor escolher qual channel_connection (WhatsApp) usar
 * e confirmar o número do lead antes de criar a conversa no Omnichannel.
 * Chama a RPC `resolve_or_create_conversation` e retorna o conversation_id.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Phone, Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/features/auth/AuthContext';
import { useChannelConnections } from '@/src/hooks/useChannelConnections';
import type { Lead } from '@/types';

interface StartConversationModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}

/** Strip máscara e garante DDI 55 (Brasil) na frente */
function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // Se já tem 12+ dígitos começando com 55, está correto
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  // 10 ou 11 dígitos = DDD + número sem DDI → prepend 55
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

export const StartConversationModal: React.FC<StartConversationModalProps> = ({
  lead,
  onClose,
  onSuccess,
}) => {
  const { user, companyId, currentUserRole } = useAuth();

  const { connections, loading: loadingConnections } = useChannelConnections(companyId, {
    userId: user?.id,
    role: currentUserRole,
  });

  // Só WhatsApp ativos
  const activeWhatsapp = connections.filter(
    c => c.channel === 'whatsapp' && c.status === 'active',
  );

  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-seleciona se houver apenas uma conexão disponível
  useEffect(() => {
    if (activeWhatsapp.length === 1 && !selectedConnectionId) {
      setSelectedConnectionId(activeWhatsapp[0].id);
    }
  }, [activeWhatsapp, selectedConnectionId]);

  const handleSubmit = async () => {
    setError(null);

    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone) {
      setError('Informe o número de telefone do lead (com DDD e DDI).');
      return;
    }
    if (!selectedConnectionId) {
      setError('Selecione qual WhatsApp usar para iniciar a conversa.');
      return;
    }
    if (!companyId || !user?.id) {
      setError('Sessão inválida. Faça login novamente.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('resolve_or_create_conversation', {
        p_company_id: companyId,
        p_channel_connection_id: selectedConnectionId,
        p_channel: 'whatsapp',
        p_contact_identifier: cleanPhone,
        p_contact_name: lead.name ?? null,
        p_external_conversation_id: null,
        p_lead_id: lead.id as string,
        p_assignee_id: user.id,
      });

      if (rpcError) throw rpcError;

      const conversationId = (data as { conversation_id: string })?.conversation_id ?? data;
      if (!conversationId) throw new Error('Resposta inesperada do servidor.');

      onSuccess(conversationId);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar conversa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Iniciar Conversa</h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Canal WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Canal WhatsApp
            </label>
            {loadingConnections ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando conexões…
              </div>
            ) : activeWhatsapp.length === 0 ? (
              <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <WifiOff className="w-4 h-4 shrink-0" />
                Nenhuma conexão WhatsApp ativa disponível.
              </div>
            ) : (
              <div className="space-y-2">
                {activeWhatsapp.map(conn => (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => setSelectedConnectionId(conn.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedConnectionId === conn.id
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                        : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Wifi className={`w-4 h-4 shrink-0 ${selectedConnectionId === conn.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-sm font-medium truncate">{conn.name}</span>
                    {selectedConnectionId === conn.id && (
                      <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        SELECIONADO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Número de telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">
              Inclua o código do país e DDD, sem espaços. Ex: <span className="text-slate-500">5511912345678</span>
            </p>
          </div>

          {/* Erro */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || activeWhatsapp.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Criando…</>
            ) : (
              <><MessageSquare className="w-4 h-4" /> Iniciar Conversa</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
