import React, { useState } from 'react';
import { X, Edit3, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { CommunityCategory } from './community.types';

interface NewPostModalProps {
  categories: CommunityCategory[];
  onSubmit: (title: string, content: string, categoryId: string, hideCompany: boolean) => Promise<void>;
  onClose: () => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ categories, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [hideCompany, setHideCompany] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const postableCategories = categories.filter(c => !c.only_admins);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;
    setLoading(true);
    await onSubmit(title.trim(), content.trim(), categoryId, hideCompany);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0B1220] border border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-white font-semibold">Novo Post</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Título *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Descreva seu post em uma frase..."
              className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:text-slate-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Categoria *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {postableCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-slate-400">Conteúdo * (Markdown suportado)</label>
              <button
                type="button"
                onClick={() => setPreviewMode(p => !p)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
              >
                {previewMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {previewMode ? 'Editar' : 'Preview'}
              </button>
            </div>
            {previewMode ? (
              <div className="min-h-[180px] bg-slate-900/40 border border-white/10 rounded-lg p-4 prose prose-invert prose-sm max-w-none text-slate-300">
                <ReactMarkdown>{content || '*Sem conteúdo ainda...*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Escreva aqui... use **negrito**, _itálico_, `código`"
                rows={7}
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:text-slate-500 resize-none font-mono"
                required
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={hideCompany}
              onChange={e => setHideCompany(e.target.checked)}
              className="rounded border-slate-600"
            />
            Ocultar nome da empresa neste post
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 py-2 rounded-xl border border-sky-500/30 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/50 transition-all text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;
