import { Button, Icon } from "@selte/shared-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { updateProfile } from "../../lib/api";

function emailToInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[.\-_]/);
  return words
    .map((w) => w[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export function ProfileSetupScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const queryClient = useQueryClient();

  // Email comes from the cached `me` query if available, fallback to empty
  const cachedMe = queryClient.getQueryData<{ email: string }>(["me"]);
  const email = cachedMe?.email ?? "";

  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = emailToInitials(email);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function save(skip = false) {
    setLoading(true);
    try {
      if (!skip) {
        await updateProfile({
          displayName: displayName.trim() || undefined,
          avatar: avatarFile ?? undefined,
        });
      }
      // Invalidate me so ProfileScreen re-fetches
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (isEdit) navigate(-1);
      else navigate("/feed", { replace: true });
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-8 pt-16 text-center">
      {isEdit && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 p-2 text-charcoal-muted"
        >
          <Icon name="chevron-left" size={24} />
        </button>
      )}
      <h1 className="font-heading text-[28px] font-bold text-charcoal">
        {isEdit ? "Редактировать профиль" : "Настройка профиля"}
      </h1>
      <p className="mb-10 mt-2 text-sm text-charcoal-muted">
        {isEdit
          ? "Измените фото или имя"
          : "Добавьте фото и имя — или пропустите"}
      </p>

      {/* Avatar picker */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative mb-8 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-sand transition hover:border-terracotta"
      >
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-heading text-[30px] font-bold text-charcoal">
            {initials || "?"}
          </span>
        )}
        <div className="absolute bottom-0 flex w-full items-center justify-center bg-charcoal/40 py-1">
          <span className="text-[10px] font-semibold text-white">фото</span>
        </div>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Display name */}
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Ваше имя"
        maxLength={100}
        className="mb-6 w-full rounded-2xl border border-border bg-cream px-5 py-4 text-[15px] outline-none focus:border-terracotta"
      />

      <Button
        type="button"
        disabled={loading}
        onClick={() => save(false)}
        className="mb-3 w-full"
      >
        {loading ? "Сохраняем…" : "Сохранить"}
      </Button>

      {!isEdit && (
        <button
          type="button"
          disabled={loading}
          onClick={() => save(true)}
          className="text-sm text-charcoal-muted underline-offset-2 hover:underline"
        >
          Пропустить
        </button>
      )}
    </div>
  );
}
