import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Story } from "../../mocks/stories";

interface Props {
  story: Story;
  onClose: () => void;
}

export function StoryViewer({ story, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
    return () => progress.stopAnimation();
  }, []);

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: "#000" }} onPress={onClose}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
          <View
            style={{
              height: 2,
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: 1,
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: "#fff",
                borderRadius: 1,
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              }}
            />
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: story.avatarUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
            {story.username}
          </Text>
          <Pressable
            onPress={onClose}
            style={{ marginLeft: "auto", padding: 8 }}
          >
            <Text style={{ color: "#fff", fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>
        <Image
          source={{ uri: story.imageUrl }}
          style={{ flex: 1, width: "100%" }}
          contentFit="cover"
        />
      </Pressable>
    </Modal>
  );
}
