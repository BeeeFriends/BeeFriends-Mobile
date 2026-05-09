import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, View } from "react-native";
import "react-native-reanimated";
import { API_BASE_URL } from "../lib/api/client";
import { getAuthSession } from "../lib/auth/session";
import { getUserProfileById } from "../lib/api/users";
import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "Jakarta-Regular": PlusJakartaSans_400Regular,
    "Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Jakarta-Bold": PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }

  if (error) throw error;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AppForegroundPushSync />
      <AppNotificationRouter />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="home"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="matches"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="chat"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="chat-room" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
        <Stack.Screen
          name="notification-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="profile-detail" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

function AppForegroundPushSync() {
  useEffect(() => {
    let isDisposed = false;

    async function syncState(appState: string) {
      const session = await getAuthSession();
      const userId = session?.user?.id;

      if (!userId || isDisposed) return;

      const shouldReceivePush = appState !== "active";

      import("../lib/notifications/push")
        .then(({ syncPushDeliveryState }) =>
          syncPushDeliveryState(userId, shouldReceivePush),
        )
        .catch(() => undefined);
    }

    syncState(AppState.currentState);
    const subscription = AppState.addEventListener("change", syncState);

    return () => {
      isDisposed = true;
      subscription.remove();
    };
  }, []);

  return null;
}

function AppNotificationRouter() {
  useEffect(() => {
    let isDisposed = false;

    async function openNotification(
      response: Notifications.NotificationResponse | null,
    ) {
      if (!response || isDisposed) return;

      const data = response.notification.request.content.data as {
        type?: unknown;
        conversationId?: unknown;
        senderId?: unknown;
        notificationId?: unknown;
      };

      if (data.type !== "CHAT" || typeof data.conversationId !== "string") {
        return;
      }

      const session = await getAuthSession();
      if (!session?.access_token || isDisposed) {
        router.push({
          pathname: "/chat-room" as never,
          params: { conversationId: data.conversationId },
        });
        return;
      }

      const senderId = Number(data.senderId);
      const senderProfile =
        Number.isInteger(senderId) && senderId > 0
          ? await getUserProfileById(session.access_token, senderId).catch(
              () => null,
            )
          : null;

      if (isDisposed) return;

      router.push({
        pathname: "/chat-room" as never,
        params: {
          conversationId: data.conversationId,
          participantId:
            Number.isInteger(senderId) && senderId > 0 ? String(senderId) : "",
          name: senderProfile?.displayName?.trim() || "Chat",
          photoUrl: getProfilePhotoUri(senderProfile),
          profile: senderProfile ? JSON.stringify(senderProfile) : "",
        },
      });
    }

    void Notifications.getLastNotificationResponseAsync().then((response) =>
      openNotification(response),
    );
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void openNotification(response);
      },
    );

    return () => {
      isDisposed = true;
      subscription.remove();
    };
  }, []);

  return null;
}

function getProfilePhotoUri(profile?: {
  profilePhotoUrl?: string | null;
  photos?: Array<{ url: string; isProfile: boolean }>;
} | null) {
  const photoUri =
    profile?.profilePhotoUrl ||
    profile?.photos?.find((photo) => photo.isProfile)?.url ||
    profile?.photos?.[0]?.url ||
    "";

  if (!photoUri) return "";

  if (
    photoUri.startsWith("http://") ||
    photoUri.startsWith("https://") ||
    photoUri.startsWith("file://") ||
    photoUri.startsWith("content://") ||
    photoUri.startsWith("data:")
  ) {
    return photoUri;
  }

  if (photoUri.startsWith("/")) {
    return `${API_BASE_URL}${photoUri}`;
  }

  return photoUri;
}
