import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { Task, Id } from '@/types';
import { mapTaskFromDb, mapTaskToDb } from '@/src/lib/mappers';

export function useTasks(companyId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!companyId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('company_id', companyId)
      .order('due_date', { ascending: true });
    if (!error) setTasks((data ?? []).map(mapTaskFromDb));
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = useCallback(async (task: Omit<Task, 'id'>): Promise<Task> => {
    if (!companyId) throw new Error('CompanyId missing');
    const { data, error } = await supabase
      .from('tasks')
      .insert(mapTaskToDb(task, companyId))
      .select()
      .single();
    if (error) throw error;
    const created = mapTaskFromDb(data);
    await fetchTasks();
    return created;
  }, [companyId, fetchTasks]);

  const createManyTasks = useCallback(async (taskList: Array<Omit<Task, 'id'>>): Promise<void> => {
    if (!companyId) throw new Error('CompanyId missing');
    if (taskList.length === 0) return;
    const { error } = await supabase
      .from('tasks')
      .insert(taskList.map(t => mapTaskToDb(t, companyId)));
    if (error) throw error;
    await fetchTasks();
  }, [companyId, fetchTasks]);

  const updateTask = useCallback(async (id: Id, updates: Partial<Task>): Promise<void> => {
    if (!companyId) throw new Error('CompanyId missing');
    const { error } = await supabase
      .from('tasks')
      .update(mapTaskToDb(updates, companyId))
      .eq('id', id);
    if (error) throw error;
    await fetchTasks();
  }, [companyId, fetchTasks]);

  const deleteTask = useCallback(async (id: Id): Promise<void> => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    await fetchTasks();
  }, [fetchTasks]);

  const deleteManyTasks = useCallback(async (ids: Id[]): Promise<void> => {
    if (ids.length === 0) return;
    const { error } = await supabase.from('tasks').delete().in('id', ids);
    if (error) throw error;
    await fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, createTask, createManyTasks, updateTask, deleteTask, deleteManyTasks, refetch: fetchTasks };
}
