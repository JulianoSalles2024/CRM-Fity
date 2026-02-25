import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { Board, ColumnData, Id } from '@/types';

function mapStagesForBoard(
  boardId: string,
  stages: Record<string, unknown>[],
): ColumnData[] {
  return stages
    .filter((s) => s.board_id === boardId)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((s) => ({
      id: s.id as string,
      title: (s.name as string) ?? '',
      color: (s.color as string) ?? '#6b7280',
      type: (s.linked_lifecycle_stage as ColumnData['type']) ?? 'open',
    }));
}

export function useBoards(companyId: string | null) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<Id>('');
  const [loading, setLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    if (!companyId) {
      setBoards([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [boardsRes, stagesRes] = await Promise.all([
      supabase.from('boards').select('*').eq('company_id', companyId),
      supabase
        .from('board_stages')
        .select('*')
        .eq('company_id', companyId)
        .order('order', { ascending: true }),
    ]);

    if (!boardsRes.error && !stagesRes.error) {
      const stages = (stagesRes.data ?? []) as Record<string, unknown>[];
      const mapped: Board[] = ((boardsRes.data ?? []) as Record<string, unknown>[]).map((b) => ({
        id: b.id as string,
        name: (b.name as string) ?? '',
        slug: (b.slug as string) ?? '',
        description: (b.description as string) ?? undefined,
        type: (b.type as Board['type']) ?? 'sales',
        isDefault: Boolean(b.is_default),
        columns: mapStagesForBoard(b.id as string, stages),
      }));

      setBoards(mapped);
      setActiveBoardId((prev) => {
        if (prev && mapped.some((b) => b.id === prev)) return prev;
        const defaultBoard = mapped.find((b) => b.isDefault) ?? mapped[0];
        return defaultBoard?.id ?? '';
      });
    } else {
      console.error('useBoards fetch error:', boardsRes.error ?? stagesRes.error);
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return { boards, setBoards, activeBoardId, setActiveBoardId, loading, refetch: fetchBoards };
}
