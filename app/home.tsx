import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AuthResponseDto } from "@beefriends/shared-kernel/types";
import { clearAuthSession, getAuthSession } from "../lib/auth/session";

export default function HomeScreen() {
  const [session, setSession] = useState<AuthResponseDto | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const savedSession = await getAuthSession();

      if (!isMounted) return;

      if (!savedSession) {
        router.replace("/");
        return;
      }

      setSession(savedSession);
      setIsCheckingSession(false);
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await clearAuthSession();
    router.replace("/");
  };

  if (isCheckingSession) {
    return <SafeAreaView className="flex-1 bg-white" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 px-5 pb-8 pt-7">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
              BeeFriends
            </Text>
            <Text className="mt-1 font-jakarta text-[12px] text-[#777873]">
              Welcome back, {session?.user.displayName || "friend"}.
            </Text>
          </View>

          <Pressable
            className="h-10 w-10 items-center justify-center rounded-xl border border-[#211C1D]"
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#171819" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#FFDD2D]">
            <Ionicons name="heart" size={30} color="#171819" />
          </View>
          <Text className="mt-5 text-center font-jakarta-bold text-[22px] leading-7 text-[#171819]">
            Home dummy dulu
          </Text>
          <Text className="mt-2 max-w-[280px] text-center font-jakarta text-[12px] leading-5 text-[#777873]">
            Session sudah kesimpan, jadi next open langsung masuk sini.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
