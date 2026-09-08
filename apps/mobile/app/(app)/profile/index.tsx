import { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Setting07Icon,
  VideoReplayIcon,
  AlbumNotFound01Icon,
  PlusSignIcon,
  MenuCircleIcon,
  ImageAdd01Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMe, fetchMyPosts } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth";
import { mediaUrl } from "../../../lib/storage";

type Tab = "posts" | "reels";

const SCREEN_W = Dimensions.get("window").width;
const CELL = (SCREEN_W - 2) / 3; // 2 px зазоры между колонками

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuth = Boolean(getAccessToken());
  const [tab, setTab] = useState<Tab>("posts");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuth,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["myPosts"],
    queryFn: () => fetchMyPosts(),
    enabled: isAuth,
  });

  const displayName = me?.displayName ?? "";
  const handle = me?.email?.split("@")[0] ?? "";
  const avatarUri = mediaUrl(me?.avatarUrl);

  const gridItems = (postsData?.items ?? []).map((p) => {
    const first = p.mediaItems?.[0];
    return {
      id: p.id,
      thumb: first?.fileUrl ?? null,
      isVideo: first?.mediaType === "video",
    };
  });

  const gridData = tab === "posts" ? gridItems : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0EB" }}>
      {/* Шапка */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "#F5F0EB",
          borderBottomWidth: 1,
          borderBottomColor: "#E8DDD4",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 15,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "600", color: "#1A1A1A" }}>
            {me?.displayName || handle || "Профиль"}
          </Text>
          <Pressable hitSlop={12}>
            <HugeiconsIcon icon={Setting07Icon} size={26} color="#1A1A1A" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Аватар + статистика */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 16,
          }}
        >
          {/* Подписки */}
          <Pressable style={{ alignItems: "center", minWidth: 72 }}>
            <Text style={s.statNum}>{me?.followingCount ?? 0}</Text>
            <Text style={s.statLabel}>Подписки</Text>
          </Pressable>

          {/* Аватар */}
          <View>
            <View style={s.avatarRing}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={s.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={[s.avatarImg, s.avatarFallback]}>
                  <Text style={s.avatarInitials}>
                    {initials(displayName || handle) || "?"}
                  </Text>
                </View>
              )}
            </View>
            {/* + бейдж */}
            <View style={s.badge}>
              <HugeiconsIcon icon={PlusSignIcon} size={13} color="#fff" />
            </View>
          </View>

          {/* Подписчики */}
          <Pressable style={{ alignItems: "center", minWidth: 72 }}>
            <Text style={s.statNum}>{me?.followersCount ?? 0}</Text>
            <Text style={s.statLabel}>Подписчики</Text>
          </Pressable>
        </View>

        {/* Имя и хендл */}
        <View
          style={{
            alignItems: "center",
            paddingBottom: 16,
            paddingHorizontal: 24,
          }}
        >
          {!!handle && <Text style={s.handle}>@{handle}</Text>}
        </View>

        {/* Кнопки действий */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
        >
          <Pressable
            style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.7 }]}
            onPress={() =>
              router.push("/(auth)/profile-setup?edit=true" as any)
            }
          >
            <Text style={s.actionBtnText}>Редактировать профиль</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.actionBtnText}>Аналитика</Text>
          </Pressable>
        </View>

        {/* Табы (иконки) */}
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#E8DDD4",
          }}
        >
          {(["posts", "reels"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
            >
              <HugeiconsIcon
                icon={t === "posts" ? MenuCircleIcon : VideoReplayIcon}
                size={22}
                color={tab === t ? "#1A1A1A" : "#8A8278"}
              />
            </Pressable>
          ))}
        </View>

        {/* Сетка постов */}
        {postsLoading ? (
          <Text
            style={{
              textAlign: "center",
              color: "#8A8278",
              padding: 40,
              fontSize: 14,
            }}
          >
            Загружаем…
          </Text>
        ) : gridData.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
            <HugeiconsIcon
              icon={AlbumNotFound01Icon}
              size={52}
              color="#D4C9BE"
            />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A1A" }}>
              Нет публикаций
            </Text>
            <Text
              style={{ fontSize: 13, color: "#8A8278", textAlign: "center" }}
            >
              Поделитесь первым фото или видео
            </Text>
            <Pressable
              onPress={() => router.push("/(app)/create" as any)}
              style={{
                marginTop: 4,
                backgroundColor: "#1A1A1A",
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 100,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                Создать пост
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {gridData.map((item, i) => (
              <Pressable
                key={item.id}
                style={{
                  width: CELL,
                  height: CELL,
                  marginLeft: i % 3 !== 0 ? 1 : 0,
                  marginTop: i >= 3 ? 1 : 0,
                  backgroundColor: "#E8DDD4",
                }}
              >
                {item.thumb ? (
                  <Image
                    source={{ uri: mediaUrl(item.thumb)! }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, backgroundColor: "#EDE8E2" }} />
                )}
                {item.isVideo && (
                  <View style={{ position: "absolute", bottom: 6, left: 6 }}>
                    <HugeiconsIcon icon={PlayIcon} size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statNum: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#8A8278",
    marginTop: 2,
    textAlign: "center",
  },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8DDD4",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E46D41",
  },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: "#fff" },
  badge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E46D41",
    borderWidth: 2.5,
    borderColor: "#F5F0EB",
    alignItems: "center",
    justifyContent: "center",
  },
  displayName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  handle: { fontSize: 13, color: "#8A8278" },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#EDE8E2",
    borderWidth: 1,
    borderColor: "#E8DDD4",
  },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#1A1A1A" },
});
