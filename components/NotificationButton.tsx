import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { NotificationIcon } from "./icons";
import { useUnreadNotificationCount } from "../lib/notifications/unreadNotifications";

type NotificationButtonProps = {
  size?: number;
};

export function NotificationButton({ size = 17 }: NotificationButtonProps) {
  const unreadCount = useUnreadNotificationCount();

  return (
    <Pressable
      className="h-8 w-8 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      onPress={() => router.push("/notifications" as never)}
    >
      <NotificationIcon size={size} />
      {unreadCount > 0 ? (
        <View className="absolute right-0 top-0 min-w-[16px] items-center justify-center rounded-full bg-[#FF3B30] px-[4px] py-[1px]">
          <Text className="font-jakarta-bold text-[9px] leading-3 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
