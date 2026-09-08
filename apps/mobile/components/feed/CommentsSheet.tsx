import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addComment, fetchPostComments, type Comment } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";

interface Props {
  postId: string | null;
  onClose: () => void;
  onRequireAuth?: () => void;
}

function CommentItem({
  comment,
  depth = 0,
}: {
  comment: Comment;
  depth?: number;
}) {
  return (
    <View
      style={{ marginLeft: depth > 0 ? 32 : 0, marginTop: depth > 0 ? 8 : 16 }}
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#EDE8E2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "600", color: "#8A8278" }}>
            {comment.author.displayName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: "#1A1A1A" }}>
            <Text style={{ fontWeight: "600" }}>
              {comment.author.displayName}
            </Text>{" "}
            {comment.text}
          </Text>
          <Text style={{ fontSize: 10, color: "#8A8278", marginTop: 2 }}>
            {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>
      </View>
      {comment.replies?.map((r) => (
        <CommentItem key={r.id} comment={r} depth={depth + 1} />
      ))}
    </View>
  );
}

export function CommentsSheet({ postId, onClose, onRequireAuth }: Props) {
  const isAuth = Boolean(getAccessToken());
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const slideY = useRef(new Animated.Value(500)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (postId) {
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      slideY.setValue(500);
    }
  }, [postId]);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchPostComments(postId!),
    enabled: !!postId,
  });

  const mutation = useMutation({
    mutationFn: ({ t }: { t: string }) => addComment(postId!, t),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  function handleSend() {
    if (!isAuth) {
      onRequireAuth?.();
      return;
    }
    const t = text.trim();
    if (!t) return;
    mutation.mutate({ t });
  }

  const comments = data?.items ?? [];

  return (
    <Modal
      visible={!!postId}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={onClose}
        />
        <Animated.View
          style={{
            transform: [{ translateY: slideY }],
            backgroundColor: "#F5F0EB",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#D4C9BE",
                }}
              />
            </View>
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: "600",
                color: "#1A1A1A",
                paddingBottom: 4,
              }}
            >
              Комментарии
            </Text>

            <ScrollView
              style={{ maxHeight: 380, paddingHorizontal: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {isLoading && (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#8A8278",
                    fontSize: 13,
                    paddingVertical: 32,
                  }}
                >
                  Загрузка...
                </Text>
              )}
              {!isLoading && comments.length === 0 && (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#8A8278",
                    fontSize: 13,
                    paddingVertical: 32,
                  }}
                >
                  Пока нет комментариев
                </Text>
              )}
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
              <View style={{ height: 16 }} />
            </ScrollView>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: insets.bottom + 8,
                borderTopWidth: 1,
                borderTopColor: "#E8DDD4",
              }}
            >
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                onSubmitEditing={handleSend}
                placeholder={
                  isAuth
                    ? "Добавить комментарий..."
                    : "Войди, чтобы комментировать"
                }
                placeholderTextColor="#8A8278"
                editable={isAuth}
                onPressIn={() => {
                  if (!isAuth) onRequireAuth?.();
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#EDE8E2",
                  borderRadius: 100,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  fontSize: 14,
                  color: "#1A1A1A",
                }}
              />
              {isAuth && (
                <Pressable
                  onPress={handleSend}
                  disabled={!text.trim() || mutation.isPending}
                >
                  <Text
                    style={{
                      color: "#E46D41",
                      fontWeight: "600",
                      fontSize: 14,
                      opacity: !text.trim() ? 0.4 : 1,
                    }}
                  >
                    {mutation.isPending ? "..." : "Отправить"}
                  </Text>
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
