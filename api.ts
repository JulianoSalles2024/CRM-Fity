import { supabase } from './services/supabaseClient';
import { GoogleGenAI, Type } from '@google/genai';
import type { ColumnData, Lead, Id, CreateLeadData, UpdateLeadData, Activity, User, Task, CreateTaskData, UpdateTaskData, Tone, Group } from './types';

// --- AUTHENTICATION ---
export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) return null;
    return {
        id: session.user.id,
        name: session.user.user_metadata.name,
        email: session.user.email!,
        avatarUrl: session.user.user_metadata.avatar_url,
    };
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Login failed, no user returned.");
    return {
        id: data.user.id,
        name: data.user.user_metadata.name,
        email: data.user.email!,
    };
};

export const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
};

export const registerUser = async (name: string, email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: { name }
        }
    });
    if (error) throw error;
};

export const logoutUser = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};


// --- DATA FETCHING & MUTATION ---

// LEADS
export const getLeads = async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    // This is a simplified version. A real app would need to fetch tags separately and join them.
    return data.map(d => ({...d, tags: []})) as Lead[]; 
};

export const createLead = async (leadData: CreateLeadData): Promise<Lead> => {
    const { tags, columnId, ...restOfData } = leadData;
    const { data, error } = await supabase
        .from('leads')
        .insert({ ...restOfData, column_id: columnId })
        .select()
        .single();

    if (error) throw error;
    return { ...data, tags: [] } as Lead;
};

export const updateLead = async (leadId: Id, updates: UpdateLeadData): Promise<Lead> => {
    const { columnId, ...restOfUpdates } = updates;
    const updatePayload: any = restOfUpdates;
    if (columnId) {
        updatePayload.column_id = columnId;
    }

    const { data, error } = await supabase
        .from('leads')
        .update(updatePayload)
        .eq('id', leadId)
        .select()
        .single();
        
    if (error) throw error;
    return { ...data, tags: [] } as Lead;
};

export const deleteLead = async (leadId: Id): Promise<{ success: true }> => {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (error) throw error;
    return { success: true };
};

// TASKS
export const getTasks = async (): Promise<Task[]> => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    // Map snake_case from DB to camelCase for app
    return data.map(t => ({
        id: t.id,
        userId: t.user_id,
        leadId: t.lead_id,
        type: t.type,
        title: t.title,
        description: t.description,
        dueDate: t.due_date,
        status: t.status,
    }));
};

export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const payload = {
        user_id: user.id,
        lead_id: taskData.leadId,
        type: taskData.type,
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.dueDate,
        status: taskData.status
    };

    const { data, error } = await supabase.from('tasks').insert(payload).select().single();
    if (error) throw error;
    return {
        id: data.id,
        userId: data.user_id,
        leadId: data.lead_id,
        ...taskData
    };
};

export const updateTask = async (taskId: Id, updates: UpdateTaskData): Promise<Task> => {
     const payload = {
        ...(updates.leadId && {lead_id: updates.leadId}),
        ...(updates.type && {type: updates.type}),
        ...(updates.title && {title: updates.title}),
        ...(updates.description && {description: updates.description}),
        ...(updates.dueDate && {due_date: updates.dueDate}),
        ...(updates.status && {status: updates.status}),
    };

    const { data, error } = await supabase.from('tasks').update(payload).eq('id', taskId).select().single();
    if (error) throw error;
     return {
        id: data.id,
        userId: data.user_id,
        leadId: data.lead_id,
        type: data.type,
        title: data.title,
        description: data.description,
        dueDate: data.due_date,
        status: data.status,
    };
};

export const deleteTask = async (taskId: Id): Promise<{ success: true }> => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    return { success: true };
};

// ACTIVITIES
export const createActivity = async (activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> => {
     const payload = {
        lead_id: activityData.leadId,
        type: activityData.type,
        text: activityData.text,
        author_name: activityData.authorName,
    };
    const { data, error } = await supabase.from('activities').insert(payload).select().single();
    if (error) throw error;
    return {
        id: data.id,
        leadId: data.lead_id,
        type: data.type,
        text: data.text,
        authorName: data.author_name,
        timestamp: data.timestamp,
    };
};


// --- Gemini AI Services ---
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

export const addSampleData = async (sampleLeads: Lead[], sampleTasks: Task[]): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Prepare and insert leads, keeping track of the original string ID
    const leadsToInsert = sampleLeads.map(lead => ({
        name: lead.name,
        company: lead.company,
        value: lead.value,
        avatar_url: lead.avatarUrl,
        last_activity: lead.lastActivity,
        due_date: lead.dueDate,
        assigned_to: lead.assignedTo,
        description: lead.description,
        email: lead.email,
        phone: lead.phone,
        probability: lead.probability,
        status: lead.status,
        client_id: lead.clientId,
        source: lead.source,
        created_at: lead.createdAt,
        column_id: lead.columnId
    }));

    const { data: insertedLeadsData, error: leadsError } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select('id');

    if (leadsError) throw leadsError;

    // 2. Create a map from old string ID to new DB ID
    const oldIdToNewIdMap = new Map<Id, Id>();
    sampleLeads.forEach((lead, index) => {
        oldIdToNewIdMap.set(lead.id, insertedLeadsData[index].id);
    });

    // 3. Prepare and insert tasks
    const tasksToInsert = sampleTasks
        .map(task => {
            const newLeadId = oldIdToNewIdMap.get(task.leadId);
            if (!newLeadId) return null;

            return {
                user_id: user.id,
                lead_id: newLeadId,
                type: task.type,
                title: task.title,
                description: task.description,
                due_date: task.dueDate,
                status: task.status,
            };
        })
        .filter((t): t is NonNullable<typeof t> => t !== null);

    if (tasksToInsert.length > 0) {
        const { error: tasksError } = await supabase
            .from('tasks')
            .insert(tasksToInsert);
        if (tasksError) throw tasksError;
    }
};