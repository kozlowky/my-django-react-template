import { useEffect } from "react";
import type { Story } from "@selte/design-types";

interface Props {
  story: Story;
  onClose: () => void;
}

export function StoryViewer({ story, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={onClose}
    >
      <div className="h-0.5 bg-white/30 mx-3 mt-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full animate-[story_5s_linear_forwards]"
          style={{ animationName: "story", animationDuration: "5s" }}
        />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={story.avatarUrl}
          className="h-9 w-9 rounded-full object-cover"
        />
        <span className="text-white text-sm font-medium">{story.username}</span>
      </div>
      <img src={story.imageUrl} className="flex-1 object-cover w-full" />
    </div>
  );
}
