import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { NotificationIcon } from "./icons";
import { useUnreadNotificationCount } from "../lib/notifications/unreadNotifications";

type NotificationButtonProps = {
  size?: number;
};

export function NotificationButton({ size = 17 }: NotificationButtonProps) {
  const unreadCount = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      className="relative h-9 w-9 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      onPress={() => router.push("/notifications" as never)}
    >
      <NotificationIcon size={size} />
      {hasUnread ? (
        <View
          style={{
            position: "absolute",
            right: 5,
            top: 5,
            width: 9,
            height: 9,
            borderRadius: 999,
            backgroundColor: "#FF3B30",
            borderWidth: 2,
            borderColor: "#FFFFFF",
          }}
        />
      ) : null}
    </Pressable>
  );
}
