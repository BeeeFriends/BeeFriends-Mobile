import type { AppRouteName, RootStackParamList } from "./types";

export type PathRoute = {
  name: AppRouteName;
  params?: RootStackParamList[AppRouteName];
};

const PATH_TO_ROUTE: Record<string, AppRouteName> = {
  "/": "Onboarding",
  "/account": "Account",
  "/chat": "Chat",
  "/chat-room": "ChatRoom",
  "/edit-profile": "EditProfile",
  "/home": "Home",
  "/login": "Login",
  "/matches": "Matches",
  "/notification-settings": "NotificationSettings",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/profile-detail": "ProfileDetail",
  "/register": "Register",
  "/settings": "Settings",
};

export function resolvePathRoute(pathname: string): PathRoute {
  return {
    name: PATH_TO_ROUTE[pathname] ?? "Onboarding",
  };
}
