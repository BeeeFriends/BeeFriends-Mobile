import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "@/navigation/router";

type MainTabRoute = "home" | "matches" | "chat" | "profile";

export function goBackOrReplace(fallback: string = "/home") {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback as never);
}

export function useMainTabBackBehavior(activeRoute: MainTabRoute) {
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (activeRoute === "home") {
            BackHandler.exitApp();
          } else {
            router.replace("/home");
          }

          return true;
        },
      );

      return () => subscription.remove();
    }, [activeRoute]),
  );
}
