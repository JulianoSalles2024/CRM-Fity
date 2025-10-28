import { supabase } from './services/supabaseClient';
import type { ColumnData, Lead, Id, CreateLeadData, UpdateLeadData, Activity, User, Task, CreateTaskData, UpdateTaskData } from './types';

// --- Funções de Autenticação ---

export const getCurrentUser = async (): Promise<User> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Falha ao buscar sessão: ' + sessionError.message);
    if (!session) throw new Error('Nenhum usuário logado.');

    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
    
    if (profileError) throw new Error('Falha ao buscar perfil do usuário: ' + profileError.message);
    if (!userProfile) throw new Error('Perfil do usuário não encontrado.');
    
    return userProfile;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login falhou, nenhum usuário retornado.');
    
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
    if (profileError) throw new Error('Falha ao buscar perfil do usuário após o login.');
    if (!userProfile) throw new Error('Perfil do usuário não encontrado.');
        
    return userProfile;
};

export const registerUser = async (name: string, email: string, password: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Isso armazena o nome nos metadados do usuário de autenticação
        }
      }
    });

    if (signUpError) throw new Error(signUpError.message);
    if (!authData.user) throw new Error('Registro falhou, nenhum usuário foi criado.');

    // Agora, insira o perfil na tabela pública 'users'
    const { error: profileError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            name: name,
            email: email
        });

    if (profileError) {
        // Opcional: Tentar deletar o usuário de autenticação se a criação do perfil falhar
        // await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Falha ao criar o perfil do usuário: ' + profileError.message);
    }
};


export const logoutUser = async (): Promise<void> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};


// --- Funções de Dados ---

export const getUsers = async (): Promise<User[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const getColumns = async (): Promise<ColumnData[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('columns').select('*').order('id'); // Assumindo uma ordem por ID
  if (error) throw new Error(error.message);
  return data || [];
};

export const getLeads = async (): Promise<Lead[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('leads').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const getActivities = async (): Promise<Activity[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('activities').select('*').order('timestamp', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

export const createActivity = async (activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const newActivityData = { ...activityData, timestamp: new Date().toISOString() };
    const { data, error } = await supabase.from('activities').insert(newActivityData).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const createLead = async (leadData: CreateLeadData): Promise<Lead> => {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const { data, error } = await supabase.from('leads').insert(leadData).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateLead = async (leadId: Id, updates: UpdateLeadData): Promise<Lead> => {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const { data, error } = await supabase.from('leads').update(updates).eq('id', leadId).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteLead = async (leadId: Id): Promise<{ success: true }> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");

    // 1. Delete associated activities
    const { error: activityError } = await supabase.from('activities').delete().eq('leadId', leadId);
    if (activityError) throw new Error(`Falha ao deletar atividades: ${activityError.message}`);

    // 2. Delete associated tasks
    const { error: taskError } = await supabase.from('tasks').delete().eq('leadId', leadId);
    if (taskError) throw new Error(`Falha ao deletar tarefas: ${taskError.message}`);

    // 3. Delete the lead itself
    const { error: leadError } = await supabase.from('leads').delete().eq('id', leadId);
    if (leadError) throw new Error(`Falha ao deletar o lead: ${leadError.message}`);

    return { success: true };
};

// --- Funções de Tarefas (Tasks) ---

export const getTasks = async (): Promise<Task[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('tasks').select('*').order('dueDate', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
};

export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const newTaskData = { ...taskData, userId: user.id };
    const { data, error } = await supabase.from('tasks').insert(newTaskData).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateTask = async (taskId: Id, updates: UpdateTaskData): Promise<Task> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteTask = async (taskId: Id): Promise<{ success: true }> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw new Error(error.message);
    return { success: true };
};