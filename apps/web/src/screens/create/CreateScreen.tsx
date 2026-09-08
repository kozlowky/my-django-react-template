import { Icon } from "@selte/shared-ui";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createPost } from "../../lib/api";

type Step = "pick" | "compose";
type CreateType = "post" | "story" | "reel";

interface Preview {
  file: File;
  objectUrl: string;
  type: "image" | "video";
}

export function CreateScreen() {
  const [searchParams] = useSearchParams();
  const createType = (searchParams.get("type") ?? "post") as CreateType;

  const [step, setStep] = useState<Step>("pick");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Стори: заглушка ──────────────────────────────────────────────
  if (createType === "story") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-3">
        <p className="font-semibold text-charcoal">Стори</p>
        <p className="text-sm text-charcoal-muted text-center">
          Эта функция в разработке — скоро появится.
        </p>
      </div>
    );
  }

  // ── Конфиг по типу ───────────────────────────────────────────────
  const isReel = createType === "reel";
  const title = isReel ? "Новый Рилс" : "Новый пост";
  const accept = isReel ? "video/*" : "image/*,video/*";
  const multiple = !isReel;
  const hint = isReel ? "Одно видео до 60 сек" : "До 10 фото или видео";
  const mediaAspect = isReel ? "aspect-[9/16]" : "aspect-square";

  // ── Handlers ─────────────────────────────────────────────────────
  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: Preview[] = Array.from(files).map((f) => ({
      file: f,
      objectUrl: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
    }));
    setPreviews(next);
    setStep("compose");
  }

  function reset() {
    previews.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    setPreviews([]);
    setCaption("");
    setLocation("");
    setError(null);
    setStep("pick");
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await createPost({
        caption,
        location,
        files: previews.map((p) => p.file),
      });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      reset();
      navigate("/feed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: выбор файлов ─────────────────────────────────────────
  if (step === "pick") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-3 cursor-pointer hover:border-terracotta transition-colors"
        >
          <Icon
            name={isReel ? "camera" : "image"}
            size={40}
            className="text-charcoal-muted"
          />
          <p className="text-charcoal font-semibold">
            {isReel ? "Выбрать видео" : "Выбрать фото или видео"}
          </p>
          <p className="text-xs text-charcoal-muted">{hint}</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  // ── Step 2: превью + форма ───────────────────────────────────────
  const first = previews[0];
  return (
    <div className="flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={reset} className="text-charcoal-muted p-1 -ml-1">
          <Icon name="menu" size={20} />
        </button>
        <span className="font-semibold text-charcoal">{title}</span>
        <button
          onClick={submit}
          disabled={loading}
          className="text-sm font-semibold text-terracotta disabled:opacity-40"
        >
          {loading ? "Отправка…" : "Опубликовать"}
        </button>
      </div>

      {/* Превью — aspect зависит от типа */}
      <div className={`${mediaAspect} bg-border overflow-hidden`}>
        {first.type === "video" ? (
          <video
            src={first.objectUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            controls
          />
        ) : (
          <img
            src={first.objectUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Доп. файлы (только для поста с каруселью) */}
      {!isReel && previews.length > 1 && (
        <div
          className="flex gap-1.5 px-4 pt-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {previews.map((p, i) => (
            <div
              key={i}
              className="flex-none w-16 h-16 rounded-md overflow-hidden bg-border"
            >
              {p.type === "video" ? (
                <video
                  src={p.objectUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <img
                  src={p.objectUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Форма */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Напишите подпись…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm text-charcoal placeholder:text-charcoal-muted outline-none border-b border-border pb-3"
        />
        <div className="flex items-center gap-2 text-charcoal-muted">
          <Icon name="map-pin" size={16} />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Добавить место"
            className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-charcoal-muted outline-none"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
