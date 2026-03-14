import React, { useState, useEffect } from 'react';
import { X, Bot, Zap, LayoutGrid, BookOpen, Code2, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/src/lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Tab = 'auto' | 'templates' | 'learn' | 'advanced';

interface TemplateOption {
  id: string;
  label: string;
  description: string;
  prompt: string;
}

// ── Templates de metodologia ──────────────────────────────────────────────────

const TEMPLATES: TemplateOption[] = [
  {
    id: 'bant',
    label: 'BANT',
    description: 'Budget, Authority, Need, Timeline',
    prompt:
      'Você é um agente de vendas especialista na metodologia BANT. Ao interagir com leads, qualifique-os identificando: Budget (orçamento disponível), Authority (quem decide a compra), Need (necessidade real do produto) e Timeline (prazo para decisão). Seja objetivo, profissional e consultivo. Faça perguntas diretas para entender cada critério e registre as informações relevantes para o time de vendas.',
  },
  {
    id: 'spin',
    label: 'SPIN Selling',
    description: 'Situação, Problema, Implicação, Necessidade',
    prompt:
      'Você é um agente de vendas treinado na metodologia SPIN Selling. Conduza as conversas explorando: Situação (contexto atual do cliente), Problema (dificuldades que enfrenta), Implicação (consequências do problema não resolvido) e Necessidade de Solução (benefícios da solução). Use perguntas abertas para aprofundar o entendimento e gerar valor antes de apresentar a solução.',
  },
  {
    id: 'meddic',
    label: 'MEDDIC',
    description: 'Métricas, Comprador, Critérios, Processo, Dor, Defensor',
    prompt:
      'Você é um agente especializado na metodologia MEDDIC para vendas complexas. Qualifique cada oportunidade levantando: Metrics (métricas de sucesso do cliente), Economic Buyer (quem tem poder de compra), Decision Criteria (critérios de decisão), Decision Process (processo de decisão), Identify Pain (dores identificadas) e Champion (defensor interno). Seja consultivo e estratégico em cada interação.',
  },
  {
    id: 'gpct',
    label: 'GPCT',
    description: 'Goals, Plans, Challenges, Timeline',
    prompt:
      'Você é um agente de vendas que utiliza a metodologia GPCT. Nas interações, explore: Goals (metas e objetivos do cliente), Plans (planos atuais para atingi-los), Challenges (desafios que impedem o progresso) e Timeline (urgência e prazo para decisão). Alinhe a proposta de valor da solução diretamente aos objetivos declarados pelo cliente.',
  },
  {
    id: 'simple',
    label: 'Simples',
    description: 'Abordagem direta e amigável',
    prompt:
      'Você é um assistente de vendas amigável e direto. Responda às dúvidas do cliente sobre o produto, colete informações de contato e interesse, e encaminhe leads qualificados para o time de vendas humano. Seja cordial, claro e objetivo em todas as interações.',
  },
];

// ── Estilos compartilhados ────────────────────────────────────────────────────

const inputCls =
  'w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all';

// ── Componente Toggle ─────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      checked ? 'bg-blue-600' : 'bg-slate-700'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface PipelineAIModalProps {
  boardId: string;
  boardName: string;
  companyId: string;
  onClose: () => void;
  onSaved?: () => void;
}

// ── Componente principal ──────────────────────────────────────────────────────

const PipelineAIModal: React.FC<PipelineAIModalProps> = ({
  boardId,
  boardName,
  companyId,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('auto');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega configuração atual do board
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('boards')
        .select('ai_enabled, ai_prompt, ai_methodology')
        .eq('id', boardId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (data) {
        setAiEnabled(data.ai_enabled ?? false);
        setPrompt(data.ai_prompt ?? '');
        setSelectedTemplate(data.ai_methodology ?? null);
        if (data.ai_methodology) setActiveTab('templates');
        else if (data.ai_prompt) setActiveTab('advanced');
      }
      setIsLoading(false);
    };
    load();
  }, [boardId, companyId]);

  const handleSelectTemplate = (t: TemplateOption) => {
    setSelectedTemplate(t.id);
    setPrompt(t.prompt);
    setActiveTab('templates');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from('boards')
      .update({
        ai_enabled: aiEnabled,
        ai_prompt: prompt || null,
        ai_methodology: selectedTemplate,
      })
      .eq('id', boardId)
      .eq('company_id', companyId);

    if (err) {
      setError('Não foi possível salvar. Tente novamente.');
    } else {
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    }
    setIsSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'auto', label: 'Automático', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'learn', label: 'Aprender', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'advanced', label: 'Avançado', icon: <Code2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0B1220] border border-slate-800 rounded-2xl shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Agente de IA</h3>
              <p className="text-xs text-slate-500">{boardName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {aiEnabled ? 'Ativo' : 'Inativo'}
              </span>
              <Toggle checked={aiEnabled} onChange={setAiEnabled} />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/5 px-6 pt-4 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-blue-500 bg-blue-500/5'
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* ── Automático ─────────────────────────────────────── */}
              {activeTab === 'auto' && (
                <div className="space-y-4">
                  <div className="bg-[#0F172A] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Comportamento padrão</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          O agente utilizará as instruções globais configuradas para a sua empresa.
                          Ideal para começar rapidamente sem precisar personalizar o prompt.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0F172A] border border-white/5 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">O agente irá</p>
                    {[
                      'Responder dúvidas sobre o produto automaticamente',
                      'Qualificar leads com perguntas de triagem',
                      'Escalar para humano quando necessário',
                      'Registrar informações coletadas no CRM',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        </div>
                        <span className="text-xs text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Templates ──────────────────────────────────────── */}
              {activeTab === 'templates' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Selecione uma metodologia. O prompt será pré-preenchido automaticamente e pode ser editado na aba <span className="text-blue-400">Avançado</span>.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {TEMPLATES.map((t) => {
                      const isSelected = selectedTemplate === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTemplate(t)}
                          className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500/40 text-white'
                              : 'bg-[#0F172A] border-white/5 text-slate-300 hover:border-white/10 hover:bg-white/5'
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-semibold ${isSelected ? 'text-blue-300' : ''}`}>
                              {t.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                          </div>
                          {isSelected && <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Aprender ───────────────────────────────────────── */}
              {activeTab === 'learn' && (
                <div className="space-y-4">
                  <div className="bg-[#0F172A] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Base de conhecimento (RAG)</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Treine o agente com documentos, FAQs, scripts de vendas e materiais internos.
                          O agente consultará essa base para responder com precisão sobre o seu produto.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0F172A] border border-white/5 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Você pode adicionar</p>
                    {[
                      'PDFs e documentos de produto',
                      'Perguntas frequentes (FAQ)',
                      'Scripts de abordagem de vendas',
                      'Políticas de preço e condições comerciais',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        </div>
                        <span className="text-xs text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="/settings/knowledge"
                    className="flex items-center justify-between w-full px-4 py-3 bg-[#0F172A] border border-white/5 rounded-xl text-sm text-blue-400 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group"
                  >
                    <span className="font-medium">Ir para Treinamento</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              )}

              {/* ── Avançado ───────────────────────────────────────── */}
              {activeTab === 'advanced' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Escreva instruções personalizadas para este pipeline. O prompt aqui substituirá
                    qualquer template selecionado.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Prompt do agente
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={10}
                      placeholder="Ex: Você é um agente de vendas especializado em SaaS B2B. Seu objetivo é..."
                      className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
                    />
                    <p className="text-xs text-slate-600 mt-1.5">
                      {prompt.length} caracteres
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex-1">
                {saved && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Configurações salvas
                  </div>
                )}
                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PipelineAIModal;
