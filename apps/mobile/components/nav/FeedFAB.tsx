import {
  Cancel01Icon,
  ImageAdd01Icon,
  PlusSignIcon,
  VideoIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBar } from "../../contexts/TabBarContext";
import { fetchMe } from "../../lib/api";

const PILL_H = 58;
const CREAM = "rgba(255,255,255,0.85)";
const BORDER = "rgba(255,255,255,0.6)";
const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 16,
  elevation: 10,
};

const CREATE_OPTIONS = [
  { type: "post", label: "Пост", icon: ImageAdd01Icon },
  { type: "reel", label: "Видео Reels", icon: VideoIcon },
] as const;

export function FeedFAB() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const { translateY } = useTabBar();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  if (!me) return null;

  // FAB появляется когда navbar уходит вниз
  const opacity = translateY.interpolate({
    inputRange: [40, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <>
      {/* Backdrop для закрытия дропдауна */}
      {open && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 19,
          }}
          onPress={() => setOpen(false)}
        />
      )}

      <Animated.View
        style={{
          position: "absolute",
          bottom: insets.bottom + 12, // совпадает с paddingBottom в TabBar
          right: 22, // совпадает с paddingHorizontal в TabBar
          width: PILL_H,
          height: PILL_H,
          opacity,
          zIndex: 20,
        }}
        pointerEvents="box-none"
      >
        {/* Дропдаун — открывается вверх */}
        {open && (
          <View
            style={{
              position: "absolute",
              bottom: PILL_H + 8,
              right: 0,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingVertical: 6,
              minWidth: 160,
              ...shadow,
            }}
          >
            {CREATE_OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.type}
                onPress={() => {
                  setOpen(false);
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

        {/* Кнопка — такой же стиль как поиск в TabBar */}
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => ({
            width: PILL_H,
            height: PILL_H,
            borderRadius: PILL_H / 2,
            backgroundColor: CREAM,
            borderWidth: 1,
            borderColor: BORDER,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
            ...shadow,
          })}
        >
          <HugeiconsIcon
            icon={open ? Cancel01Icon : PlusSignIcon}
            size={22}
            color="#1A1A1A"
            strokeWidth={2}
          />
        </Pressable>
      </Animated.View>
    </>
  );
}
