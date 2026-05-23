import "./global.css";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { API_BASE_URL, getUserProfileById } from "./src/api";
import { getAuthSession } from "./src/lib";
import { MainNavigator, navigationRef, router } from "./src/navigation";
import { flushPendingNavigation } from "./src/navigation/router";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

export default function App() {
  const [loaded, error] = useFonts({
    SpaceMono: require("./src/assets/fonts/SpaceMono-Regular.ttf"),
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

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={DefaultTheme}
      onReady={flushPendingNavigation}
    >
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <AppForegroundPushSync />
          <AppNotificationRouter />
          <MainNavigator />
        </KeyboardProvider>
      </QueryClientProvider>
    </NavigationContainer>
  );
}

function AppForegroundPushSync() {
  useEffect(() => {
    let isDisposed = false;

    async function syncState(appState) {
      const session = await getAuthSession();
      const userId = session?.user?.id;

      if (!userId || isDisposed) return;

      const shouldReceivePush = appState !== "active";

      import("./src/lib/notifications/push")
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

    async function openNotification(response) {
      if (!response || isDisposed) return;

      const data = response.notification.request.content.data ?? {};

      if (data.type !== "CHAT" || typeof data.conversationId !== "string") {
        return;
      }

      const session = await getAuthSession();
      if (!session?.access_token || isDisposed) {
        router.push({
          pathname: "/chat-room",
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
        pathname: "/chat-room",
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

function getProfilePhotoUri(profile) {
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
