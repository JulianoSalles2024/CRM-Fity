import { useState, useEffect } from 'react';
import { AIState, AIToolId, AIToolConfig } from '../types';
import { DEFAULT_AI_TOOLS } from '../constants';

const STORAGE_KEY = 'crm-ai-state';

export const useAIState = () => {
  const [state, setState] = useState<AIState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse AI state', e);
      }
    }
    return {
      tools: DEFAULT_AI_TOOLS,
      apiKey: '',
      model: 'gemini-3-flash-preview'
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateTool = (id: AIToolId, updates: Partial<AIToolConfig>) => {
    setState(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        [id]: { ...prev.tools[id], ...updates }
      }
    }));
  };

  const setApiKey = (apiKey: string) => {
    setState(prev => ({ ...prev, apiKey }));
  };

  const setModel = (model: string) => {
    setState(prev => ({ ...prev, model }));
  };

  return {
    state,
    updateTool,
    setApiKey,
    setModel
  };
};
