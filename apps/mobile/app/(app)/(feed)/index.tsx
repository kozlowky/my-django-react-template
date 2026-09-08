import {
  Cancel01Icon,
  ImageAdd01Icon,
  LogInIcon,
  PlusSignIcon,
  UserCircleIcon,
  VideoIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CommentsSheet } from "../../../components/feed/CommentsSheet";
import { PostCard } from "../../../components/feed/PostCard";
import { StoriesRow } from "../../../components/feed/StoriesRow";
import { useTabBar } from "../../../contexts/TabBarContext";
import { fetchFeed, fetchGuestFeed, fetchMe } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth";
import { useAuthSheet } from "../../../lib/auth-sheet";
import { mediaUrl } from "../../../lib/storage";
import { mockPosts } from "../../../mocks/posts";
import { stories } from "../../../mocks/stories";

const CREATE_OPTIONS = [
  { type: "post", label: "Пост", icon: ImageAdd01Icon },
  { type: "reel", label: "Видео Reels", icon: VideoIcon },
] as const;

export default function FeedScreen() {
  const showAuthSheet = useAuthSheet();
  const insets = useSafeAreaInsets();
  const isAuth = Boolean(getAccessToken());
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuth,
  });

  const avatarUri = mediaUrl(me?.avatarUrl);
  const avatarLetter = (me?.displayName || me?.email || "?")[0].toUpperCase();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  type WsLikeMap = Record<string, { likes_count: number; is_liked: boolean }>;
  const [refreshing, setRefreshing] = useState(false);

  const handleOpenComments = useCallback(
    (id: string) => setCommentsPostId(id),
    [],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: isAuth ? ["feed"] : ["guest-feed"],
      queryFn: ({ pageParam }) =>
        isAuth
          ? fetchFeed(pageParam as string | undefined)
          : fetchGuestFeed(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const realPosts = data?.pages.flatMap((p) => p.items) ?? [];
  const posts = realPosts.length === 0 ? mockPosts : realPosts;

  const { hide, show, headerTranslateY } = useTabBar();
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;

    if (diff > 5 && y > 40 && !isHidden.current) {
      isHidden.current = true;
      hide();
    } else if (diff < -5 && isHidden.current) {
      isHidden.current = false;
      show();
    }
    lastScrollY.current = y;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0EB" }}>
      {dropdownOpen && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9,
          }}
          onPress={() => setDropdownOpen(false)}
        />
      )}
      {/* Шапка — фиксированная, выше FlatList по zIndex */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          elevation: 10,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        {isAuth ? (
          /* Авторизованная шапка */
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
                paddingVertical: 10,
              }}
            >
              {/* Логотип */}
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "HachiMaruPop",
                  color: "#1A1A1A",
                }}
              >
                selte
              </Text>

              {/* Правая часть: + и аватар */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                {/* Кнопка + */}
                <Pressable
                  onPress={() => setDropdownOpen((v) => !v)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#E46D41",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HugeiconsIcon
                    icon={dropdownOpen ? Cancel01Icon : PlusSignIcon}
                    size={22}
                    color="#1A1A1A"
                  />
                </Pressable>
                {/* Аватар */}
                <Pressable
                  onPress={() => router.push("/(app)/profile")}
                  hitSlop={8}
                >
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={28}
                    color="#1A1A1A"
                  />
                </Pressable>
              </View>
            </View>

            {/* Dropdown */}
            {dropdownOpen && (
              <View
                style={{
                  position: "absolute",
                  top: insets.top + 54,
                  right: 52, // выровнен под кнопку +
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  paddingVertical: 6,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.1,
                  shadowRadius: 14,
                  elevation: 12,
                  minWidth: 160,
                }}
              >
                {CREATE_OPTIONS.map((opt, i) => (
                  <Pressable
                    key={opt.type}
                    onPress={() => {
                      setDropdownOpen(false);
                      router.push(`/(app)/create?type=${opt.type}` as any);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      borderBottomWidth: i < CREATE_OPTIONS.length - 1 ? 1 : 0,
                      borderBottomColor: "#F0EBE5",
                    }}
                  >
                    <HugeiconsIcon icon={opt.icon} size={18} color="#1A1A1A" />
                    <Text style={{ fontSize: 15, color: "#1A1A1A" }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Гостевой баннер */
          <View
            style={{
              paddingTop: insets.top,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "rgba(245,240,235,0.96)",
              borderBottomWidth: 1,
              borderBottomColor: "#E8DDD4",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: "HachiMaruPop",
                color: "#1A1A1A",
              }}
            >
              selte
            </Text>
            <Pressable
              onPress={showAuthSheet}
              style={{
                backgroundColor: "#E46D41",
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 100,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>
                Войти
              </Text>
              <HugeiconsIcon
                icon={LogInIcon}
                size={16}
                color="#fff"
                strokeWidth={2}
              />
            </Pressable>
          </View>
        )}
      </Animated.View>

      <FlatList
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={posts}
        keyExtractor={(p) => p.id}
        removeClippedSubviews={false}
        windowSize={5}
        ListHeaderComponent={
          <StoriesRow
            stories={isAuth ? stories : []}
            me={isAuth ? (me ?? null) : null}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await queryClient.invalidateQueries({
                queryKey: isAuth ? ["feed"] : ["guest-feed"],
              });
              setRefreshing(false);
            }}
            tintColor="#E46D41"
            colors={["#E46D41"]}
          />
        }
        renderItem={({ item: post }) => (
          <PostCard
            post={post}
            onRequireAuth={showAuthSheet}
            onOpenComments={handleOpenComments}
          />
        )}
        onScrollBeginDrag={() => dropdownOpen && setDropdownOpen(false)}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          status === "pending" ? null : status === "error" ? (
            <Text
              style={{
                textAlign: "center",
                color: "#8A8278",
                padding: 60,
                fontSize: 14,
              }}
            >
              Не удалось загрузить ленту
            </Text>
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: "#8A8278",
                padding: 60,
                fontSize: 14,
              }}
            >
              Здесь пока тихо
            </Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <Text
              style={{ textAlign: "center", color: "#8A8278", padding: 16 }}
            >
              Загрузка...
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 70 }}
      />

      <CommentsSheet
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onRequireAuth={showAuthSheet}
      />
    </View>
  );
}
