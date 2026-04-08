import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WeekDay =
  | 'monday' | 'tuesday' | 'wednesday'
  | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ScheduleConfig {
  allowed_days: WeekDay[];
  allowed_start_time: string; // "HH:MM"
  allowed_end_time: string;   // "HH:MM"
}

interface AllowedScheduleModalProps {
  initialConfig: ScheduleConfig;
  onSave: (config: ScheduleConfig) => void;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: 'monday',    label: 'Seg' },
  { value: 'tuesday',   label: 'Ter' },
  { value: 'wednesday', label: 'Qua' },
  { value: 'thursday',  label: 'Qui' },
  { value: 'friday',    label: 'Sex' },
  { value: 'saturday',  label: 'Sáb' },
  { value: 'sunday',    label: 'Dom' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const AllowedScheduleModal: React.FC<AllowedScheduleModalProps> = ({
  initialConfig,
  onSave,
  onClose,
}) => {
  const [days, setDays] = useState<WeekDay[]>(initialConfig.allowed_days);
  const [startTime, setStartTime] = useState(initialConfig.allowed_start_time);
  const [endTime, setEndTime] = useState(initialConfig.allowed_end_time);
  const [timeError, setTimeError] = useState<string | null>(null);

  const toggleDay = (day: WeekDay) => {
    setDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (startTime >= endTime) {
      setTimeError('O horário de início deve ser anterior ao horário de término.');
      return;
    }
    if (days.length === 0) {
      setTimeError('Selecione pelo menos um dia da semana.');
      return;
    }
    setTimeError(null);
    onSave({ allowed_days: days, allowed_start_time: startTime, allowed_end_time: endTime });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">Janela de Envio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">

          {/* Dias da semana */}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Dias permitidos
            </p>
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.map(({ value, label }) => {
                const active = days.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleDay(value)}
                    className={`
                      w-10 h-10 rounded-xl text-xs font-semibold transition-all border
                      ${active
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horário */}
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Horário de envio
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1.5 block">Das</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => { setStartTime(e.target.value); setTimeError(null); }}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
              <span className="text-slate-600 mt-5">até</span>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1.5 block">Às</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => { setEndTime(e.target.value); setTimeError(null); }}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
            </div>
          </div>

          {/* Erro */}
          {timeError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {timeError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white border border-sky-500/30 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/50 transition-all rounded-xl hover:shadow-[0_0_18px_rgba(29,161,242,0.45)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Salvar Horários
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllowedScheduleModal;
