
import React, { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Group, CreateGroupData, UpdateGroupData, GroupStatus } from '@/shared/types';

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

const statusOptions: GroupStatus[] = ['Ativo', 'Lotado', 'Arquivado'];

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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-800 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Editar Grupo' : 'Novo Grupo'}</h2>
              <p className="text-sm text-slate-400 mt-1">{isEditMode ? 'Atualize os detalhes do grupo' : 'Crie um novo grupo para seus leads'}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5 text-violet-500/70 hover:text-violet-500" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Nome do Grupo <span className="text-red-500">*</span></label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Ex: Clientes VIP"
                       className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Para que serve este grupo?" rows={3}
                       className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label htmlFor="accessLink" className="block text-sm font-medium text-slate-300 mb-2">Link de Acesso</label>
                <input type="url" id="accessLink" name="accessLink" value={formData.accessLink} onChange={handleChange} placeholder="https://chat.whatsapp.com/..."
                       className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="flex gap-4">
                  <div className="flex-1">
                      <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                      <select id="status" name="status" value={formData.status} onChange={handleChange}
                              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none">
                          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                  </div>
                  <div className="flex-1">
                      <label htmlFor="memberGoal" className="block text-sm font-medium text-slate-300 mb-2">Meta de Membros</label>
                      <input type="number" id="memberGoal" name="memberGoal" value={formData.memberGoal} onChange={handleChange} placeholder="Ex: 100" min="0"
                             className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
              </div>
            </div>
            <div className="flex-shrink-0 p-4 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-3">
                 <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors">
                    {isEditMode ? 'Salvar Alterações' : 'Criar Grupo'}
                </button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateEditGroupModal;
