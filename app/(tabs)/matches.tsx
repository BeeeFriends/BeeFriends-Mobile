import AppLogo from "@/components/icons/AppLogo";
import TextLogo from "@/components/icons/TextLogo";
import { View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      {/* Warna logo akan mengikuti class 'text-primary-yellow' */}
      <AppLogo width={64} height={64} />
      <TextLogo height={120} />
    </View>
  );
}
