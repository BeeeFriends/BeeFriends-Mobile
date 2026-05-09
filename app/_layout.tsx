import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, View } from "react-native";
import "react-native-reanimated";
import { getAuthSession } from "../lib/auth/session";
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
