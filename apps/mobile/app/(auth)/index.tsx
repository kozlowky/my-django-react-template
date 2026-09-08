import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import {
  fetchFeed,
  fetchGuestFeed,
  fetchMe,
  refreshSession,
} from "../../lib/api";

export default function SplashScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Animated dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(800 - delay),
        ]),
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        const [isAuth] = await Promise.all([refreshSession()]);
        if (isAuth) {
          await Promise.all([
            queryClient.query({ queryKey: ["me"], queryFn: fetchMe }),
            queryClient.infiniteQuery({
              queryKey: ["feed"],
              queryFn: ({ pageParam }) =>
                fetchFeed(pageParam as string | undefined),
              initialPageParam: undefined as string | undefined,
              getNextPageParam: (lastPage: any) => lastPage.nextCursor,
            }),
          ]).catch(() => {});
        } else {
          await queryClient
            .infiniteQuery({
              queryKey: ["guest-feed"],
              queryFn: ({ pageParam }) =>
                fetchGuestFeed(pageParam as string | undefined),
              initialPageParam: undefined as string | undefined,
              getNextPageParam: (lastPage: any) => lastPage.nextCursor,
            })
            .catch(() => {});
        }
      } catch {}
      router.replace("/(app)");
    }
    boot();
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      {/* Логотип */}
      <Text style={styles.logo}>selte</Text>

      {/* Анимированные точки */}
      <View style={styles.dots}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, dotStyle(dot)]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F0EB",
    alignItems: "center",
    justifyContent: "center",
    gap: 48,
  },
  logo: {
    fontSize: 36,
    fontFamily: "HachiMaruPop",
    color: "#1A1A1A",
  },
  dots: {
    flexDirection: "row",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8A8278",
  },
});
