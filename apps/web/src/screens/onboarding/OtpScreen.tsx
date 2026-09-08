import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@selte/shared-ui";
import { verifyOtp } from "../../lib/api";
import { setAccessToken } from "../../lib/auth";

const LENGTH = 4;

export function OtpScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < LENGTH) return;
    setLoading(true);
    setError("");

    const result = await verifyOtp(email, code).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));
    setLoading(false);
    if (result.ok) {
      setAccessToken(result.accessToken);
      queryClient.clear();
      navigate(result.isNewUser ? "/onboarding/profile" : "/feed", { replace: true });
    } else {
      setError(result.message);
      setDigits(Array(LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-screen flex-col items-center px-8 pt-16 text-center"
    >
      <h1 className="font-heading text-[28px] font-bold text-charcoal">
        Введите код
      </h1>
      <p className="mb-8 mt-2 text-sm text-charcoal-muted">
        Отправили 4-значный код на {email || "ваш email"}
      </p>
      <div className="mb-8 flex gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxLength={1}
            inputMode="numeric"
            className="h-14 w-[64px] rounded-xl border border-border bg-cream text-center text-2xl font-bold outline-none focus:border-terracotta"
          />
        ))}
      </div>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <Button
        type="submit"
        disabled={loading || digits.join("").length < LENGTH}
      >
        {loading ? "Проверяем..." : "Подтвердить"}
      </Button>
    </form>
  );
}
