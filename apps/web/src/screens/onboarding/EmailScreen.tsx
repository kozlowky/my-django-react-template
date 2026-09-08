import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@selte/shared-ui";
import { requestOtp } from "../../lib/api";

export function EmailScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

   async function handleSubmit(e: FormEvent) {
     e.preventDefault();
     setLoading(true);
     setError("");

    const result = await requestOtp(email).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));
    setLoading(false);
    if (result.ok) {
      navigate("/login/otp", { state: { email } });
    } else {
      setError(result.message);
    }
   }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-screen flex-col items-center px-8 pt-16 text-center"
    >
      <h1 className="font-heading text-[28px] font-bold text-charcoal">
        Войти
      </h1>
      <p className="mb-8 mt-2 text-sm text-charcoal-muted">
        Введите email — отправим код подтверждения
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Введите ваш email"
        className="mb-5 w-full rounded-2xl border border-border bg-cream px-5 py-4 text-[15px] outline-none focus:border-terracotta"
      />
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Отправляем..." : "Отправить код"}
      </Button>
    </form>
  );
}
