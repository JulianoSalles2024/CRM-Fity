import { AICredential, AIProviderId, TestConnectionResponse } from './aiProviders.types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API_BASE = '/api/ai';

async function getAuthenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('User not authenticated');
  return data.user.id;
}

export const aiProvidersService = {
  async getCredentials(): Promise<Record<AIProviderId, AICredential>> {
    const userId = await getAuthenticatedUserId();
    const response = await fetch(`${API_BASE}/credentials?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch credentials');
    return response.json();
  },

  async saveCredential(credential: Partial<AICredential>): Promise<void> {
    const userId = await getAuthenticatedUserId();
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
