import React, { useState } from 'react';
import { ThumbsUp, CheckCircle2, CornerDownRight, Send } from 'lucide-react';
import type { CommunityComment } from './community.types';

interface CommentItemProps {
  comment: CommunityComment;
  isPostAuthor: boolean;
  currentUserId: string;
  onVote: (commentId: string, voted: boolean) => void;
  onMarkSolution: (commentId: string) => void;
  onReply: (parentId: string, content: string) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment, isPostAuthor, currentUserId, onVote, onMarkSolution, onReply, depth = 0,
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setShowReply(false);
  };

  return (
    <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-6 border-l border-slate-800 pl-4' : ''}`}>
      <div className={`p-4 rounded-xl border ${comment.is_solution ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-900/40 border-slate-800'}`}>
        {comment.is_solution && (
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Solução marcada
          </div>
        )}
        <p className="text-sm text-slate-200 whitespace-pre-wrap">{comment.content}</p>
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={() => onVote(comment.id, comment.user_voted ?? false)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              comment.user_voted ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {comment.upvotes}
          </button>
          {depth === 0 && (
            <button
              onClick={() => setShowReply(s => !s)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              Responder
            </button>
          )}
          {isPostAuthor && !comment.is_solution && (
            <button
              onClick={() => onMarkSolution(comment.id)}
              className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors ml-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar como solução
            </button>
          )}
        </div>
      </div>

      {showReply && (
        <div className="flex gap-2 ml-6">
          <input
            type="text"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply()}
            placeholder="Escrever resposta..."
            className="flex-1 bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:text-slate-500"
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {comment.replies?.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          isPostAuthor={isPostAuthor}
          currentUserId={currentUserId}
          onVote={onVote}
          onMarkSolution={onMarkSolution}
          onReply={onReply}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

interface CommentThreadProps {
  comments: CommunityComment[];
  postAuthorId: string;
  currentUserId: string;
  onVote: (commentId: string, voted: boolean) => void;
  onMarkSolution: (commentId: string) => void;
  onReply: (parentId: string | null, content: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comments, postAuthorId, currentUserId, onVote, onMarkSolution, onReply,
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onReply(null, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-400">
        {comments.length} comentário{comments.length !== 1 ? 's' : ''}
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="Adicionar comentário..."
          className="flex-1 bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder:text-slate-500"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          isPostAuthor={postAuthorId === currentUserId}
          currentUserId={currentUserId}
          onVote={onVote}
          onMarkSolution={onMarkSolution}
          onReply={(parentId, content) => onReply(parentId, content)}
        />
      ))}
    </div>
  );
};

export default CommentThread;
