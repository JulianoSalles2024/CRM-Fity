import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { useComments } from './hooks/useComments';
import { useVotes } from './hooks/useVotes';
import CommentThread from './CommentThread';
import ReputationBadge from './ReputationBadge';
import type { CommunityPost } from './community.types';

interface PostDetailProps {
  post: CommunityPost;
  authorName: string;
  authorPoints?: number;
  currentUserId: string;
  onBack: () => void;
  onPostVote: (postId: string, voted: boolean) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({
  post, authorName, authorPoints = 0, currentUserId, onBack, onPostVote,
}) => {
  const { comments, addComment, markAsSolution } = useComments(post.id);
  const { toggleVote } = useVotes(currentUserId);

  const handleCommentVote = async (commentId: string, voted: boolean) => {
    await toggleVote('comment', commentId, voted);
  };

  const handleReply = async (parentId: string | null, content: string) => {
    await addComment(content, parentId);
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao feed
      </button>

      <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
            <button
              onClick={() => onPostVote(post.id, post.user_voted ?? false)}
              className={`transition-colors ${post.user_voted ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-400">{post.upvotes}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {post.category && (
                <span className="text-xs text-blue-400 font-medium">{post.category.name}</span>
              )}
              {post.is_solved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolvido
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-white mb-4">{post.title}</h1>

            <div className="prose prose-invert prose-sm max-w-none text-slate-300 mb-4">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{authorName}</span>
              <ReputationBadge points={authorPoints} size="xs" />
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      <CommentThread
        comments={comments}
        postAuthorId={post.author_id}
        currentUserId={currentUserId}
        onVote={handleCommentVote}
        onMarkSolution={markAsSolution}
        onReply={handleReply}
      />
    </div>
  );
};

export default PostDetail;
