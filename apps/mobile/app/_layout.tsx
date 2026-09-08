import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { HachiMaruPop_400Regular } from "@expo-google-fonts/hachi-maru-pop";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from "@expo-google-fonts/dm-sans";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthSheetProvider } from "../lib/auth-sheet";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (
          error?.message?.includes("Authentication required") ||
          error?.status === 401
        )
          return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  console.log("🚀 RootLayout: start");
  const [fontsLoaded, fontError] = useFonts({
    HachiMaruPop: HachiMaruPop_400Regular,
    "DMSans-Regular": DMSans_400Regular,
    "DMSans-Medium": DMSans_500Medium,
    "DMSans-SemiBold": DMSans_600SemiBold,
    "SpaceGrotesk-Medium": SpaceGrotesk_500Medium,
    "SpaceGrotesk-SemiBold": SpaceGrotesk_600SemiBold,
    "SpaceGrotesk-Bold": SpaceGrotesk_700Bold,
  });
  console.log("📦 fonts:", fontsLoaded, fontError);

  if (!fontsLoaded && !fontError) return null;
  console.log("✅ rendering tree");
  
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthSheetProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthSheetProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
