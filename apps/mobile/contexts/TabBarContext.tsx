import { createContext, useContext, useRef, useState } from "react";
import { Animated } from "react-native";

interface TabBarContextValue {
  translateY: Animated.Value;
  headerTranslateY: Animated.Value;
  isHidden: boolean;
  hide: () => void;
  show: () => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const [isHidden, setIsHidden] = useState(false);

  const hide = () => {
    setIsHidden(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const show = () => {
    setIsHidden(false);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TabBarContext.Provider
      value={{ translateY, headerTranslateY, isHidden, hide, show }}
    >
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  const ctx = useContext(TabBarContext);
  if (!ctx) throw new Error("useTabBar must be inside TabBarProvider");
  return ctx;
}
