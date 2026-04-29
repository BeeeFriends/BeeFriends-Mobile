import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuthSession } from "../lib/auth/session";

const welcomeImage = require("../assets/images/welcome.png");
const titleImage = require("../assets/images/beefriends_title.png");

export default function OnboardingScreen() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function redirectAuthenticatedUser() {
      const session = await getAuthSession();

      if (!isMounted) return;

      if (session) {
        router.replace("/home");
        return;
      }

      setIsCheckingSession(false);
    }

    redirectAuthenticatedUser();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return <SafeAreaView className="flex-1 bg-white" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 px-5 pb-8 pt-7">
        <View className="items-center">
          <Image
            source={titleImage}
            className="h-10 w-32"
            resizeMode="contain"
            accessible
            accessibilityLabel="BeeFriends"
          />
        </View>

        <View className="flex-1 justify-center">
          <Image
            source={welcomeImage}
            className="mb-9 h-52 w-full"
            resizeMode="contain"
            accessible
            accessibilityLabel="People greeting each other"
          />

          <View className="items-center px-2">
            <Text className="text-center font-jakarta-bold text-[25px] leading-8 text-[#222936]">
              Build Connections,{"\n"}Made Easy.
            </Text>
            <Text className="mt-5 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
              Match with people from your major and beyond.{"\n"}
              Connecting you with fellow Binusians who share{"\n"}
              your vibe and interests.
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Pressable
            className="h-[46px] items-center justify-center rounded-full bg-[#FFDD2D]"
            accessibilityRole="button"
            onPress={() => router.push("/register")}
          >
            <Text className="font-jakarta-bold text-[14px] text-[#171819]">
              Get started
            </Text>
          </Pressable>

          <Pressable
            className="h-[46px] items-center justify-center rounded-full border border-[#171819] bg-white"
            accessibilityRole="button"
            onPress={() => router.push("/login")}
          >
            <Text className="font-jakarta-semibold text-[14px] text-[#222936]">
              I already have an account
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
