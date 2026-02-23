import { AICredential, AIProviderId, TestConnectionResponse } from './aiProviders.types';

const API_BASE = '/api/ai';

export const aiProvidersService = {
  async getCredentials(userId: string): Promise<Record<AIProviderId, AICredential>> {
    const response = await fetch(`${API_BASE}/credentials?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch credentials');
    return response.json();
  },

  async saveCredential(userId: string, credential: Partial<AICredential>): Promise<void> {
    const response = await fetch(`${API_BASE}/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...credential }),
    });
    if (!response.ok) throw new Error('Failed to save credential');
  },

  async testConnection(provider: AIProviderId, model: string, apiKey: string): Promise<TestConnectionResponse> {
    const response = await fetch(`${API_BASE}/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, model, apiKey }),
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.message || 'Connection failed' };
    }
    return response.json();
  }
};
