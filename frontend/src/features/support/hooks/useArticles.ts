import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { SupportArticle, SupportCategory } from '../support.types';

export function useArticles(searchQuery = '') {
  const [articles, setArticles] = useState<SupportArticle[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('support_categories')
      .select('*')
      .order('order');
    setCategories((data ?? []) as SupportCategory[]);
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    // IMPORTANT: reassign query so the ilike filter is actually applied
    let query = supabase
      .from('support_articles')
      .select('*, category:support_categories(*)')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data } = await query;
    setArticles((data ?? []) as SupportArticle[]);
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  return { articles, categories, loading, refetch: fetchArticles };
}
