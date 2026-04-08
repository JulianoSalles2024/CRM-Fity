import React, { useState } from 'react';
import { X, Loader2, ArrowRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/src/lib/supabase';
import type { Lead, Board } from '@/types';

interface MoveToBoardModalProps {
  lead: Lead;
  boards: Board[];
  currentBoardId: string;
  onClose: () => void;
}

const MoveToBoardModal: React.FC<MoveToBoardModalProps> = ({
  lead,
  boards,
  currentBoardId,
  onClose,
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherBoards = boards.filter(b => b.id !== currentBoardId);

  const handleMove = async (targetBoard: Board) => {
    setIsMoving(true);
    setError(null);

    // Get first stage of target board
    const { data: stage } = await supabase
      .from('board_stages')
      .select('id')
      .eq('board_id', targetBoard.id)
      .order('order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!stage) {
      setError('Pipeline sem estágios configurados.');
      setIsMoving(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from('leads')
      .update({ board_id: targetBoard.id, column_id: stage.id })
      .eq('id', lead.id);

    if (updateErr) {
      setError('Erro ao mover o lead. Tente novamente.');
      setIsMoving(false);
      return;
    }

    // Realtime subscription in useLeads will update the list automatically
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0B1220] border border-slate-800 rounded-2xl shadow-xl w-full max-w-sm"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Mover para Pipeline</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{lead.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Board list */}
        <div className="p-4 space-y-2">
          {otherBoards.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Nenhuma outra pipeline disponível.
            </p>
          ) : (
            otherBoards.map(board => (
              <button
                key={board.id}
                onClick={() => handleMove(board)}
                disabled={isMoving}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#0F172A] border border-white/5 rounded-xl hover:bg-white/[0.04] hover:border-white/12 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium text-white group-hover:text-sky-300 transition-colors">
                  {board.name}
                </span>
                {isMoving ? (
                  <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                ) : (
                  <ArrowRightCircle className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
                )}
              </button>
            ))
          )}

          {error && (
            <p className="text-xs text-red-400 text-center pt-1">{error}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MoveToBoardModal;
