import { Redirect } from "expo-router";

// Entry point → always go through SplashScreen which decides auth vs guest
export default function Index() {
  return <Redirect href="/(auth)" />;
}
