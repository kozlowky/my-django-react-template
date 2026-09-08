import { useEffect, useRef, useState, useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchFeed, fetchGuestFeed } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { usePostsWS, type LikesUpdateEvent } from "../../lib/usePostsWS";
import { StoriesRow } from "./StoriesRow";
import { PostCard } from "./PostCard";
import { AuthSheet } from "../auth/AuthSheet";
import { CommentsSheet } from "./CommentsSheet";
import { stories } from "../../mocks/stories";

export function FeedScreen() {
  const isAuth = Boolean(getAccessToken());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [authOpen, setAuthOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const scrolledRef = useRef(false);

  // Real-time likes state keyed by post id
  const [wsLikes, setWsLikes] = useState<
    Record<string, { likes_count: number; is_liked: boolean }>
  >({});

  const handleLikesUpdate = useCallback((e: LikesUpdateEvent) => {
    // 1. Update local real-time state (instant, no flicker)
    setWsLikes((prev) => ({
      ...prev,
      [e.post_id]: { likes_count: e.likes_count, is_liked: e.is_liked },
    }));

    // 2. Patch TanStack Query cache so likes survive navigation
    const queryKey = isAuth ? ["feed"] : ["guest-feed"];
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((post: any) =>
            post.id === e.post_id
              ? { ...post, isLiked: e.is_liked, likesCount: e.likes_count }
              : post
          ),
        })),
      };
    });
  }, [isAuth, queryClient]);

  const { subscribe, unsubscribe, likeViaWS, unlikeViaWS } = usePostsWS({
    onLikesUpdate: handleLikesUpdate,
    enabled: true,
  });

  // Soft-gate banner
  useEffect(() => {
    if (isAuth) return;
    const onScroll = () => {
      if (!scrolledRef.current && window.scrollY > 100) {
        scrolledRef.current = true;
        setBannerVisible(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isAuth]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: isAuth ? ["feed"] : ["guest-feed"],
      queryFn: ({ pageParam }) =>
        isAuth
          ? fetchFeed(pageParam as string | undefined)
          : fetchGuestFeed(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  function handleAuthSuccess(isNewUser: boolean) {
    setAuthOpen(false);
    if (isNewUser) {
      navigate("/onboarding/profile");
    } else {
      queryClient.invalidateQueries({ queryKey: ["guest-feed"] });
      navigate("/feed", { replace: true });
    }
  }

  return (
    <div className="min-h-full bg-sand">
      {/* Soft-gate banner */}
      {!isAuth && bannerVisible && (
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-cream/80 px-4 py-3 backdrop-blur-md">
          <span className="text-sm text-charcoal">
            Войди, чтобы лайкать и подписываться
          </span>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="rounded-full bg-terracotta px-4 py-1.5 text-xs font-semibold text-white"
          >
            Войти →
          </button>
        </div>
      )}

      <StoriesRow stories={isAuth ? stories : []} />

      {status === "pending" && (
        <div className="py-16 text-center text-sm text-charcoal-muted">
          Загрузка...
        </div>
      )}
      {status === "error" && (
        <div className="py-16 text-center text-sm text-charcoal-muted">
          Не удалось загрузить ленту. Попробуй ещё раз.
        </div>
      )}

      <div className="divide-y divide-border">
        {posts.map((post) => {
          const ws = wsLikes[post.id];
          return (
            <PostCard
              key={post.id}
              post={post}
              onRequireAuth={() => setAuthOpen(true)}
              onOpenComments={(id) => setCommentsPostId(id)}
              onLike={likeViaWS}
              onUnlike={unlikeViaWS}
              onSubscribe={subscribe}
              onUnsubscribe={unsubscribe}
              wsLikesCount={ws?.likes_count}
              wsIsLiked={ws?.is_liked}
            />
          );
        })}
      </div>

      {posts.length === 0 && status === "success" && (
        <p className="px-8 py-20 text-center text-sm text-charcoal-muted">
          Здесь пока тихо. Подпишись на кого-нибудь — и всё изменится.
        </p>
      )}

      {hasNextPage && (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full bg-cream px-6 py-2 text-sm text-charcoal shadow-sm"
          >
            {isFetchingNextPage ? "Загрузка..." : "Ещё"}
          </button>
        </div>
      )}

      <CommentsSheet
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onRequireAuth={() => setAuthOpen(true)}
      />
      <AuthSheet
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
