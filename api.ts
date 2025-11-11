import { GoogleGenAI, Type } from '@google/genai';
import type { ColumnData, Lead, Id, CreateLeadData, UpdateLeadData, Activity, User, Task, CreateTaskData, UpdateTaskData, Tone, Group } from './types';

// Supabase has been removed. These functions are stubs and should not be called.
// The application logic now relies entirely on local storage.

const errorMessage = "Supabase is disabled. This function should not be called.";

export const getCurrentUser = async (): Promise<User> => {
    throw new Error(errorMessage);
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    throw new Error(errorMessage);
};

export const signInWithGoogle = async (): Promise<void> => {
    throw new Error(errorMessage);
};

export const registerUser = async (name: string, email: string, password: string): Promise<void> => {
    throw new Error(errorMessage);
};

export const logoutUser = async (): Promise<void> => {
    throw new Error(errorMessage);
};

export const getUsers = async (): Promise<User[]> => {
    throw new Error(errorMessage);
};

export const getColumns = async (): Promise<ColumnData[]> => {
    throw new Error(errorMessage);
};

export const getLeads = async (): Promise<Lead[]> => {
    throw new Error(errorMessage);
};

export const getActivities = async (): Promise<Activity[]> => {
    throw new Error(errorMessage);
};

export const createActivity = async (activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> => {
    throw new Error(errorMessage);
};

export const createLead = async (leadData: CreateLeadData): Promise<Lead> => {
    throw new Error(errorMessage);
};

export const updateLead = async (leadId: Id, updates: UpdateLeadData): Promise<Lead> => {
    throw new Error(errorMessage);
};

export const deleteLead = async (leadId: Id): Promise<{ success: true }> => {
    throw new Error(errorMessage);
};

export const getTasks = async (): Promise<Task[]> => {
    throw new Error(errorMessage);
};

export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
    throw new Error(errorMessage);
};

export const updateTask = async (taskId: Id, updates: UpdateTaskData): Promise<Task> => {
    throw new Error(errorMessage);
};

export const deleteTask = async (taskId: Id): Promise<{ success: true }> => {
    throw new Error(errorMessage);
};

// --- Gemini AI Services ---

/**
 * NOTE: In a production application, this function would be a call to YOUR backend server.
 * The backend server would then securely call the Gemini API with a stored API key.
 * This simulation keeps the logic on the client but abstracts it away from the component,
 * demonstrating the correct architectural pattern to protect the API key.
 */
export const generateEmailSuggestion = async (
    objective: string,
    tones: Tone[],
    includeLeadInfo: boolean,
    lead: Lead
): Promise<{ subject: string; body: string }> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key for Gemini is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let prompt = `Escreva um email com o seguinte objetivo: "${objective}". O tom deve ser uma combinação de: ${tones.join(', ')}.`;
    if (includeLeadInfo && lead) {
        prompt += `\n\nUse as seguintes informações do lead para personalizar o email (não invente informações que não estão aqui):\n- Nome do Contato: ${lead.name}\n- Empresa: ${lead.company}\n- Valor da Oportunidade: R$${lead.value}\n- Descrição do Lead: ${lead.description || 'Não fornecida'}`;
    }
    prompt += `\n\nResponda estritamente com um objeto JSON contendo as chaves "subject" (assunto do email) e "body" (corpo do email). O corpo do email deve usar quebras de linha (\\n) para parágrafos.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING }
                },
                required: ['subject', 'body']
            }
        }
    });
    
    return JSON.parse(response.text);
};


export const generateGroupAnalysis = async (
    group: Group,
    groupMetrics: {
        currentMembers: number;
        onboardingRate: number;
        churnRate: number;
        totalJoined: number;
        totalOnboarded: number;
        totalChurned: number;
    },
    leads: Lead[]
): Promise<string> => {
     if (!process.env.API_KEY) {
        throw new Error("API Key for Gemini is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Você é um analista de negócios especialista em comunidades online e gestão de leads. Analise os seguintes dados do grupo '${group.name}' e forneça um resumo analítico detalhado.

**Dados do Grupo:**
- **Nome:** ${group.name}
- **Descrição:** ${group.description || 'Não fornecida'}
- **Meta de Membros:** ${group.memberGoal || 'Não definida'}

**Métricas Chave:**
- **Membros Atuais:** ${groupMetrics.currentMembers}
- **Taxa de Onboarding (dos que entraram):** ${groupMetrics.onboardingRate.toFixed(1)}%
- **Taxa de Churn (dos que entraram):** ${groupMetrics.churnRate.toFixed(1)}%

**Dados Gerais dos Membros:**
- **Total de Leads Associados:** ${leads.length}
- **Leads que entraram no grupo:** ${groupMetrics.totalJoined}
- **Leads que permanecem no grupo:** ${groupMetrics.currentMembers}
- **Leads que saíram (churn):** ${groupMetrics.totalChurned}
- **Leads que completaram onboarding:** ${groupMetrics.totalOnboarded}

**Sua Tarefa:**
Com base nesses dados, gere uma análise em texto com as seguintes seções, usando markdown para formatação (títulos com ##, listas com *, negrito com **):
1.  **Resumo Executivo:** Uma visão geral rápida da saúde e performance do grupo.
2.  **Pontos Fortes:** Identifique o que está funcionando bem.
3.  **Pontos de Melhoria:** Aponte áreas que precisam de atenção.
4.  **Padrões e Insights:** Destaque padrões interessantes (ex: alta taxa de churn apesar do bom onboarding, etc.).
5.  **Recomendações e Próximos Passos:** Sugira 2-3 ações concretas para o gestor do grupo tomar para melhorar as métricas.

Seja claro, conciso e use os dados para embasar sua análise.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
}