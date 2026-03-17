
import React, { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import type { Group, CreateGroupData, UpdateGroupData, GroupStatus } from '@/types';
import { ui } from '@/src/lib/uiStyles';

interface CreateEditGroupModalProps {
  group: Group | null;
  onClose: () => void;
  onSubmit: (data: CreateGroupData | UpdateGroupData) => void;
}

type FormData = {
    name: string;
    description: string;
    accessLink: string;
    status: GroupStatus;
    memberGoal: string;
}

const statusOptions: { value: GroupStatus; label: string; dot: string }[] = [
  { value: 'Ativo',     label: 'Ativo',     dot: 'bg-green-400' },
  { value: 'Lotado',    label: 'Lotado',    dot: 'bg-yellow-400' },
  { value: 'Arquivado', label: 'Arquivado', dot: 'bg-slate-400' },
];

const CreateEditGroupModal: React.FC<CreateEditGroupModalProps> = ({ group, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    accessLink: '',
    status: 'Ativo',
    memberGoal: '',
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        accessLink: group.accessLink || '',
        status: group.status || 'Ativo',
        memberGoal: group.memberGoal?.toString() || '',
      });
    }
  }, [group]);

  const isEditMode = group !== null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Por favor, preencha o nome do grupo.');
      return;
    }

    const goal = parseInt(formData.memberGoal, 10);

    const dataToSubmit = {
      ...formData,
      memberGoal: !isNaN(goal) ? goal : undefined,
    };

    onSubmit(dataToSubmit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value }));
  };

  const currentStatusDot = statusOptions.find(s => s.value === formData.status)?.dot ?? 'bg-slate-400';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`${ui.modalContainer} w-full max-w-lg`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-5 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {isEditMode ? 'Editar Grupo' : 'Novo Grupo'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEditMode ? 'Atualize os detalhes do grupo' : 'Crie um novo grupo para seus leads'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 overflow-y-auto">

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Nome do Grupo <span className="text-red-500 normal-case">*</span>
              </label>
              <input
                type="text" id="name" name="name"
                value={formData.name} onChange={handleChange}
                required placeholder="Ex: Clientes VIP"
                className={ui.input}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Descrição
              </label>
              <textarea
                id="description" name="description"
                value={formData.description} onChange={handleChange}
                placeholder="Para que serve este grupo?" rows={3}
                className={`${ui.input} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="accessLink" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Link de Acesso
              </label>
              <input
                type="url" id="accessLink" name="accessLink"
                value={formData.accessLink} onChange={handleChange}
                placeholder="https://chat.whatsapp.com/..."
                className={ui.input}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="status" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${currentStatusDot}`} />
                  <select
                    id="status" name="status"
                    value={formData.status} onChange={handleChange}
                    className={`${ui.input} pl-7 appearance-none`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="memberGoal" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Meta de Membros
                </label>
                <input
                  type="number" id="memberGoal" name="memberGoal"
                  value={formData.memberGoal} onChange={handleChange}
                  placeholder="Ex: 100" min="0"
                  className={ui.input}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={ui.buttonSecondary}>
              Cancelar
            </button>
            <button type="submit" className={ui.buttonPrimary}>
              {isEditMode ? 'Salvar Alterações' : 'Criar Grupo'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateEditGroupModal;
