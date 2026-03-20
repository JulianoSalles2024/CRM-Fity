import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { CommunityComment } from '../community.types';

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);

    const { data } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('is_solution', { ascending: false })
      .order('upvotes', { ascending: false });

    const roots = (data ?? []) as CommunityComment[];
    const withReplies = await Promise.all(roots.map(async (comment) => {
      const { data: replies } = await supabase
        .from('community_comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });
      return { ...comment, replies: (replies ?? []) as CommunityComment[] };
    }));

    setComments(withReplies);
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`community_comments:${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_comments',
        filter: `post_id=eq.${postId}`,
      }, () => { fetchComments(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, fetchComments]);

  const addComment = async (content: string, parentId: string | null = null) => {
    const { error } = await supabase.from('community_comments').insert({
      post_id: postId,
      content,
      parent_id: parentId,
    });
    if (!error) fetchComments();
    return { error };
  };

  const markAsSolution = async (commentId: string) => {
    await supabase
      .from('community_comments')
      .update({ is_solution: false })
      .eq('post_id', postId);
    await supabase
      .from('community_comments')
      .update({ is_solution: true })
      .eq('id', commentId);
    await supabase
      .from('community_posts')
      .update({ is_solved: true })
      .eq('id', postId);
    fetchComments();
  };

  return { comments, loading, addComment, markAsSolution };
}
