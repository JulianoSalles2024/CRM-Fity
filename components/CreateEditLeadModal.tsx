import React, { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Lead, CreateLeadData, UpdateLeadData, ColumnData, Id, Tag } from '../types';

interface CreateEditLeadModalProps {
  lead: Lead | null;
  columns: ColumnData[];
  allTags: Tag[];
  onClose: () => void;
  onSubmit: (data: CreateLeadData | UpdateLeadData) => void;
}

type FormData = {
    name: string;
    description: string;
    email: string;
    phone: string;
    company: string;
    value: string;
    probability: string;
    columnId: Id;
    status: string;
    clientId: string;
    source: string;
    tags: Tag[];
}

const leadSources = [
  "Indicação",
  "Google Ads",
  "Facebook Ads",
  "Instagram Ads",
  "LinkedIn",
  "Website",
  "Busca Orgânica",
  "Email Marketing",
  "Evento",
  "Página de Conversão",
  "Tráfego Pago",
];

const InputField: React.FC<{ label: string; name: keyof FormData; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; required?: boolean; placeholder?: string; type?: string; className?: string }> = 
({ label, name, value, onChange, required = false, placeholder, type = 'text', className = 'md:col-span-6' }) => (
    <div className={className}>
        <label htmlFor={name} className="block text-sm font-medium text-zinc-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
             <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
             className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        ) : (
            <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        )}
       
    </div>
);

const SelectField: React.FC<{ label: string; name: keyof FormData; value: Id; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; required?: boolean; className?: string; customElement?: React.ReactNode }> =
({ label, name, value, onChange, children, required = false, className = 'md:col-span-3', customElement }) => (
    <div className={className}>
         <label htmlFor={name} className="block text-sm font-medium text-zinc-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {customElement}
            <select id={name} name={name} value={value} onChange={onChange} required={required}
            className={`w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none ${customElement ? 'pl-8' : ''}`}>
                {children}
            </select>
        </div>
    </div>
)


const CreateEditLeadModal: React.FC<CreateEditLeadModalProps> = ({ lead, columns, allTags, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    email: '',
    phone: '',
    company: '',
    value: '0.00',
    probability: '50',
    columnId: columns[0]?.id || '',
    status: 'Ativo',
    clientId: '',
    source: '',
    tags: [],
  });
  
  const [isTagDropdownOpen, setTagDropdownOpen] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        description: lead.description || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        value: lead.value?.toString() || '0.00',
        probability: lead.probability?.toString() || '50',
        columnId: lead.columnId || columns[0]?.id || '',
        status: lead.status || 'Ativo',
        clientId: lead.clientId?.toString() || '',
        source: lead.source || '',
        tags: lead.tags || [],
      });
    }
  }, [lead, columns]);

  const isEditMode = lead !== null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const leadValue = parseFloat(formData.value);
    const leadProbability = parseInt(formData.probability, 10);
    
    if (!formData.name || isNaN(leadValue) || !formData.columnId) {
        alert('Por favor, preencha os campos obrigatórios (*).');
        return;
    }
    
    const dataToSubmit = {
        ...formData,
        value: leadValue,
        probability: isNaN(leadProbability) ? undefined : leadProbability,
        clientId: formData.clientId || undefined,
    };
    
    onSubmit(dataToSubmit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleAddTag = (tagToAdd: Tag) => {
    if (!formData.tags.find(t => t.id === tagToAdd.id)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagToAdd] }));
    }
    setTagDropdownOpen(false);
  };
  
  const handleRemoveTag = (tagToRemove: Tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== tagToRemove.id),
    }));
  };

  const availableTags = allTags.filter(
    availableTag => !formData.tags.find(selectedTag => selectedTag.id === availableTag.id)
  );

  const selectedColumnColor = columns.find(c => c.id === formData.columnId)?.color || '#808080';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl border border-zinc-700 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 border-b border-zinc-700">
          <div className="flex items-start justify-between">
            <div>
                <h2 className="text-xl font-bold text-white">{isEditMode ? 'Editar Lead' : 'Novo Lead'}</h2>
                <p className="text-sm text-zinc-400 mt-1">Preencha os dados para {isEditMode ? 'editar o lead' : 'criar um novo lead'}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-[#14ff00]/70 hover:text-[#14ff00]" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-5">
                <InputField label="Título" name="name" value={formData.name} onChange={handleChange} required placeholder="Nome do lead..." className="md:col-span-6" />
                <InputField label="Descrição" name="description" value={formData.description} onChange={handleChange} placeholder="Detalhes sobre o lead..." type="textarea" className="md:col-span-6" />
                
                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 items-center p-2 bg-zinc-900 border border-zinc-700 rounded-md min-h-[42px]">
                        {formData.tags.map(tag => (
                            <span key={tag.id} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full text-white/90" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                                <button type="button" onClick={() => handleRemoveTag(tag)} className="text-white/70 hover:text-white">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <div className="relative">
                            <button type="button" onClick={() => setTagDropdownOpen(p => !p)} className="text-sm text-zinc-300 hover:text-white bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-md">
                                + Adicionar
                            </button>
                            {isTagDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-700 border border-zinc-600 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {availableTags.length > 0 ? availableTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => handleAddTag(tag)}
                                            className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-600 flex items-center gap-2"
                                        >
                                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }}></span>
                                          <span>{tag.name}</span>
                                        </button>
                                    )) : (
                                      <div className="px-3 py-2 text-sm text-zinc-400">Nenhuma tag disponível</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <InputField label="E-mail" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" type="email" className="md:col-span-2" />
                <InputField label="Telefone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" className="md:col-span-2" />
                <InputField label="Empresa" name="company" value={formData.company} onChange={handleChange} placeholder="Nome da empresa" className="md:col-span-2" />
                <InputField label="Valor (R$)" name="value" value={formData.value} onChange={handleChange} required type="number" className="md:col-span-3" />
                <InputField label="Probabilidade (%)" name="probability" value={formData.probability} onChange={handleChange} type="number" className="md:col-span-3" />

                <SelectField label="Estágio" name="columnId" value={formData.columnId} onChange={handleChange} required className="md:col-span-3"
                    customElement={<div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full`} style={{ backgroundColor: selectedColumnColor }} />}>
                    {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                </SelectField>

                 <SelectField label="Status" name="status" value={formData.status} onChange={handleChange} className="md:col-span-3">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                </SelectField>
                
                <SelectField label="Cliente" name="clientId" value={formData.clientId} onChange={handleChange} className="md:col-span-6">
                    <option value="">Nenhum cliente</option>
                    {/* Placeholder for client list */}
                </SelectField>

                <div className="md:col-span-6">
                    <label htmlFor="source" className="block text-sm font-medium text-zinc-300 mb-2">
                        Origem
                    </label>
                    <input
                        type="text"
                        id="source"
                        name="source"
                        list="source-options"
                        value={formData.source}
                        onChange={handleChange}
                        placeholder="Ex: LinkedIn, Website, Indicação..."
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <datalist id="source-options">
                        {leadSources.map(source => (
                            <option key={source} value={source} />
                        ))}
                    </datalist>
                </div>
            </div>
            <div className="flex-shrink-0 p-4 bg-zinc-800/50 border-t border-zinc-700 flex justify-end gap-3">
                 <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-300 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors">
                    {isEditMode ? 'Salvar Alterações' : 'Criar Lead'}
                </button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateEditLeadModal;