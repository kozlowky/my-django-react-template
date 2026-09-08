import { Icon } from "@selte/shared-ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchFollowers, fetchFollowing, fetchMe } from "../../lib/api";
import { mediaUrl } from "../../lib/storage";

interface Props {
  mode: "followers" | "following";
}

function emailInitials(email: string): string {
  const handle = email.split("@")[0] ?? "";
  const parts = handle.split(/[._-]/).filter(Boolean);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function FollowListScreen({ mode }: Props) {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState("");

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const targetId = userId ?? me?.id ?? "";

  const { data: list = [], isLoading } = useQuery({
    queryKey: [mode, targetId],
    queryFn: () =>
      mode === "followers"
        ? fetchFollowers(targetId)
        : fetchFollowing(targetId),
    enabled: !!targetId,
  });

  const filtered = query.trim()
    ? list.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      )
    : list;

  const title = mode === "followers" ? "Подписчики" : "Подписки";

  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-charcoal-muted"
        >
          <Icon name="chevron-left" size={24} />
        </button>

        {searchActive ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск…"
            className="flex-1 mx-3 text-sm text-charcoal outline-none"
          />
        ) : (
          <span className="font-semibold text-charcoal">{title}</span>
        )}

        <button
          onClick={() => {
            setSearchActive((v) => !v);
            setQuery("");
          }}
          className="p-1 -mr-1 text-charcoal-muted"
        >
          <Icon name={searchActive ? "x" : "search"} size={20} />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-charcoal-muted">
          Загружаем…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-2xl">👤</span>
          <span className="text-sm text-charcoal-muted">
            {query ? "Никого не найдено" : "Пока никого нет"}
          </span>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => navigate(`/profile/${u.id}`)}
              className="flex items-center gap-3 px-4 py-3 text-left hover:bg-sand/50 transition-colors"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-sand border border-border">
                {u.avatarUrl ? (
                  <img
                    src={mediaUrl(u.avatarUrl)!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-charcoal">
                    {emailInitials(u.email)}
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-charcoal truncate">
                  {u.displayName || u.email.split("@")[0]}
                </span>
                <span className="text-xs text-charcoal-muted truncate">
                  @{u.email.split("@")[0]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
