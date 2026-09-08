import { createBrowserRouter } from "react-router-dom";
import { ActivityScreen } from "../screens/activity/ActivityScreen";
import { CreateScreen } from "../screens/create/CreateScreen";
import { FeedScreen } from "../screens/feed/FeedScreen";
import { ProfileSetupScreen } from "../screens/onboarding/ProfileSetupScreen";
import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { FollowListScreen } from "../screens/profile/FollowListScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { UserProfileScreen } from "../screens/profile/UserProfileScreen";
import { SearchScreen } from "../screens/search/SearchScreen";
import { MessengerScreen } from "../screens/messenger/MessengerScreen";
import { ReelsScreen } from "../screens/reels/ReelsScreen";
import { AppShell } from "./AppShell";
import { RequireAuth } from "./guards/RequireAuth";

export const router = createBrowserRouter([
  // Splash — только восстановление сессии, редирект на /feed
  { path: "/", element: <SplashScreen /> },

  // Открытые маршруты — видны всем, auth-действия открывают AuthSheet
  {
    element: <AppShell />,
    children: [
      { path: "/feed",     element: <FeedScreen /> },
      { path: "/search",   element: <SearchScreen /> },
      { path: "/reels",    element: <ReelsScreen /> },
      { path: "/activity", element: <ActivityScreen /> },
      { path: "/messenger", element: <MessengerScreen /> },
    ],
  },

  // Только после входа
  {
    element: <RequireAuth />,
    children: [
      { path: "/onboarding/profile", element: <ProfileSetupScreen /> },
      {
        element: <AppShell />,
        children: [
          { path: "/create",  element: <CreateScreen /> },
          { path: "/profile", element: <ProfileScreen /> },
          {
            path: "/profile/followers",
            element: <FollowListScreen mode="followers" />,
          },
          {
            path: "/profile/following",
            element: <FollowListScreen mode="following" />,
          },
          { path: "/profile/:userId", element: <UserProfileScreen /> },
          {
            path: "/profile/:userId/followers",
            element: <FollowListScreen mode="followers" />,
          },
          {
            path: "/profile/:userId/following",
            element: <FollowListScreen mode="following" />,
          },
        ],
      },
    ],
  },
]);
