import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../components/ui/Button";
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

export default function ProfileSetupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === "true";

  const cachedMe = queryClient.getQueryData<{ email: string }>(["me"]);
  const email = cachedMe?.email ?? "";

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const initials = emailToInitials(email);

  async function save(skip = false) {
    setLoading(true);
    try {
      if (!skip) {
        await updateProfile({
          displayName: displayName.trim() || undefined,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (isEdit) router.back();
      else router.replace("/(app)");
    } catch {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sand"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 items-center px-8 pt-16">
        {isEdit && (
          <Pressable
            onPress={() => router.back()}
            className="absolute left-4 top-4 p-2"
          >
            <Text className="text-charcoal-muted text-sm">← Назад</Text>
          </Pressable>
        )}

        <Text className="font-heading text-[28px] font-bold text-charcoal">
          {isEdit ? "Редактировать профиль" : "Настройка профиля"}
        </Text>
        <Text className="mb-10 mt-2 text-sm text-charcoal-muted">
          {isEdit ? "Измените имя" : "Добавьте имя — или пропустите"}
        </Text>

        {/* Avatar placeholder — image picker coming in Phase 5 */}
        <View className="mb-8 h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-cream">
          <Text className="font-heading text-[30px] font-bold text-charcoal">
            {initials || "?"}
          </Text>
        </View>

        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Ваше имя"
          placeholderTextColor="#8A8278"
          maxLength={100}
          returnKeyType="done"
          onSubmitEditing={() => save(false)}
          className="mb-6 w-full rounded-2xl border border-border bg-cream px-5 py-4 text-[15px] text-charcoal"
        />

        <Button onPress={() => save(false)} loading={loading} disabled={loading}>
          Сохранить
        </Button>

        {!isEdit && (
          <Pressable
            onPress={() => save(true)}
            disabled={loading}
            className="mt-4"
          >
            <Text className="text-sm text-charcoal-muted underline">
              Пропустить
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
