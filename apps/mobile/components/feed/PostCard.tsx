import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  likePost,
  savePost,
  unlikePost,
  unsavePost,
  type Post,
} from "../../lib/api";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { HeartIcon, SendIcon, } from "@hugeicons/core-free-icons";
import { getAccessToken } from "../../lib/auth";
import { mediaUrl } from "../../lib/storage";

interface Props {
  post: Post;
  onRequireAuth?: () => void;
  onOpenComments?: (id: string) => void;
}

function VideoPlayer({ uri, muted }: { uri: string; muted: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", aspectRatio: 9 / 16 }}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

export function PostCard({ post, onRequireAuth, onOpenComments }: Props) {
  const isAuth = Boolean(getAccessToken());
  const qc = useQueryClient();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved);
  const [muted, setMuted] = useState(true);
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const firstMedia = post.mediaItems[0];
  const isVideo = firstMedia?.mediaType === "video";
  const location =
    post.location && post.location !== "null" ? post.location : null;

  const patchCache = useCallback(
    (next: boolean, newCount: number) => {
      for (const key of [["feed"], ["guest-feed"]]) {
        qc.setQueryData(key, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p: any) => ({
              ...p,
              items: p.items.map((i: any) =>
                i.id === post.id
                  ? { ...i, isLiked: next, likesCount: newCount }
                  : i,
              ),
            })),
          };
        });
      }
    },
    [post.id, qc],
  );

  async function handleLike() {
    if (!isAuth) {
      onRequireAuth?.();
      return;
    }
    const next = !liked;
    const newCount = likesCount + (next ? 1 : -1);
    setLiked(next);
    setLikesCount(newCount);
    try {
      if (next) await likePost(post.id);
      else await unlikePost(post.id);
      patchCache(next, newCount);
    } catch {
      setLiked(!next);
      setLikesCount(likesCount);
    }
  }

  async function handleSave() {
    if (!isAuth) {
      onRequireAuth?.();
      return;
    }
    const next = !saved;
    setSaved(next);
    try {
      if (next) await savePost(post.id);
      else await unsavePost(post.id);
    } catch {
      setSaved(!next);
    }
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isAuth) {
        onRequireAuth?.();
        return;
      }
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
        Animated.delay(600),
        Animated.spring(heartScale, { toValue: 0, useNativeDriver: true }),
      ]).start();
      if (!liked) void handleLike();
    }
    lastTap.current = now;
  }

  return (
    <View style={{ backgroundColor: "#fff", marginBottom: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {post.author.avatarUrl ? (
          <Image
            source={{ uri: mediaUrl(post.author.avatarUrl) ?? "" }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#F5F0EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#8A8278" }}>
              {post.author.displayName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#1A1A1A" }}>
            {post.author.displayName}
          </Text>
          {location ? (
            <Text style={{ fontSize: 11, color: "#8A8278" }}>{location}</Text>
          ) : null}
        </View>
        <Text style={{ color: "#8A8278", fontSize: 20, letterSpacing: 1 }}>
          ···
        </Text>
      </View>

      {firstMedia && (
        <Pressable onPress={handleTap} style={{ position: "relative" }}>
          {isVideo ? (
            <>
              <VideoPlayer
                uri={mediaUrl(firstMedia.fileUrl) ?? ""}
                muted={muted}
              />
              <Pressable
                onPress={() => setMuted((v) => !v)}
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name={muted ? "volume-x" : "volume-2"}
                  size={16}
                  color="#fff"
                />
              </Pressable>
            </>
          ) : (
            <Image
              source={{ uri: mediaUrl(firstMedia.fileUrl) ?? "" }}
              style={{ width: "100%", aspectRatio: 1 }}
              contentFit="cover"
            />
          )}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: heartScale }],
              opacity: heartScale,
            }}
          >
            <Text style={{ fontSize: 80 }}>❤️</Text>
          </Animated.View>
        </Pressable>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 16,
        }}
      >
        <Pressable
          onPress={handleLike}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <HugeiconsIcon
            icon={liked ? HeartIcon : HeartIcon}
            size={24}
            color={liked ? "#ef4444" : "#1A1A1A"}
            strokeWidth={2}
          />
          {likesCount > 0 && (
            <Text style={{ fontSize: 12, color: "#8A8278" }}>{likesCount}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => onOpenComments?.(post.id)}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Feather name="message-circle" size={24} color="#1A1A1A" />
          {post.commentsCount > 0 && (
            <Text style={{ fontSize: 12, color: "#8A8278" }}>
              {post.commentsCount}
            </Text>
          )}
        </Pressable>
        <Pressable>
          <HugeiconsIcon
            icon={SendIcon}
            size={24}
            color={"#1A1A1A"}
            strokeWidth={2}
          />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={handleSave}>
          <Feather
            name="bookmark"
            size={24}
            color={saved ? "#E46D41" : "#1A1A1A"}
          />
        </Pressable>
      </View>

      {post.caption ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Text style={{ fontSize: 14, color: "#1A1A1A" }}>
            <Text style={{ fontWeight: "600" }}>{post.author.displayName}</Text>{" "}
            {post.caption}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
