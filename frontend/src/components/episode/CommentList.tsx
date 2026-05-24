import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Comment } from '@/validation/schemas';

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return '剛才';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 個月前`;
  return `${Math.floor(months / 12)} 年前`;
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string | undefined;
  onDelete: (commentId: string) => void;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, currentUserId, onDelete }) => {
  if (comments.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground py-2">
        還沒有留言，來當第一個吧！
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {comment.user_avatar ? (
              <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-semibold text-muted-foreground uppercase">
                {comment.user_name.charAt(0)}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-[13px] font-semibold truncate">{comment.user_name}</span>
              <span className="text-[11px] text-muted-foreground flex-shrink-0">{timeAgo(comment.created_at)}</span>
            </div>
            <p className="text-[13px] text-foreground break-words whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Delete (own comments only) */}
          {currentUserId === comment.user_id && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(comment.id)}
              title="刪除留言"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
};
