import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { verifyOtp } from "../../lib/api";
import { setAccessToken } from "../../lib/auth";

const LENGTH = 4;

export default function OtpScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { email = "" } = useLocalSearchParams<{ email: string }>();

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef<(TextInput | null)[]>([]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    // Auto-submit when last digit filled
    if (digit && index === LENGTH - 1) {
      const code = [...next].join("");
      if (code.length === LENGTH) submit(code);
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function submit(code = digits.join("")) {
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
      router.replace(result.isNewUser ? "/(auth)/profile-setup" : "/(app)");
    } else {
      setError(result.message);
      setDigits(Array(LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sand"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 items-center px-8 pt-16">
        <Text className="font-heading text-[28px] font-bold text-charcoal">
          Введите код
        </Text>
        <Text className="mb-8 mt-2 text-sm text-charcoal-muted">
          Отправили 4-значный код на {email || "ваш email"}
        </Text>

        <View className="mb-8 flex-row gap-3">
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              value={digit}
              onChangeText={(v) => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              maxLength={1}
              keyboardType="number-pad"
              textAlign="center"
              className="h-14 w-16 rounded-xl border border-border bg-cream text-center text-2xl font-bold text-charcoal"
            />
          ))}
        </View>

        {!!error && (
          <Text className="mb-4 text-sm text-red-500">{error}</Text>
        )}

        <Button
          onPress={() => submit()}
          loading={loading}
          disabled={digits.join("").length < LENGTH}
        >
          Подтвердить
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
