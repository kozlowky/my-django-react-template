import {
  Home02Icon,
  Notification01Icon,
  Search01Icon,
  SendIcon,
  VideoReplayIcon,
  Cancel01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSegments } from "expo-router";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBar } from "../../contexts/TabBarContext";
import { fetchMe } from "../../lib/api";
import { useState } from "react";

const CREATE_OPTIONS = [
  { type: "post", label: "Пост", icon: SendIcon },
  { type: "reel", label: "Видео Reels", icon: VideoReplayIcon },
] as const;

const PILL_TABS: {
  segment: string;
  icon: any;
}[] = [
  { segment: "(feed)", icon: Home02Icon },
  { segment: "reels", icon: VideoReplayIcon },
  { segment: "messenger", icon: SendIcon },
  { segment: "activity", icon: Notification01Icon },
];

const CREAM = "rgba(255,255,255,0.85)";
const DARK = "#1A1A1A";
const MUTED = "#8A8278";
const ACCENT = "#E46D41";
const BORDER = "rgba(255,255,255,0.6)";

const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 16,
  elevation: 10,
};

const PILL_H = 58;

export function TabBar() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { translateY, isHidden } = useTabBar();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!me) return null;

  const currentSegment =
    [...segments].reverse().find((s) => !s.startsWith("(")) ?? "";

  function isActive(segment: string) {
    if (segment === "(feed)")
      return currentSegment === "" || segments.includes("(feed)");
    return currentSegment === segment;
  }

  function navigate(segment: string) {
    if (segment === "(feed)") router.push("/(app)/(feed)");
    else router.push(`/(app)/${segment}` as any);
  }

  return (
    <>
      {/* Backdrop дропдауна */}
      {dropdownOpen && (
        <Pressable
          style={{ position: "absolute", inset: 0, zIndex: 19 }}
          onPress={() => setDropdownOpen(false)}
        />
      )}

      {/* Контейнер — без transform, стоит на месте */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 12,
          paddingHorizontal: 22,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
        pointerEvents="box-none"
      >
        {/* Пилюля — едет вниз */}
        <Animated.View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            height: PILL_H,
            borderRadius: PILL_H / 2,
            backgroundColor: CREAM,
            borderWidth: 1,
            borderColor: BORDER,
            transform: [{ translateY }],
            ...shadow,
          }}
        >
          {PILL_TABS.map((tab) => {
            const active = isActive(tab.segment);
            return (
              <Pressable
                key={tab.segment}
                onPress={() => navigate(tab.segment)}
                style={({ pressed }) => ({
                  width: 48,
                  height: PILL_H - 10,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: (PILL_H - 10) / 2,
                  backgroundColor: active ? "#FFF5F0" : "transparent",
                  opacity: pressed ? 0.6 : 1,
                  ...(active && {
                    shadowColor: "#E46D41",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  }),
                })}
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  size={22}
                  color={active ? "#E46D41" : "#8A8278"}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Поиск / Plus — всегда на месте */}
        <View style={{ position: "relative" }}>
          {/* Дропдаун вверх */}
          {dropdownOpen && (
            <View
              style={{
                position: "absolute",
                bottom: PILL_H + 8,
                right: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 6,
                minWidth: 160,
                zIndex: 20,
                ...shadow,
              }}
            >
              {CREATE_OPTIONS.map((opt, i) => (
                <Pressable
                  key={opt.type}
                  onPress={() => {
                    setDropdownOpen(false);
                    router.push(`/(app)/create?type=${opt.type}` as any);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    borderBottomWidth: i < CREATE_OPTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: "#F0EBE5",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <HugeiconsIcon icon={opt.icon} size={18} color="#1A1A1A" />
                  <Text style={{ fontSize: 15, color: "#1A1A1A" }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <View
            style={{
              width: PILL_H,
              height: PILL_H,
              borderRadius: PILL_H / 2,
              backgroundColor: CREAM,
              borderWidth: 1,
              borderColor: BORDER,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              ...shadow,
            }}
          >
            <Pressable
              onPress={() => {
                if (isHidden) {
                  setDropdownOpen((v) => !v);
                } else {
                  router.push("/(app)/search");
                }
              }}
              style={({ pressed }) => ({
                width: PILL_H,
                height: PILL_H,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
                backgroundColor:
                  isActive("search") && !isHidden ? "#FFF5F0" : "transparent",
              })}
            >
              <HugeiconsIcon
                icon={
                  isHidden
                    ? dropdownOpen
                      ? Cancel01Icon
                      : PlusSignIcon
                    : Search01Icon
                }
                size={22}
                color={isActive("search") && !isHidden ? "#E46D41" : "#8A8278"}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
