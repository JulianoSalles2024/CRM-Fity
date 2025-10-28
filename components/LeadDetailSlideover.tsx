

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Building, DollarSign, Tag as TagIcon, Clock, Trash2, MessageSquare, ArrowRight, TrendingUp, Sparkles, FileText, Mail } from 'lucide-react';
import type { Lead, Tag, Activity, EmailDraft, Id, CreateEmailDraftData, Tone } from '../types';
import AIComposer from './AIComposer';

interface LeadDetailSlideoverProps {
  lead: Lead;
  activities: Activity[];
  emailDrafts: EmailDraft[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddNote: (noteText: string) => void;
  onSendEmailActivity: (subject: string) => void;
  onAddTask: () => void;
  onSaveDraft: (draftData: CreateEmailDraftData) => void;
  onDeleteDraft: (draftId: Id) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const TagPill: React.FC<{ tag: Tag }> = ({ tag }) => (
  <span 
    className="px-2 py-1 text-xs font-medium rounded-full text-white/90"
    style={{ backgroundColor: tag.color }}
  >
    {tag.name}
  </span>
);

const DetailItem: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode }> = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-violet-400 mt-1 flex-shrink-0" />
        <div className="flex flex-col">
            <span className="text-sm text-zinc-400">{label}</span>
            <span className="text-md font-medium text-gray-200">{children}</span>
        </div>
    </div>
);

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const LeadDetailSlideover: React.FC<LeadDetailSlideoverProps> = ({ lead, activities, emailDrafts, onClose, onEdit, onDelete, onAddNote, onSendEmailActivity, onAddTask, onSaveDraft, onDeleteDraft, showNotification }) => {
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const tabs = ['Visão Geral', 'AI Composer', 'Atividades', 'Rascunhos'];
  const [newNote, setNewNote] = useState('');
  const [composerInitialState, setComposerInitialState] = useState<Partial<EmailDraft> | null>(null);
  
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleAddNoteClick = () => {
    if (newNote.trim() === '') return;
    onAddNote(newNote);
    setNewNote('');
  };

  const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const sortedDrafts = [...emailDrafts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleLoadDraft = (draft: EmailDraft) => {
    setComposerInitialState(draft);
    setActiveTab('AI Composer');
  };

  const handleSaveDraft = (draftData: { objective: string; tones: Tone[]; subject: string; body: string; }) => {
    onSaveDraft({
        leadId: lead.id,
        ...draftData
    });
  };

  const handleSendEmail = (email: { subject: string; body: string; }) => {
    if (!lead.email) {
        showNotification('Este lead não possui um endereço de e-mail cadastrado.', 'error');
        return;
    }
    const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.location.href = mailtoLink;
    onSendEmailActivity(email.subject);
    showNotification('Seu cliente de e-mail foi aberto para envio.', 'success');
  };


  const getTabIcon = (tabName: string) => {
    switch (tabName) {
      case 'AI Composer':
        return <Sparkles className="w-4 h-4 mr-2 text-violet-400" />;
      case 'Rascunhos':
        return <FileText className="w-4 h-4 mr-2 text-zinc-400" />;
      default:
        return null;
    }
  };


  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-full w-full max-w-lg bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-zinc-800">
        <div className="flex items-start justify-between">
          <motion.div layoutId={`lead-card-${lead.id}`} className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold text-white">
                {lead.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{lead.name}</h2>
              <p className="text-zinc-400">{lead.company}</p>
            </div>
          </motion.div>
          <button onClick={onClose} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors">
            <X className="w-6 h-6 text-violet-500/70 hover:text-violet-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-6 border-b border-zinc-800">
          <nav className="flex -mb-px space-x-6">
              {tabs.map(tab => (
                  <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                      {getTabIcon(tab)}
                      {tab}
                  </button>
              ))}
          </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'Visão Geral' && (
          <div className="space-y-6">
            <DetailItem icon={User} label="Nome do Contato">{lead.name}</DetailItem>
            <DetailItem icon={Building} label="Empresa">{lead.company}</DetailItem>
            <DetailItem icon={DollarSign} label="Valor">{currencyFormatter.format(lead.value)}</DetailItem>
            
            {typeof lead.probability === 'number' && (
                <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-violet-400 mt-1 flex-shrink-0" />
                    <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400">Probabilidade</span>
                            <span className="text-md font-medium text-gray-200">{lead.probability}%</span>
                        </div>
                        <div className="w-full bg-zinc-700/80 rounded-full h-2 mt-2">
                            <div className="bg-teal-400 h-2 rounded-full" style={{ width: `${lead.probability}%` }}></div>
                        </div>
                    </div>
                </div>
            )}

            <DetailItem icon={TagIcon} label="Tags">
                <div className="flex flex-wrap gap-2">
                    {lead.tags.length > 0 ? lead.tags.map(tag => <TagPill key={tag.id} tag={tag} />) : <span className="text-zinc-400">Sem tags</span>}
                </div>
            </DetailItem>
            <DetailItem icon={Clock} label="Última Atividade">{lead.lastActivity}</DetailItem>
          </div>
        )}
        {activeTab === 'AI Composer' && (
            <AIComposer
                lead={lead}
                showNotification={showNotification}
                onSaveDraft={handleSaveDraft}
                onSendEmail={handleSendEmail}
                initialState={composerInitialState}
                onStateReset={() => setComposerInitialState(null)}
            />
        )}
        {activeTab === 'Atividades' && (
          <div className="space-y-6">
             <div>
                <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar uma nota..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    rows={3}
                />
                <div className="flex justify-end mt-2">
                    <button 
                        onClick={handleAddNoteClick}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Salvar Nota
                    </button>
                </div>
            </div>
            <ul className="space-y-4">
              {sortedActivities.length > 0 ? sortedActivities.map(activity => (
                 <li key={activity.id} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 bg-zinc-800 h-8 w-8 rounded-full flex items-center justify-center mt-1">
                        {activity.type === 'note' ? <MessageSquare className="w-4 h-4 text-violet-400" /> : activity.type === 'email_sent' ? <Mail className="w-4 h-4 text-violet-400" /> : <ArrowRight className="w-4 h-4 text-violet-400" />}
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500">
                          {activity.authorName} • {formatTimestamp(activity.timestamp)}
                        </p>
                        <p className="text-sm mt-1 text-zinc-300">{activity.text}</p>
                    </div>
                </li>
              )) : (
                <p className="text-center text-zinc-500 py-8">Nenhuma atividade registrada para este lead.</p>
              )}
            </ul>
          </div>
        )}
         {activeTab === 'Rascunhos' && (
            <div className="space-y-4">
                {sortedDrafts.length > 0 ? (
                    sortedDrafts.map(draft => (
                        <div key={draft.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 transition-colors hover:border-zinc-600">
                            <p className="font-semibold text-white truncate">{draft.subject}</p>
                            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{draft.body}</p>
                            <p className="text-xs text-zinc-500 mt-3">
                                Salvo em {formatTimestamp(draft.createdAt)}
                            </p>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-700/50">
                                <button onClick={() => handleLoadDraft(draft)} className="text-sm font-medium text-violet-400 hover:text-violet-300">
                                    Carregar
                                </button>
                                <span className="text-zinc-600">|</span>
                                <button onClick={() => onDeleteDraft(draft.id)} className="text-sm font-medium text-red-500 hover:text-red-400">
                                    Deletar
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-zinc-500 py-8">Nenhum rascunho salvo para este lead.</p>
                )}
            </div>
        )}
      </div>

       {/* Actions */}
      <div className="flex-shrink-0 p-6 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
              <button
                  onClick={onDelete}
                  className="p-2 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors"
                  aria-label="Deletar Lead"
              >
                  <Trash2 className="w-5 h-5 text-violet-500/70 hover:text-violet-500" />
              </button>
              <div className="flex items-center gap-3">
                  <button 
                    className="px-4 py-2 text-sm font-semibold text-zinc-300 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors"
                    onClick={onEdit}
                  >
                      Editar Lead
                  </button>
                  <button 
                    onClick={onAddTask}
                    className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors">
                      Criar Tarefa
                  </button>
              </div>
          </div>
      </div>
    </motion.div>
  );
};

export default LeadDetailSlideover;