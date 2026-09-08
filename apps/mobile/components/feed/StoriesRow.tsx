import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import type { Story } from "../../mocks/stories";
import { StoryViewer } from "./StoryViewer";
import { mediaUrl } from "../../lib/storage";

interface MeUser {
  displayName: string;
  avatarUrl?: string | null;
}

interface Props {
  stories: Story[];
  me?: MeUser | null;
}

export function StoriesRow({ stories, me }: Props) {
  const [active, setActive] = useState<Story | null>(null);
  if (!me && stories.length === 0) return null;

  return (
    <>
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 16,
        }}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          me ? (
            <Pressable
              onPress={() => {
                /* router.push create story */
              }}
              style={{ alignItems: "center", gap: 6, marginRight: 0 }}
            >
              <View style={{ position: "relative" }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.05)",
                    backgroundColor: "#EDE8E2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {me.avatarUrl ? (
                    <Image
                      source={{ uri: mediaUrl(me.avatarUrl) ?? "" }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "700",
                        color: "#8A8278",
                      }}
                    >
                      {me.displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                {/* + badge */}
                <View
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "#E46D41",
                    borderWidth: 2,
                    borderColor: "#F5F0EB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      lineHeight: 16,
                      fontWeight: "700",
                    }}
                  >
                    +
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "500",
                  color: "#8A8278",
                  maxWidth: 64,
                }}
                numberOfLines={1}
              >
                Моя история
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item: s }) => (
          <Pressable
            onPress={() => setActive(s)}
            style={{ alignItems: "center", gap: 6 }}
          >
            <View style={{ position: "relative" }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.05)",
                }}
              >
                <Image
                  source={{ uri: s.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              {!s.viewed && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: "#E46D41",
                    borderWidth: 2,
                    borderColor: "#F5F0EB",
                  }}
                />
              )}
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "500",
                color: "#8A8278",
                maxWidth: 64,
              }}
              numberOfLines={1}
            >
              {s.username}
            </Text>
          </Pressable>
        )}
      />
      {active && <StoryViewer story={active} onClose={() => setActive(null)} />}
    </>
  );
}
