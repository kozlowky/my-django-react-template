import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheet, Button } from "@selte/shared-ui";
import { requestOtp, verifyOtp } from "../../lib/api";
import { setAccessToken } from "../../lib/auth";

type Step = "email" | "otp";

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  /** Вызывается после успешного входа */
  onSuccess: (isNewUser: boolean) => void;
}

const OTP_LEN = 4;

export function AuthSheet({ open, onClose, onSuccess }: AuthSheetProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  function reset() {
    setStep("email");
    setEmail("");
    setDigits(Array(OTP_LEN).fill(""));
    setError("");
    setLoading(false);
    setCooldown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function startCooldown(sec = 60) {
    setCooldown(sec);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function focusOtp(index: number) {
    setTimeout(() => inputsRef.current[index]?.focus(), 80);
  }

  // ── step: email ───────────────────────────────────────────────────────────

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await requestOtp(email).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));
    setLoading(false);
    if (result.ok) {
      setStep("otp");
      startCooldown();
      focusOtp(0);
    } else {
      setError(result.message);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    const result = await requestOtp(email).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));
    setLoading(false);
    if (result.ok) {
      setDigits(Array(OTP_LEN).fill(""));
      startCooldown();
      focusOtp(0);
    } else {
      setError(result.message);
    }
  }

  // ── step: otp ─────────────────────────────────────────────────────────────

  function handleDigit(index: number, e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = val;
    setDigits(next);
    setError("");

    if (val && index < OTP_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    // автосабмит при последней цифре
    if (val && index === OTP_LEN - 1) {
      submitOtp(next);
    }
  }

  function handleDigitKey(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function submitOtp(digitArr = digits) {
    const code = digitArr.join("");
    if (code.length < OTP_LEN) return;
    setLoading(true);
    setError("");
    const result = await verifyOtp(email, code).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));
    setLoading(false);
    if (result.ok) {
      setAccessToken(result.accessToken);
      queryClient.invalidateQueries();
      onSuccess(result.isNewUser);
      reset();
    } else {
      setError(result.message);
      setDigits(Array(OTP_LEN).fill(""));
      focusOtp(0);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      {step === "email" ? (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <h2 className="text-center font-heading text-[22px] font-bold text-charcoal">
            Войдите в SELTE
          </h2>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-cream px-5 py-4 text-[15px] outline-none focus:border-terracotta"
          />
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading || !email}>
            {loading ? "Отправляем..." : "Получить код"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <h2 className="font-heading text-[22px] font-bold text-charcoal">
            Код отправлен
          </h2>
          <p className="text-center text-sm text-charcoal-muted">
            на{" "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
                setDigits(Array(OTP_LEN).fill(""));
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              className="underline underline-offset-2 hover:text-charcoal"
            >
              {email}
            </button>
          </p>

          {/* OTP inputs */}
          <div className="flex gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                value={digit}
                onChange={(e) => handleDigit(i, e)}
                onKeyDown={(e) => handleDigitKey(i, e)}
                maxLength={1}
                inputMode="numeric"
                className="h-14 w-[60px] rounded-xl border border-border bg-cream text-center text-2xl font-bold outline-none transition focus:border-terracotta"
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Повторная отправка */}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="text-sm text-charcoal-muted transition disabled:opacity-50"
          >
            {cooldown > 0
              ? `Отправить снова через 0:${String(cooldown).padStart(2, "0")}`
              : "Не пришло? Отправить снова"}
          </button>

          <Button
            onClick={() => submitOtp()}
            disabled={loading || digits.join("").length < OTP_LEN}
          >
            {loading ? "Проверяем..." : "Войти"}
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
