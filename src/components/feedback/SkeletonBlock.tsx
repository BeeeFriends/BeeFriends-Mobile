import { View } from "react-native";

export function SkeletonBlock({ className }: { className: string }) {
  return <View className={`bg-[#F1F1F1] ${className}`} />;
}
