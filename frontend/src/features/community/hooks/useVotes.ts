import { useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export function useVotes(userId: string | null) {
  const toggleVote = useCallback(async (
    targetType: 'post' | 'comment',
    targetId: string,
    currentlyVoted: boolean
  ) => {
    if (!userId) return;

    if (currentlyVoted) {
      await supabase
        .from('community_votes')
        .delete()
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (targetType === 'post') {
        await supabase.rpc('increment_post_upvotes', { post_id: targetId, delta: -1 });
      } else {
        await supabase.rpc('increment_comment_upvotes', { comment_id: targetId, delta: -1 });
      }
    } else {
      await supabase.from('community_votes').insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
      });

      if (targetType === 'post') {
        await supabase.rpc('increment_post_upvotes', { post_id: targetId, delta: 1 });
      } else {
        await supabase.rpc('increment_comment_upvotes', { comment_id: targetId, delta: 1 });
      }
    }
  }, [userId]);

  const getUserVotes = useCallback(async (
    targetType: 'post' | 'comment',
    targetIds: string[]
  ): Promise<Set<string>> => {
    if (!userId || targetIds.length === 0) return new Set();
    const { data } = await supabase
      .from('community_votes')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .in('target_id', targetIds);
    return new Set((data ?? []).map((v: { target_id: string }) => v.target_id));
  }, [userId]);

  return { toggleVote, getUserVotes };
}
