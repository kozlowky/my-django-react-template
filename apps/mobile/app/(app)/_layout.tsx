import { Tabs } from "expo-router";
import { TabBar } from "../../components/nav/TabBar";
import { TabBarProvider } from "../../contexts/TabBarContext";

export default function AppLayout() {
  return (
    <TabBarProvider>
      <Tabs tabBar={() => <TabBar />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="(feed)" />
        <Tabs.Screen name="reels" />
        <Tabs.Screen name="messenger" />
        <Tabs.Screen name="activity" />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="create" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </TabBarProvider>
  );
}
