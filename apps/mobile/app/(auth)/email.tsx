import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { requestOtp } from "../../lib/api";

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const result = await requestOtp(email.trim()).catch(() => ({
      ok: false as const,
      message: "Ошибка соединения",
    }));

    setLoading(false);
    if (result.ok) {
      router.push({ pathname: "/(auth)/otp", params: { email: email.trim() } });
    } else {
      setError(result.message);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sand"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 items-center px-8 pt-16">
        <Text className="font-heading text-[28px] font-bold text-charcoal">
          Войти
        </Text>
        <Text className="mb-8 mt-2 text-sm text-charcoal-muted">
          Введите email — отправим код подтверждения
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Введите ваш email"
          placeholderTextColor="#8A8278"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          className="mb-5 w-full rounded-2xl border border-border bg-cream px-5 py-4 text-[15px] text-charcoal"
        />

        {!!error && (
          <Text className="mb-4 text-sm text-red-500">{error}</Text>
        )}

        <Button onPress={handleSubmit} loading={loading} disabled={!email.trim()}>
          Отправить код
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
