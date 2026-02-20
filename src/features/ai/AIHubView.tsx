import React, { useState } from 'react';
import { Bot, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAIState } from './hooks/useAIState';
import { AIToolCard } from './components/AIToolCard';
import { PromptEditorModal } from './components/PromptEditorModal';
import { AIToolId } from './types';
import { createAIService } from '@/src/services/ai';

export const AIHubView: React.FC = () => {
  const { state, updateTool, setApiKey } = useAIState();
  const [editingToolId, setEditingToolId] = useState<AIToolId | null>(null);
  const [isTesting, setIsTesting] = useState<AIToolId | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const toolsList = Object.values(state.tools);

  const handleTest = async (toolId: AIToolId) => {
    if (!state.apiKey) {
      alert('Por favor, insira uma API Key antes de testar.');
      return;
    }

    setIsTesting(toolId);
    setTestResult(null);

    try {
      const service = createAIService(state.apiKey, state.model);
      const tool = state.tools[toolId];
      
      // Mock variables for testing
      const mockVars = {
        scriptType: 'Primeiro Contato',
        dealTitle: 'Projeto Solar Residencial',
        context: 'Lead interessado em reduzir conta de luz em 90%',
        dataJson: JSON.stringify({ leads: 5, tasks: 2, value: 50000 }),
        dealValue: '50.000',
        stageLabel: 'Qualificação',
        probability: '60',
        contactName: 'João Silva',
        companyName: 'Silva & Co',
        objection: 'O preço está um pouco alto',
        description: 'Venda de software SaaS B2B',
        lifecycleJson: JSON.stringify(['Prospecção', 'Demo', 'Proposta', 'Fechamento']),
        boardName: 'Vendas Diretas',
        userInstruction: 'Adicione um estágio de Prova de Conceito',
        boardContext: 'Board atual com 4 estágios',
        historyContext: 'Nenhum histórico disponível'
      };

      const result = await service.runTool(tool, mockVars);
      setTestResult(result);
    } catch (error: any) {
      setTestResult(`Erro: ${error.message}`);
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <Bot className="w-8 h-8 text-sky-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Inteligência Artificial</h1>
          <p className="text-slate-400">Configure e gerencie as ferramentas de IA do seu CRM</p>
        </div>
      </div>

      {/* API Key Configuration */}
      <div 
        className="p-6 rounded-2xl border border-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Configuração da API</h3>
            <p className="text-sm text-slate-400">Insira sua chave da Gemini API para ativar as funções.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gemini API Key</label>
            <input 
              type="password"
              value={state.apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua chave aqui..."
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div 
        className="p-6 rounded-2xl border border-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-bold text-white">Funções de IA</h3>
        </div>
        
        <p className="text-sm text-slate-400 mb-8">
          Ative ou desative as ferramentas e personalize os prompts para cada uma delas.
        </p>

        <div className="grid grid-cols-1 gap-4">
          {toolsList.map((tool: any) => (
            <AIToolCard 
              key={tool.id}
              tool={tool}
              onToggle={(enabled) => updateTool(tool.id, { enabled })}
              onEditPrompt={() => setEditingToolId(tool.id)}
              onTest={() => handleTest(tool.id)}
            />
          ))}
        </div>
      </div>

      {/* Test Result Section */}
      {testResult && (
        <div 
          className="p-6 rounded-2xl border border-white/10 bg-black/20"
          style={{
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resultado do Teste</h3>
            <button 
              onClick={() => setTestResult(null)}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Limpar
            </button>
          </div>
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-sm text-slate-300 whitespace-pre-wrap font-mono">
            {testResult}
          </div>
        </div>
      )}

      {/* Loading Overlay for Testing */}
      {isTesting && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-white font-medium">Gerando resposta...</p>
          </div>
        </div>
      )}

      {/* Prompt Editor Modal */}
      {editingToolId && (
        <PromptEditorModal 
          isOpen={!!editingToolId}
          onClose={() => setEditingToolId(null)}
          toolName={state.tools[editingToolId].name}
          initialPrompt={state.tools[editingToolId].basePrompt}
          onSave={(newPrompt) => updateTool(editingToolId, { basePrompt: newPrompt })}
        />
      )}
    </div>
  );
};
