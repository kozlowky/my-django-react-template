import { useState } from "react";
import type { Story } from "@selte/design-types";
import { StoryViewer } from "./StoryViewer";

interface Props {
  stories: Story[];
}

export function StoriesRow({ stories }: Props) {
  const [active, setActive] = useState<Story | null>(null);

  if (stories.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-5 py-3 scrollbar-none">
        {stories.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s)}
            className="relative flex-shrink-0 flex flex-col items-center gap-1.5"
          >
            {/* Square thumbnail */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-black/5">
              <img
                src={s.avatarUrl}
                alt={s.username}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Unread dot — on the button (outside overflow-hidden), top-right of the square */}
            {!s.viewed && (
              <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-terracotta ring-2 ring-sand" />
            )}

            {/* Username below */}
            <span className="max-w-[64px] truncate text-[10px] font-medium text-charcoal-muted">
              {s.username}
            </span>
          </button>
        ))}
      </div>
      {active && <StoryViewer story={active} onClose={() => setActive(null)} />}
    </>
  );
}
