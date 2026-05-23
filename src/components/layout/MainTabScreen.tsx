import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { BottomNav } from "@/components/layout/BottomNav";

type MainTabRoute = "home" | "matches" | "chat" | "profile";

type MainTabScreenProps = {
  active: MainTabRoute;
  borderedNav?: boolean;
  children: ReactNode;
  contentClassName?: string;
};

export function MainTabScreen({
  active,
  borderedNav = false,
  children,
  contentClassName = "",
}: MainTabScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto h-full w-full max-w-[430px] flex-1 bg-white">
        <View className={`flex-1 ${contentClassName}`}>{children}</View>
        <BottomNav active={active} bordered={borderedNav} />
      </View>
    </SafeAreaView>
  );
}
