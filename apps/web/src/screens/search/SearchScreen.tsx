import { Icon } from "@selte/shared-ui";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "../../lib/gql";

interface UserResult {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

const SEARCH_USERS = /* GraphQL */ `
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id
      email
      displayName
      avatarUrl
    }
  }
`;

function emailInitials(email: string): string {
  const handle = email.split("@")[0] ?? "";
  const parts = handle.split(/[._-]/).filter(Boolean);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await gql<{ searchUsers: UserResult[] }>(SEARCH_USERS, {
          query,
        });
        setResults(data.searchUsers);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="px-5 pt-4">
      {/* Search input */}
      <div className="relative mb-5">
        <Icon
          name="search"
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted"
        />
        <input
          type="text"
          placeholder="Поиск людей…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl bg-sand/60 py-3 pl-10 pr-4 text-sm text-charcoal placeholder-charcoal-muted outline-none focus:ring-1 focus:ring-terracotta/40"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted"
          >
            {/* "x" нет в IconName — рисуем инлайн */}
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* States */}
      {loading && (
        <p className="text-center text-sm text-charcoal-muted">Поиск…</p>
      )}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-center text-sm text-charcoal-muted">
          Никого не нашлось
        </p>
      )}

      {/* Results */}
      <ul className="flex flex-col gap-1">
        {results.map((user) => (
          <li
            key={user.id}
            onClick={() => navigate(`/profile/${user.id}`)}
            className="flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-sand/50 active:bg-sand"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand">
                <span className="font-heading text-sm font-bold text-charcoal">
                  {emailInitials(user.email)}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-charcoal">
              {user.displayName || user.email.split("@")[0]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
