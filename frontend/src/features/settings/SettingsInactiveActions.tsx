import React, { useState } from 'react';
import {
  Plus, Clock, Trash2, Settings2, AlertTriangle, GripVertical,
} from 'lucide-react';
import FlatCard from '@/components/ui/FlatCard';
import { AllowedScheduleModal, type ScheduleConfig, type WeekDay } from './AllowedScheduleModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type DelayUnit = 'minutes' | 'hours' | 'days';

interface FollowupRule {
  id: string;
  sequence_order: number;
  delay_value: number;
  delay_unit: DelayUnit;
  prompt: string;
  allowed_days: WeekDay[];
  allowed_start_time: string;
  allowed_end_time: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DELAY_UNIT_LABELS: Record<DelayUnit, string> = {
  minutes: 'Minutos',
  hours:   'Horas',
  days:    'Dias',
};

const DAY_SHORT: Record<WeekDay, string> = {
  monday:    'Seg',
  tuesday:   'Ter',
  wednesday: 'Qua',
  thursday:  'Qui',
  friday:    'Sex',
  saturday:  'Sáb',
  sunday:    'Dom',
};

const DEFAULT_SCHEDULE: ScheduleConfig = {
  allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  allowed_start_time: '08:00',
  allowed_end_time:   '18:00',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildScheduleSummary = (rule: FollowupRule): string => {
  const days = rule.allowed_days.map(d => DAY_SHORT[d]).join(', ');
  return `${days}  ·  ${rule.allowed_start_time} – ${rule.allowed_end_time}`;
};

const createEmptyRule = (order: number): FollowupRule => ({
  id:             crypto.randomUUID(),
  sequence_order: order,
  delay_value:    1,
  delay_unit:     'hours',
  prompt:         '',
  ...DEFAULT_SCHEDULE,
});

// ─── Sub-component: RuleCard ─────────────────────────────────────────────────

interface RuleCardProps {
  rule: FollowupRule;
  onUpdate: (updated: FollowupRule) => void;
  onDelete: () => void;
  onOpenSchedule: () => void;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, onUpdate, onDelete, onOpenSchedule }) => {
  const setField = <K extends keyof FollowupRule>(key: K, value: FollowupRule[K]) =>
    onUpdate({ ...rule, [key]: value });

  return (
    <div className="bg-[#0B1220] border border-slate-800 rounded-2xl overflow-hidden">

      {/* Card Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800 bg-[#0B0E14]">
        <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0 cursor-grab" />
        <Clock className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />

        <span className="text-xs text-slate-400 whitespace-nowrap">
          Se não responder em
        </span>

        {/* Delay value */}
        <input
          type="number"
          min={1}
          value={rule.delay_value}
          onChange={e => setField('delay_value', Math.max(1, Number(e.target.value)))}
          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
        />

        {/* Delay unit */}
        <select
          value={rule.delay_unit}
          onChange={e => setField('delay_unit', e.target.value as DelayUnit)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-500/50 cursor-pointer"
        >
          {(Object.entries(DELAY_UNIT_LABELS) as [DelayUnit, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <span className="ml-auto text-xs font-medium text-slate-600 whitespace-nowrap">
          Passo {rule.sequence_order}
        </span>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4 space-y-4">

        {/* Prompt */}
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1.5">
            Prompt para a IA gerar a mensagem:
          </label>
          <textarea
            value={rule.prompt}
            onChange={e => setField('prompt', e.target.value)}
            rows={3}
            placeholder="Ex: Analise a conversa e escreva uma mensagem amigável perguntando se o cliente ainda tem interesse, mencionando o produto discutido anteriormente."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 resize-none"
          />
        </div>

        {/* Schedule + Delete */}
        <div className="flex items-center justify-between gap-3 pt-1">

          {/* Schedule info + button */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onOpenSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configurar Horários
            </button>
            <span className="text-xs text-slate-500 truncate" title={buildScheduleSummary(rule)}>
              {buildScheduleSummary(rule)}
            </span>
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SettingsInactiveActions: React.FC = () => {
  const [rules, setRules] = useState<FollowupRule[]>([
    // Regra de exemplo pré-carregada
    {
      id:             crypto.randomUUID(),
      sequence_order: 1,
      delay_value:    2,
      delay_unit:     'hours',
      prompt:         'O cliente parou de responder. Escreva uma mensagem amigável verificando se ele ainda tem interesse e se pode ajudá-lo com alguma dúvida.',
      ...DEFAULT_SCHEDULE,
    },
  ]);

  const [scheduleTarget, setScheduleTarget] = useState<string | null>(null); // rule id
  const [deleteTarget,   setDeleteTarget]   = useState<string | null>(null); // rule id

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addRule = () => {
    setRules(prev => [...prev, createEmptyRule(prev.length + 1)]);
  };

  const updateRule = (updated: FollowupRule) => {
    setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setRules(prev => {
      const filtered = prev.filter(r => r.id !== deleteTarget);
      // Re-numera a sequência
      return filtered.map((r, i) => ({ ...r, sequence_order: i + 1 }));
    });
    setDeleteTarget(null);
  };

  const saveSchedule = (config: ScheduleConfig) => {
    if (!scheduleTarget) return;
    setRules(prev =>
      prev.map(r =>
        r.id === scheduleTarget
          ? { ...r, ...config }
          : r
      )
    );
    setScheduleTarget(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const targetRule = rules.find(r => r.id === scheduleTarget);

  return (
    <>
      <FlatCard className="p-0">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Follow-up Automático por Inatividade</h2>
            <p className="text-sm text-slate-400 mt-1">
              Configure a sequência de mensagens que a IA enviará automaticamente quando um cliente parar de responder.
            </p>
          </div>
          <button
            onClick={addRule}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap hover:shadow-[0_0_18px_rgba(29,161,242,0.45)] hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Adicionar Regra
          </button>
        </div>

        {/* Rules list */}
        <div className="p-6 space-y-4">

          {rules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Clock className="w-10 h-10 text-slate-700" />
              <p className="text-sm text-slate-500">Nenhuma regra configurada.</p>
              <p className="text-xs text-slate-600">Clique em "Adicionar Regra" para criar o primeiro follow-up automático.</p>
            </div>
          )}

          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onUpdate={updateRule}
              onDelete={() => setDeleteTarget(rule.id)}
              onOpenSchedule={() => setScheduleTarget(rule.id)}
            />
          ))}

          {/* Encerramento automático — label imutável */}
          {rules.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl mt-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                <span className="font-semibold text-amber-300">Encerramento Automático:</span>{' '}
                Após o último follow-up (Passo {rules.length}), se o cliente não responder, a conversa será encerrada e o lead irá para{' '}
                <span className="font-semibold text-red-400">LOST</span>.
              </p>
            </div>
          )}
        </div>
      </FlatCard>

      {/* Schedule Modal */}
      {scheduleTarget && targetRule && (
        <AllowedScheduleModal
          initialConfig={{
            allowed_days:       targetRule.allowed_days,
            allowed_start_time: targetRule.allowed_start_time,
            allowed_end_time:   targetRule.allowed_end_time,
          }}
          onSave={saveSchedule}
          onClose={() => setScheduleTarget(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Excluir Regra de Follow-up"
          message={
            <>
              <p>Tem certeza que deseja excluir este passo da sequência?</p>
              <p className="mt-2 text-sm text-slate-500">
                Os demais passos serão renumerados automaticamente.
              </p>
            </>
          }
        />
      )}
    </>
  );
};

export default SettingsInactiveActions;
