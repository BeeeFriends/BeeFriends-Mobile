import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [didTimeout, setDidTimeout] = useState(false);
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "Jakarta-Regular": PlusJakartaSans_400Regular,
    "Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Jakarta-Bold": PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDidTimeout(true);
      SplashScreen.hideAsync().catch(() => undefined);
    }, 2500);

    if (loaded || error) {
      clearTimeout(timeout);
      SplashScreen.hideAsync().catch(() => undefined);
    }

    return () => clearTimeout(timeout);
  }, [error, loaded]);

  if (!loaded && !error && !didTimeout) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={DefaultTheme}>
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
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
