import React, { useState } from 'react';
import { Search, ChevronRight, Trash2 } from 'lucide-react';
import { useArticles } from './hooks/useArticles';
import ArticleView from './ArticleView';
import type { SupportArticle, SupportCategory } from './support.types';

interface HelpCenterProps {
  categories: SupportCategory[];
  isAdmin?: boolean;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ categories, isAdmin = false }) => {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<SupportArticle | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmingBulk, setConfirmingBulk] = useState(false);

  const { articles, loading, deleteArticle, bulkDeleteArticles } = useArticles(search);

  if (selectedArticle) {
    return <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  const grouped = categories.map(cat => ({
    ...cat,
    articles: articles.filter(a => a.category_id === cat.id),
  })).filter(g => g.articles.length > 0);

  const allIds = articles.map(a => a.id);
  const allSelected = selected.size === allIds.length && allIds.length > 0;

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
  };

  const handleDelete = async (id: string) => {
    await deleteArticle(id);
    setConfirmId(null);
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    await bulkDeleteArticles(Array.from(selected));
    setSelected(new Set());
    setConfirmingBulk(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar artigos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#0B1220] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:text-slate-500"
        />
      </div>

      {/* Bulk action bar — admin only */}
      {isAdmin && articles.length > 0 && (
        <div className="flex items-center justify-between min-h-[32px]">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500 cursor-pointer"
            />
            {selected.size > 0 ? `${selected.size} selecionado${selected.size > 1 ? 's' : ''}` : 'Selecionar todos'}
          </label>

          {selected.size > 0 && (
            confirmingBulk ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Excluir {selected.size} artigo{selected.size > 1 ? 's' : ''}?</span>
                <button onClick={handleBulkDelete} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">Confirmar</button>
                <button onClick={() => setConfirmingBulk(false)} className="text-xs px-2 py-1 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingBulk(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir selecionados
              </button>
            )
          )}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Carregando artigos...</div>
      ) : grouped.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-8">
          {search ? 'Nenhum artigo encontrado.' : 'Nenhum artigo publicado ainda.'}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(group => (
            <div key={group.id}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {group.name}
              </h3>
              <div className="flex flex-col gap-1">
                {group.articles.map(article => (
                  <div
                    key={article.id}
                    className={`flex items-center gap-2 px-4 py-3 bg-[#0B1220] border rounded-xl transition-all group ${
                      selected.has(article.id) ? 'border-blue-500/40 bg-blue-950/10' : 'border-slate-800 hover:border-blue-500/30 hover:bg-blue-950/20'
                    }`}
                  >
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={selected.has(article.id)}
                        onChange={() => toggleOne(article.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500 cursor-pointer flex-shrink-0"
                      />
                    )}

                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="flex items-center justify-between flex-1 text-left min-w-0"
                    >
                      <span className="text-sm text-slate-300 group-hover:text-white truncate">{article.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 flex-shrink-0 ml-2" />
                    </button>

                    {isAdmin && (
                      <div className="flex-shrink-0 w-14 flex justify-end">
                        {confirmId === article.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(article.id)} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors">Sim</button>
                            <button onClick={() => setConfirmId(null)} className="text-xs px-1 py-1 text-slate-500 hover:text-white transition-colors">Não</button>
                          </div>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmId(article.id); }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir artigo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpCenter;
