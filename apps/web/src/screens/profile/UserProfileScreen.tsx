import { Icon, FollowButton } from "@selte/shared-ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchUserPosts,
  fetchUserProfile,
  followUser,
  unfollowUser,
} from "../../lib/api";
import { mediaUrl } from "../../lib/storage";
import { ProfileGrid } from "./ProfileGrid";

type Tab = "posts" | "reels";

function emailInitials(email: string): string {
  const handle = email.split("@")[0] ?? "";
  const parts = handle.split(/[._-]/).filter(Boolean);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function UserProfileScreen() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("posts");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => fetchUserPosts(userId!),
    enabled: !!userId,
  });

  // Redirect to own profile if viewing self
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => import("../../lib/api").then((m) => m.fetchMe()),
    staleTime: Infinity,
  });
  useEffect(() => {
    if (me && String(me.id) === String(userId)) {
      navigate("/profile", { replace: true });
    }
  }, [me, userId, navigate]);

  async function handleFollowChange(following: boolean) {
    if (following) {
      await followUser(userId!);
    } else {
      await unfollowUser(userId!);
    }
    queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }

  const displayName = user?.displayName ?? "";
  const emailHandle = user?.email?.split("@")[0] ?? "";

  const gridItems = (postsData?.items ?? []).map((post) => {
    const first = post.mediaItems?.[0];
    return {
      id: post.id,
      thumbnail: first?.fileUrl ?? null,
      hasVideo: first?.mediaType === "video",
    };
  });

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-charcoal-muted"
        >
          <Icon name="chevron-left" size={24} />
        </button>
        <span className="font-semibold text-charcoal">{emailHandle || "…"}</span>
        <div className="w-8" />
      </div>

      {/* Avatar + Stats */}
      <div className="flex items-center justify-center gap-10 px-6 pt-5 pb-4">
        <button
          onClick={() => navigate(`/profile/${userId}/followers`)}
          className="flex flex-col items-center gap-0.5 min-w-[60px]"
        >
          <span className="font-heading text-[20px] font-bold text-charcoal leading-tight">
            {user?.followersCount ?? 0}
          </span>
          <span className="text-xs text-charcoal-muted">Подписчики</span>
        </button>

        <div className="h-[88px] w-[88px] rounded-full overflow-hidden bg-sand border border-border flex-shrink-0">
          {userLoading ? (
            <div className="h-full w-full" />
          ) : user?.avatarUrl ? (
            <img src={mediaUrl(user.avatarUrl)!} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="font-heading text-[28px] font-bold text-charcoal">
                {emailInitials(user?.email ?? "")}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate(`/profile/${userId}/following`)}
          className="flex flex-col items-center gap-0.5 min-w-[60px]"
        >
          <span className="font-heading text-[20px] font-bold text-charcoal leading-tight">
            {user?.followingCount ?? 0}
          </span>
          <span className="text-xs text-charcoal-muted">Подписки</span>
        </button>
      </div>

      {/* Name */}
      <div className="flex flex-col items-center pb-4">
        <span className="font-heading text-[16px] font-bold text-charcoal">
          {displayName || emailHandle}
        </span>
        <span className="text-sm text-charcoal-muted">@{emailHandle}</span>
      </div>

      {/* Follow button */}
      {user && (
        <div className="flex justify-center pb-4">
          <FollowButton
            initialFollowing={user.isFollowing}
            onChange={handleFollowChange}
          />
        </div>
      )}

      {/* Icon tabs */}
      <div className="flex border-t border-b border-border">
        <button
          onClick={() => setTab("posts")}
          className={`flex flex-1 items-center justify-center py-2.5 border-b-2 transition-colors ${
            tab === "posts" ? "border-charcoal text-charcoal" : "border-transparent text-charcoal-muted"
          }`}
        >
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
        <button
          onClick={() => setTab("reels")}
          className={`flex flex-1 items-center justify-center py-2.5 border-b-2 transition-colors ${
            tab === "reels" ? "border-charcoal text-charcoal" : "border-transparent text-charcoal-muted"
          }`}
        >
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="15" height="10" rx="2" ry="2" />
            <polyline points="17 9 22 5 22 19 17 15" />
          </svg>
        </button>
      </div>

      {postsLoading ? (
        <div className="py-8 text-center text-sm text-charcoal-muted">Загружаем…</div>
      ) : (
        <ProfileGrid items={tab === "posts" ? gridItems : []} />
      )}
    </div>
  );
}
