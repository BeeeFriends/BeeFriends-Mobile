import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkeletonBlock } from "@/components/feedback";

export function EditProfileSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-[#F6F6F6]">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white">
        <View className="h-[88px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6 pt-8">
          <SkeletonBlock className="mr-4 h-10 w-10 rounded-md" />
          <SkeletonBlock className="h-6 w-28 rounded-md" />
          <View className="flex-1" />
          <SkeletonBlock className="h-10 w-[74px] rounded-full" />
        </View>
        <View className="flex-1 px-5 pt-5">
          <SkeletonBlock className="aspect-[4/5] w-full rounded-[22px]" />
          <View className="mt-5 flex-row gap-3">
            <SkeletonBlock className="aspect-square flex-1 rounded-2xl" />
            <SkeletonBlock className="aspect-square flex-1 rounded-2xl" />
            <SkeletonBlock className="aspect-square flex-1 rounded-2xl" />
          </View>
          <SkeletonBlock className="mt-6 h-12 w-full rounded-2xl" />
          <SkeletonBlock className="mt-4 h-12 w-full rounded-2xl" />
          <SkeletonBlock className="mt-4 h-[112px] w-full rounded-2xl" />
        </View>
      </View>
    </SafeAreaView>
  );
}
