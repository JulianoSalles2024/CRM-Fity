import type { ColumnData, Lead, Id, CreateLeadData, UpdateLeadData, Activity, User, Task, CreateTaskData, UpdateTaskData } from './types';

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
