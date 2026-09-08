import { useNavigate } from "react-router-dom";
import { mediaUrl } from "../../lib/storage";

interface GridItem {
  id: string;
  thumbnail: string | null;
  hasVideo: boolean;
}

interface ProfileGridProps {
  items: GridItem[];
  showCreateButton?: boolean;
}

export function ProfileGrid({ items, showCreateButton = false }: ProfileGridProps) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-16 gap-4">
        <svg
          viewBox="0 0 64 64"
          width={56}
          height={56}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-charcoal/20"
        >
          <rect x="4" y="4" width="24" height="24" rx="3" />
          <rect x="36" y="4" width="24" height="24" rx="3" />
          <rect x="4" y="36" width="24" height="24" rx="3" />
          <rect x="36" y="36" width="24" height="24" rx="3" />
        </svg>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[15px] font-semibold text-charcoal">Нет публикаций</span>
          <span className="text-xs text-charcoal-muted text-center">
            Поделитесь первым фото или видео
          </span>
        </div>
        {showCreateButton && (
          <button
            onClick={() => navigate("/create")}
            className="mt-1 rounded-full bg-charcoal px-6 py-2 text-sm font-semibold text-white"
          >
            Создать пост
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {items.map((item) => (
        <div key={item.id} className="relative aspect-square overflow-hidden bg-border">
          {item.thumbnail ? (
            <img src={mediaUrl(item.thumbnail)!} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-sand" />
          )}
          {item.hasVideo && (
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
