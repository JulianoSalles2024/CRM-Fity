import React, { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check,
  Target, MessageSquare, DollarSign, RefreshCw,
  Database, Eye, Bot, Zap, FileText, RotateCcw,
} from 'lucide-react';
import type { AgentFunctionType, AgentTone, AgentInsert } from './hooks/useAgents';
import { getDefaultPrompt } from './agentPrompts';

const FUNCTION_OPTIONS: {
  value: AgentFunctionType; label: string; desc: string; icon: React.ElementType; color: string;
}[] = [
  { value: 'hunter',     label: 'Hunter',     desc: 'Prospecta leads frios e mapeia novos contatos',        icon: Target,        color: '#f97316' },
  { value: 'sdr',        label: 'SDR',        desc: 'Qualifica leads e agenda reuniões com closers',        icon: MessageSquare, color: '#60a5fa' },
  { value: 'closer',     label: 'Closer',     desc: 'Fecha negócios e supera objeções finais',              icon: DollarSign,    color: '#34d399' },
  { value: 'followup',   label: 'Follow-up',  desc: 'Recupera leads e mantém relacionamento ativo',         icon: RefreshCw,     color: '#a78bfa' },
  { value: 'curator',    label: 'Curator',    desc: 'Higieniza base e enriquece dados dos leads',           icon: Database,      color: '#22d3ee' },
  { value: 'supervisor', label: 'Supervisor', desc: 'Monitora agentes e coordena o time comercial',         icon: Eye,           color: '#fbbf24' },
];

const TONE_OPTIONS: { value: AgentTone; label: string; desc: string }[] = [
  { value: 'formal',      label: 'Formal',       desc: 'Linguagem profissional e distante' },
  { value: 'consultivo',  label: 'Consultivo',   desc: 'Foca em entender e resolver problemas' },
  { value: 'descontraido',label: 'Descontraído', desc: 'Leve, próximo e amigável' },
  { value: 'tecnico',     label: 'Técnico',      desc: 'Detalhado e orientado a dados' },
  { value: 'agressivo',   label: 'Agressivo',    desc: 'Orientado a resultado, urgência alta' },
];

const CHANNEL_OPTIONS = ['whatsapp', 'email', 'sms', 'instagram', 'linkedin'];
const GOAL_METRICS: { value: string; label: string }[] = [
  { value: 'leads', label: 'Leads prospectados' },
  { value: 'meetings', label: 'Reuniões agendadas' },
  { value: 'sales', label: 'Vendas fechadas' },
  { value: 'revenue', label: 'Receita gerada (R$)' },
  { value: 'qualified', label: 'Leads qualificados' },
];
const AVATAR_COLORS = [
  '#60a5fa','#34d399','#f97316','#a78bfa','#22d3ee','#fbbf24','#f87171','#fb7185',
];
const CLIENT_TYPES: { value: 'low' | 'medium' | 'high'; label: string; desc: string }[] = [
  { value: 'low',    label: 'SMB',        desc: 'Pequenas empresas e autônomos' },
  { value: 'medium', label: 'Mid-Market', desc: 'Médias empresas, 50-500 funcionários' },
  { value: 'high',   label: 'Enterprise', desc: 'Grandes corporações, ticket alto' },
];

const STEPS = [
  { label: 'Tipo', desc: 'Função do agente' },
  { label: 'Identidade', desc: 'Nome e personalidade' },
  { label: 'Canais', desc: 'Onde vai atuar' },
  { label: 'Meta', desc: 'Objetivo mensal' },
  { label: 'Regras', desc: 'Escalação e limites' },
  { label: 'Prompt', desc: 'Instruções do agente' },
];

type FormData = Omit<AgentInsert, 'escalate_rules'> & {
  escalate_rules: {
    max_followups: number;
    min_ticket_to_escalate: number | null;
    keywords: string[];
    escalate_on_high_interest: boolean;
  };
};

const defaultForm = (): FormData => ({
  name: '',
  function_type: 'sdr',
  tone: 'consultivo',
  avatar_icon: '🤖',
  avatar_color: '#60a5fa',
  niche: '',
  client_type: 'medium',
  monthly_goal: null,
  goal_metric: 'meetings',
  channels: ['whatsapp'],
  lead_sources: [],
  work_hours_start: '08:00',
  work_hours_end: '18:00',
  timezone: 'America/Sao_Paulo',
  playbook_id: null,
  opening_script: null,
  is_active: false,
  escalate_rules: {
    max_followups: 5,
    min_ticket_to_escalate: null,
    keywords: [],
    escalate_on_high_interest: true,
  },
});

interface Props {
  onClose: () => void;
  onSave: (data: AgentInsert) => Promise<void>;
}

export const AgentWizard: React.FC<Props> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const update = (patch: Partial<FormData>) => setForm(f => ({ ...f, ...patch }));
  const updateEscalate = (patch: Partial<FormData['escalate_rules']>) =>
    setForm(f => ({ ...f, escalate_rules: { ...f.escalate_rules, ...patch } }));

  const resetPromptToDefault = () => {
    const prompt = getDefaultPrompt(form.function_type, {
      tone: form.tone,
      niche: form.niche ?? undefined,
      client_type: form.client_type,
      max_followups: form.escalate_rules.max_followups,
      min_ticket: form.escalate_rules.min_ticket_to_escalate,
    });
    update({ opening_script: prompt });
  };

  const canNext = () => {
    if (step === 0) return !!form.function_type;
    if (step === 1) return form.name.trim().length >= 2;
    if (step === 2) return form.channels.length > 0;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form as AgentInsert);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedFn = FUNCTION_OPTIONS.find(f => f.value === form.function_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0B1220] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Criar Agente</h2>
              <p className="text-xs text-slate-500">{STEPS[step].desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-6 py-3 gap-0 border-b border-white/5">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-1.5" onClick={() => i < step && setStep(i)}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-blue-600 text-white cursor-pointer'
                  : i === step ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
                  : 'bg-slate-800 text-slate-600'
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${i === step ? 'text-white' : i < step ? 'text-slate-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-blue-600/40' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 0: Tipo */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {FUNCTION_OPTIONS.map(fn => {
                const Icon = fn.icon;
                const active = form.function_type === fn.value;
                return (
                  <button
                    key={fn.value}
                    onClick={() => {
                      update({
                        function_type: fn.value,
                        opening_script: getDefaultPrompt(fn.value, {
                          tone: form.tone,
                          niche: form.niche ?? undefined,
                          client_type: form.client_type,
                        }),
                      });
                    }}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-blue-500/40 bg-blue-500/5'
                        : 'border-white/5 bg-[#0F172A] hover:border-white/15'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${fn.color}18` }}>
                      <Icon className="w-4 h-4" style={{ color: fn.color }} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>{fn.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{fn.desc}</p>
                    </div>
                    {active && (
                      <Check className="w-4 h-4 text-blue-400 ml-auto flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 1: Identidade */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome do agente *</label>
                <input
                  type="text"
                  placeholder={`Ex: ${selectedFn?.label ?? 'Agente'} Pro`}
                  value={form.name}
                  onChange={e => update({ name: e.target.value })}
                  className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Cor do avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => update({ avatar_color: c })}
                      className={`w-7 h-7 rounded-lg transition-all ${form.avatar_color === c ? 'ring-2 ring-white/40 scale-110' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Tom de voz</label>
                <div className="grid grid-cols-1 gap-2">
                  {TONE_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => update({ tone: t.value })}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                        form.tone === t.value
                          ? 'border-blue-500/40 bg-blue-500/5 text-white'
                          : 'border-white/5 bg-[#0F172A] text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-medium">{t.label}</span>
                        <span className="text-xs text-slate-500 ml-2">{t.desc}</span>
                      </div>
                      {form.tone === t.value && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nicho de atuação</label>
                  <input
                    type="text"
                    placeholder="Ex: SaaS, Imóveis..."
                    value={form.niche ?? ''}
                    onChange={e => update({ niche: e.target.value })}
                    className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Perfil de cliente</label>
                  <select
                    value={form.client_type}
                    onChange={e => update({ client_type: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  >
                    {CLIENT_TYPES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Canais */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Canais de comunicação *</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNEL_OPTIONS.map(ch => {
                    const active = form.channels.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => update({
                          channels: active
                            ? form.channels.filter(c => c !== ch)
                            : [...form.channels, ch],
                        })}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all capitalize ${
                          active
                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                            : 'border-white/8 text-slate-500 hover:border-white/15 hover:text-white'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Início do expediente</label>
                  <input
                    type="time"
                    value={form.work_hours_start}
                    onChange={e => update({ work_hours_start: e.target.value })}
                    className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Fim do expediente</label>
                  <input
                    type="time"
                    value={form.work_hours_end}
                    onChange={e => update({ work_hours_end: e.target.value })}
                    className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fuso horário</label>
                <select
                  value={form.timezone}
                  onChange={e => update({ timezone: e.target.value })}
                  className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                  <option value="America/Manaus">America/Manaus (GMT-4)</option>
                  <option value="America/Belem">America/Belem (GMT-3)</option>
                  <option value="America/Fortaleza">America/Fortaleza (GMT-3)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Meta */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Métrica de meta</label>
                <div className="space-y-2">
                  {GOAL_METRICS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => update({ goal_metric: m.value as AgentInsert['goal_metric'] })}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                        form.goal_metric === m.value
                          ? 'border-blue-500/40 bg-blue-500/5 text-white'
                          : 'border-white/5 bg-[#0F172A] text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <span className="text-sm">{m.label}</span>
                      {form.goal_metric === m.value && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Meta mensal ({GOAL_METRICS.find(m => m.value === form.goal_metric)?.label ?? ''})
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Ex: 50"
                  value={form.monthly_goal ?? ''}
                  onChange={e => update({ monthly_goal: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            </div>
          )}

          {/* Step 4: Regras */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Máx. follow-ups antes de escalar
                </label>
                <input
                  type="number"
                  min={1} max={20}
                  value={form.escalate_rules.max_followups}
                  onChange={e => updateEscalate({ max_followups: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Ticket mínimo para escalar (R$) — opcional
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Ex: 5000"
                  value={form.escalate_rules.min_ticket_to_escalate ?? ''}
                  onChange={e => updateEscalate({
                    min_ticket_to_escalate: e.target.value ? Number(e.target.value) : null,
                  })}
                  className="w-full bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Palavras-chave para escalação
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: contrato, urgente..."
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && keywordInput.trim()) {
                        updateEscalate({
                          keywords: [...form.escalate_rules.keywords, keywordInput.trim()],
                        });
                        setKeywordInput('');
                      }
                    }}
                    className="flex-1 bg-[#0F172A] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <button
                    onClick={() => {
                      if (keywordInput.trim()) {
                        updateEscalate({ keywords: [...form.escalate_rules.keywords, keywordInput.trim()] });
                        setKeywordInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                {form.escalate_rules.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.escalate_rules.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded"
                      >
                        {kw}
                        <button
                          onClick={() => updateEscalate({
                            keywords: form.escalate_rules.keywords.filter((_, j) => j !== i),
                          })}
                          className="text-slate-500 hover:text-red-400 ml-0.5"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    form.escalate_rules.escalate_on_high_interest ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                  onClick={() => updateEscalate({ escalate_on_high_interest: !form.escalate_rules.escalate_on_high_interest })}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.escalate_rules.escalate_on_high_interest ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-white">Escalar quando interesse muito alto</p>
                  <p className="text-xs text-slate-500">Detectado pelo IA — passa para humano</p>
                </div>
              </label>

              {/* Status inicial */}
              <div className="border-t border-white/5 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      form.is_active ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                    onClick={() => update({ is_active: !form.is_active })}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.is_active ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-white">Ativar agente ao criar</p>
                    <p className="text-xs text-slate-500">Se desativado, o agente fica em modo standby</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Prompt */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Prompt do Agente
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Instruções que definem o comportamento. Pré-configurado para <strong className="text-slate-300">{FUNCTION_OPTIONS.find(f => f.value === form.function_type)?.label}</strong> — edite à vontade.
                  </p>
                </div>
                <button
                  onClick={resetPromptToDefault}
                  title="Restaurar prompt padrão"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0 ml-3"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar padrão
                </button>
              </div>

              <div className="bg-[#0F172A] border border-white/8 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-[11px] text-slate-600 ml-1">system_prompt.txt</span>
                </div>
                <textarea
                  value={form.opening_script ?? ''}
                  onChange={e => update({ opening_script: e.target.value })}
                  rows={14}
                  spellCheck={false}
                  className="w-full bg-transparent px-4 py-3 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none resize-none"
                  placeholder="Digite as instruções do agente..."
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400">
                  Variáveis substituídas pelo WF-07:{' '}
                  <span className="font-mono text-slate-500">{`{company_name}`}</span> ·{' '}
                  <span className="font-mono text-slate-500">{'{{tone}}'}</span> ·{' '}
                  <span className="font-mono text-slate-500">{'{{niche}}'}</span> ·{' '}
                  <span className="font-mono text-slate-500">{'{{objection_map}}'}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{step + 1} / {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => canNext() && setStep(s => s + 1)}
                disabled={!canNext()}
                className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  canNext()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Criar Agente</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
