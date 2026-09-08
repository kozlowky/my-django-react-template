import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@selte/shared-ui";
import { fetchPostComments, addComment } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import type { Comment } from "../../lib/api";

interface CommentsSheetProps {
  postId: string | null;
  onClose: () => void;
  onRequireAuth?: () => void;
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  return (
    <div className={`${depth > 0 ? "ml-8 mt-2" : "mt-4"}`}>
      <div className="flex gap-2">
        <div className="h-7 w-7 shrink-0 rounded-full bg-cream flex items-center justify-center text-[10px] font-semibold text-charcoal-muted uppercase">
          {comment.author.displayName.slice(0, 2)}
        </div>
        <div className="flex-1">
          <span className="text-xs font-semibold text-charcoal mr-1">
            {comment.author.displayName}
          </span>
          <span className="text-xs text-charcoal">{comment.text}</span>
          <div className="mt-0.5 text-[10px] text-charcoal-muted">
            {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
}

export function CommentsSheet({ postId, onClose, onRequireAuth }: CommentsSheetProps) {
  const isAuth = Boolean(getAccessToken());
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchPostComments(postId!),
    enabled: !!postId,
  });

  const mutation = useMutation({
    mutationFn: ({ t }: { t: string }) => addComment(postId!, t),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  useEffect(() => {
    if (postId) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [postId]);

  function handleSend() {
    if (!isAuth) { onRequireAuth?.(); return; }
    const trimmed = text.trim();
    if (!trimmed) return;
    mutation.mutate({ t: trimmed });
  }

  const comments = data?.items ?? [];

  return (
    <BottomSheet open={!!postId} onClose={onClose}>
      <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
        <h3 className="text-center text-sm font-semibold text-charcoal mb-4">
          Комментарии
        </h3>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {isLoading && (
            <p className="text-center text-xs text-charcoal-muted py-8">
              Загрузка...
            </p>
          )}
          {!isLoading && comments.length === 0 && (
            <p className="text-center text-xs text-charcoal-muted py-8">
              Пока нет комментариев. Будь первым!
            </p>
          )}
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>

        {/* Input */}
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isAuth ? "Добавить комментарий..." : "Войди, чтобы комментировать"}
            readOnly={!isAuth}
            onClick={() => { if (!isAuth) onRequireAuth?.(); }}
            className="flex-1 rounded-full bg-cream px-4 py-2 text-sm text-charcoal outline-none placeholder:text-charcoal-muted"
          />
          {isAuth && (
            <button
              onClick={handleSend}
              disabled={!text.trim() || mutation.isPending}
              className="text-terracotta text-sm font-semibold disabled:opacity-40"
            >
              {mutation.isPending ? "..." : "Отправить"}
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
