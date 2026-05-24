import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUser, useAppStore } from '@/store/useAppStore';
import { LoginButton } from '@/components/auth/LoginButton';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { getEpisodeComments, postComment, deleteComment } from '@/services/api/comments';
import type { Comment } from '@/validation/schemas';

const LIMIT = 20;

interface CommentSectionProps {
  podcastName: string;
  episodeId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ podcastName, episodeId }) => {
  const user = useUser();
  const token = useAppStore((s) => s.token);

  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchComments = useCallback(async (currentOffset: number, replace: boolean) => {
    try {
      const result = await getEpisodeComments(podcastName, episodeId, currentOffset, LIMIT);
      setTotal(result.total);
      setComments((prev) => replace ? result.comments : [...prev, ...result.comments]);
      setOffset(currentOffset + result.comments.length);
    } catch {
      if (import.meta.env.DEV) console.warn('Failed to fetch comments');
    }
  }, [podcastName, episodeId]);

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    fetchComments(0, true).finally(() => setLoading(false));
  }, [fetchComments]);

  const handleSubmit = async (content: string) => {
    if (!token) return;
    const newComment = await postComment(podcastName, episodeId, content, token);
    setComments((prev) => [newComment, ...prev]);
    setTotal((t) => t + 1);
  };

  const handleDelete = async (commentId: string) => {
    if (!token) return;
    try {
      await deleteComment(commentId, token);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((t) => t - 1);
    } catch {
      toast.error('刪除失敗，請稍後再試。');
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchComments(offset, false).finally(() => setLoadingMore(false));
  };

  const hasMore = comments.length < total;

  return (
    <section className="bg-card border border-border rounded-md p-5 sm:p-6">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">
        留言 {total > 0 && <span className="normal-case">({total})</span>}
      </h3>

      {/* Login gate */}
      {!user && (
        <div className="flex flex-col items-start gap-3 mb-5 pb-5 border-b border-border">
          <p className="text-[13px] text-muted-foreground">登入後即可加入討論</p>
          <LoginButton />
        </div>
      )}

      {/* Comment form (logged in only) */}
      {user && token && (
        <div className="mb-5 pb-5 border-b border-border">
          <CommentForm onSubmit={handleSubmit} />
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <p className="text-[13px] text-muted-foreground">載入留言中…</p>
      ) : (
        <>
          <CommentList
            comments={comments}
            currentUserId={user?.id}
            onDelete={handleDelete}
          />
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-4 text-[12px] text-primary hover:underline disabled:opacity-50"
            >
              {loadingMore ? '載入中…' : `載入更多留言（還有 ${total - comments.length} 則）`}
            </button>
          )}
        </>
      )}
    </section>
  );
};
