import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Post } from "../../lib/api";
import { savePost, unsavePost, likePost, unlikePost } from "../../lib/api";
import { mediaUrl } from "../../lib/storage";
import { HugeiconsIcon } from "@hugeicons/react";
import { CommentIcon, SendIcon } from "@hugeicons/core-free-icons";
import { getAccessToken } from "../../lib/auth";

interface PostCardProps {
  post: Post;
  onRequireAuth?: () => void;
  onOpenComments?: (postId: string) => void;
  // WS like controls (passed from FeedScreen)
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onSubscribe?: (postId: string) => void;
  onUnsubscribe?: (postId: string) => void;
  // Real-time override from WS broadcast
  wsLikesCount?: number;
  wsIsLiked?: boolean;
}

export function PostCard({
  post,
  onRequireAuth,
  onOpenComments,
  onLike,
  onUnlike,
  onSubscribe,
  onUnsubscribe,
  wsLikesCount,
  wsIsLiked,
}: PostCardProps) {
  const isAuth = Boolean(getAccessToken());
  const qc = useQueryClient();

  // Local optimistic state; overridden by WS broadcast when available
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved);
  const [showHeart, setShowHeart] = useState(false);

  // Apply real-time WS updates
  useEffect(() => {
    if (wsLikesCount !== undefined) setLikesCount(wsLikesCount);
  }, [wsLikesCount]);
  useEffect(() => {
    if (wsIsLiked !== undefined) setLiked(wsIsLiked);
  }, [wsIsLiked]);

  // Subscribe to WS group for this post on mount
  useEffect(() => {
    onSubscribe?.(post.id);
    return () => onUnsubscribe?.(post.id);
  }, [post.id, onSubscribe, onUnsubscribe]);

  const firstMedia = post.mediaItems[0];

  async function handleLike() {
    if (!isAuth) { onRequireAuth?.(); return; }
    const next = !liked;
    // Optimistic update
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    try {
      // GraphQL mutation — reliable source of truth
      if (next) await likePost(post.id);
      else await unlikePost(post.id);
      // Patch TQ cache so like survives navigation
      const newCount = next ? likesCount + 1 : likesCount - 1;
      for (const key of [["feed"], ["guest-feed"]]) {
        qc.setQueryData(key, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((p: any) =>
                p.id === post.id
                  ? { ...p, isLiked: next, likesCount: newCount }
                  : p
              ),
            })),
          };
        });
      }
      // Also broadcast via WS if open (real-time for other viewers)
      if (next) onLike?.(post.id);
      else onUnlike?.(post.id);
    } catch {
      // Rollback on failure
      setLiked(!next);
      setLikesCount((c) => c + (next ? -1 : 1));
    }
  }

  async function handleSave() {
    if (!isAuth) { onRequireAuth?.(); return; }
    const next = !saved;
    setSaved(next);
    try {
      if (next) await savePost(post.id);
      else await unsavePost(post.id);
    } catch {
      setSaved(!next);
    }
  }

  function doubleTap() {
    if (!isAuth) { onRequireAuth?.(); return; }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    if (!liked) {
      void handleLike();
    }
  }

  return (
    <div className="bg-white mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-cream flex items-center justify-center text-xs font-semibold text-charcoal-muted uppercase">
          {post.author.displayName.slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold tracking-wide text-charcoal">
            {post.author.displayName}
          </div>
          {post.location && (
            <div className="text-xs text-charcoal-muted">{post.location}</div>
          )}
        </div>
        <span className="text-charcoal-muted text-lg leading-none">···</span>
      </div>

      {/* Media */}
      {firstMedia && (
        <div className="relative select-none" onDoubleClick={doubleTap}>
          {firstMedia.mediaType === "video" ? (
            <video
              src={mediaUrl(firstMedia.fileUrl)!}
              className="w-full aspect-square object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={mediaUrl(firstMedia.fileUrl)!}
              className="w-full aspect-square object-cover"
              alt={post.caption}
            />
          )}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-7xl animate-ping text-white drop-shadow-lg">♥</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-3 py-2 gap-4">
        <button onClick={handleLike} className="flex items-center gap-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? "#ef4444" : "none"} xmlns="http://www.w3.org/2000/svg"><path d="M12 20.5C12 20.5 3 14.5 3 8.5C3 6.015 5.015 4 7.5 4C9.355 4 10.963 5.064 11.719 6.603C11.855 6.876 12.145 6.876 12.281 6.603C13.037 5.064 14.645 4 16.5 4C18.985 4 21 6.015 21 8.5C21 14.5 12 20.5 12 20.5Z" stroke={liked ? "#ef4444" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {likesCount > 0 && (
            <span className="text-xs text-charcoal-muted">{likesCount}</span>
          )}
        </button>
        <button
          className="flex items-center gap-1"
          onClick={() => onOpenComments?.(post.id)}
        >
          <HugeiconsIcon icon={CommentIcon as any} size={24} color="currentColor" strokeWidth={1.5} />
          {post.commentsCount > 0 && (
            <span className="text-xs text-charcoal-muted">{post.commentsCount}</span>
          )}
        </button>
        <button>
          <HugeiconsIcon icon={SendIcon as any} size={24} color="currentColor" strokeWidth={1.5} />
        </button>
        <div className="flex-1" />
        <button onClick={handleSave}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? "#E46D41" : "none"} xmlns="http://www.w3.org/2000/svg"><path d="M5 6C5 4.343 6.343 3 8 3H16C17.657 3 19 4.343 19 6V20.5C19 20.776 18.858 21.033 18.625 21.184C18.392 21.334 18.101 21.358 17.847 21.247L12 18.736L6.153 21.247C5.899 21.358 5.608 21.334 5.375 21.184C5.142 21.033 5 20.776 5 20.5V6Z" stroke={saved ? "#E46D41" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-4 text-sm text-charcoal">
          <span className="font-semibold">{post.author.displayName}</span>{" "}
          {post.caption}
        </div>
      )}
    </div>
  );
}
