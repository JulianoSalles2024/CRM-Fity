import { useState, useEffect, useCallback } from 'react';
import { AICredential, AIProviderId, ConnectionStatus } from './aiProviders.types';
import { aiProvidersService } from './aiProviders.service';
import { MODELS_REGISTRY } from './models.registry';

export const useAIProviders = (organizationId: string = 'default-org') => {
  const [credentials, setCredentials] = useState<Record<AIProviderId, AICredential>>({
    openai: { provider: 'openai', apiKey: '', model: 'gpt-5-mini', status: 'not_configured' },
    gemini: { provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash', status: 'not_configured' },
    anthropic: { provider: 'anthropic', apiKey: '', model: 'claude-sonnet-4.5', status: 'not_configured' },
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await aiProvidersService.getCredentials(organizationId);
      
      // Merge with defaults to ensure all providers are present
      setCredentials(prev => ({
        ...prev,
        ...data
      }));
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const updateCredential = (provider: AIProviderId, updates: Partial<AICredential>) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates }
    }));
  };

  const saveCredential = async (provider: AIProviderId) => {
    try {
      const credential = credentials[provider];
      await aiProvidersService.saveCredential(organizationId, credential);
      // Refresh status or just assume success if no error
    } catch (error) {
      console.error('Error saving credential:', error);
      throw error;
    }
  };

  const testConnection = async (provider: AIProviderId) => {
    const credential = credentials[provider];
    if (!credential.apiKey) return;

    updateCredential(provider, { status: 'testing' });

    try {
      const result = await aiProvidersService.testConnection(
        provider,
        credential.model,
        credential.apiKey
      );

      updateCredential(provider, { 
        status: result.success ? 'connected' : 'invalid'
      });
      
      return result;
    } catch (error) {
      updateCredential(provider, { status: 'invalid' });
      return { success: false, message: 'Erro ao testar conexão' };
    }
  };

  return {
    credentials,
    isLoading,
    updateCredential,
    saveCredential,
    testConnection,
    refresh: loadCredentials
  };
};
