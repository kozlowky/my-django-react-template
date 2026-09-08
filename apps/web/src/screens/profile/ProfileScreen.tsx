import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BottomSheet } from "@selte/shared-ui";
import { fetchMe, fetchMyPosts } from "../../lib/api";
import { mediaUrl } from "../../lib/storage";
import { getAccessToken } from "../../lib/auth";
import { ProfileGrid } from "./ProfileGrid";
import { HugeiconsIcon } from "@hugeicons/react";
import { MenuSquareIcon, VideoReplayIcon } from "@hugeicons/core-free-icons";

type Tab = "posts" | "reels";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const isAuth = Boolean(getAccessToken());
  const [tab, setTab] = useState<Tab>("posts");
  const [sheetOpen, setSheetOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuth,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["myPosts"],
    queryFn: () => fetchMyPosts(),
    enabled: isAuth,
  });

  const displayName = me?.displayName ?? "";
  const emailHandle = me?.email?.split("@")[0] ?? "";

  const gridItems = (postsData?.items ?? []).map((post) => {
    const first = post.mediaItems?.[0];
    return {
      id: post.id,
      thumbnail: first?.fileUrl ?? null,
      hasVideo: first?.mediaType === "video",
    };
  });

  return (
    <>
      <div className="flex flex-col">
        {/* Avatar + Stats row */}
        <div className="flex items-center justify-center gap-10 px-6 pt-5 pb-4">
          <button
            onClick={() => navigate("/profile/following")}
            className="flex flex-col items-center gap-0.5 min-w-[60px]"
          >
            <span className="font-heading text-[20px] font-bold text-charcoal leading-tight">
              {me?.followingCount ?? 0}
            </span>
            <span className="text-xs text-charcoal-muted">Подписки</span>
          </button>

          {/* Avatar with + badge */}
          <button
            onClick={() => setSheetOpen(true)}
            className="relative flex-shrink-0"
          >
            <div className="h-[72px] w-[72px] rounded-full overflow-hidden bg-sand border border-border">
              {meLoading ? (
                <div className="h-full w-full" />
              ) : me?.avatarUrl ? (
                <img
                  src={mediaUrl(me.avatarUrl)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="font-heading text-[22px] font-bold text-charcoal">
                    {initials(displayName || emailHandle)}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute bottom-0.5 right-0.5 h-6 w-6 rounded-full bg-terracotta border-2 border-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate("/profile/followers")}
            className="flex flex-col items-center gap-0.5 min-w-[60px]"
          >
            <span className="font-heading text-[20px] font-bold text-charcoal leading-tight">
              {me?.followersCount ?? 0}
            </span>
            <span className="text-xs text-charcoal-muted">Подписчики</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-5 pb-4">
          <button
            onClick={() => navigate("/onboarding/profile?edit=true")}
            className="flex flex-1 items-center justify-center rounded-xl bg-sand border border-border py-2 text-[13px] font-semibold text-charcoal active:opacity-70"
          >
            Редактировать профиль
          </button>
          <button className="flex flex-1 items-center justify-center rounded-xl bg-sand border border-border py-2 text-[13px] font-semibold text-charcoal active:opacity-70">
            Аналитика
          </button>
        </div>

        {/* Icon tabs */}
        <div className="flex border-t border-b border-border">
          <button
            onClick={() => setTab("posts")}
            className={`flex flex-1 items-center justify-center py-2.5 border-b-2 transition-colors ${
              tab === "posts" ? "border-charcoal text-charcoal" : "border-transparent text-charcoal-muted"
            }`}
          >
            <HugeiconsIcon icon={MenuSquareIcon as any} size={22} color="currentColor" strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setTab("reels")}
            className={`flex flex-1 items-center justify-center py-2.5 border-b-2 transition-colors ${
              tab === "reels" ? "border-charcoal text-charcoal" : "border-transparent text-charcoal-muted"
            }`}
          >
            <HugeiconsIcon icon={VideoReplayIcon as any} size={22} color="currentColor" strokeWidth={1.8} />
          </button>
        </div>

        {postsLoading ? (
          <div className="py-8 text-center text-sm text-charcoal-muted">Загружаем…</div>
        ) : (
          <ProfileGrid items={tab === "posts" ? gridItems : []} showCreateButton />
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) console.log("camera:", f.name); setSheetOpen(false); }} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) console.log("gallery:", f.name); setSheetOpen(false); }} />

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Фото профиля">
        <div className="flex flex-col divide-y divide-border">
          <button
            onClick={() => { setSheetOpen(false); setTimeout(() => cameraInputRef.current?.click(), 100); }}
            className="flex w-full items-center gap-4 py-4 text-charcoal active:bg-sand"
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-[15px]">Сделать фото</span>
          </button>
          <button
            onClick={() => { setSheetOpen(false); setTimeout(() => galleryInputRef.current?.click(), 100); }}
            className="flex w-full items-center gap-4 py-4 text-charcoal active:bg-sand"
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[15px]">Выбрать из галереи</span>
          </button>
          <button
            onClick={() => setSheetOpen(false)}
            className="w-full py-4 text-center text-[15px] font-semibold text-charcoal-muted active:bg-sand"
          >
            Отмена
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
