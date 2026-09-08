import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMe, fetchFeed, fetchGuestFeed } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";

export function SplashScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function boot() {
      const isAuth = Boolean(getAccessToken());

      if (isAuth) {
        // Prefetch all data the feed needs — runs in parallel.
        await Promise.all([
          queryClient.prefetchQuery({ queryKey: ["me"],   queryFn: fetchMe }),
          queryClient.prefetchInfiniteQuery({
            queryKey:        ["feed"],
            queryFn:         ({ pageParam }) => fetchFeed(pageParam as string | undefined),
            initialPageParam: undefined as string | undefined,
          }),
        ]);
      } else {
        // Guest: prefetch the public feed so FeedScreen has data immediately.
        await queryClient.prefetchInfiniteQuery({
          queryKey:        ["guest-feed"],
          queryFn:         ({ pageParam }) => fetchGuestFeed(pageParam as string | undefined),
          initialPageParam: undefined as string | undefined,
        });
      }

      navigate("/feed", { replace: true });
    }

    boot();
  }, [navigate, queryClient]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-sand">
      <h1 className="font-logo text-7xl tracking-tight text-charcoal">
        se
        <span className="inline-block align-bottom text-[6rem] leading-none">l</span>
        te
      </h1>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-charcoal-muted animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
