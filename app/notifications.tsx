import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NotificationItemDto } from "@beefriends/shared-kernel/dto/notification";
import { SkeletonBlock } from "../components/SkeletonBlock";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/api/notifications";
import { getValidAuthSession } from "../lib/auth/session";

export default function NotificationsScreen() {
  const [userId, setUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      const session = await getValidAuthSession();
      if (!session) {
        router.replace("/");
        return;
      }

      setUserId(session.user.id);

      try {
        const nextNotifications = await getNotifications(session.user.id);
        if (isMounted) setNotifications(nextNotifications);
      } catch {
        if (isMounted) setNotifications([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const openNotification = async (notification: NotificationItemDto) => {
    if (userId && !notification.isRead) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      await markNotificationRead(notification.id, userId).catch(() => undefined);
    }

    if (notification.type === "CHAT" && notification.data?.conversationId) {
      router.push({
        pathname: "/chat-room",
        params: { conversationId: notification.data.conversationId },
      });
      return;
    }

    if (notification.type === "MATCH") {
      router.push("/matches");
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
    await markAllNotificationsRead(userId).catch(() => undefined);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 px-6 pt-4">
        <View className="flex-row items-center">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F6]"
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#171819" />
          </Pressable>
          <Text className="ml-3 flex-1 font-jakarta-bold text-[22px] leading-7 text-[#171819]">
            Notifications
          </Text>
          {!!notifications.length && (
            <Pressable
              className="px-2 py-2"
              accessibilityRole="button"
              onPress={markAllRead}
            >
              <Text className="font-jakarta-bold text-[12px] leading-4 text-[#171819]">
                Read all
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View className="mt-7 gap-3">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </View>
        ) : notifications.length ? (
          <ScrollView
            className="mt-5 flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onPress={() => openNotification(notification)}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center px-6 pb-16">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF7BE]">
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#171819"
              />
            </View>
            <Text className="mt-4 text-center font-jakarta-bold text-[20px] leading-7 text-[#171819]">
              No notifications yet
            </Text>
            <Text className="mt-2 text-center font-jakarta-regular text-[13px] leading-5 text-[#8A8C8E]">
              Match and chat updates will show up here.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: NotificationItemDto;
  onPress: () => void;
}) {
  const iconName =
    notification.type === "MATCH" ? "heart-outline" : "chatbubble-outline";

  return (
    <Pressable
      className="mb-3 flex-row rounded-[18px] border border-[#EFEFEF] bg-white p-4"
      accessibilityRole="button"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFF7BE]">
        <Ionicons name={iconName} size={21} color="#171819" />
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-start">
          <Text className="flex-1 font-jakarta-bold text-[14px] leading-5 text-[#171819]">
            {notification.title}
          </Text>
          {!notification.isRead && (
            <View className="ml-2 mt-[6px] h-2 w-2 rounded-full bg-[#FFF06A]" />
          )}
        </View>
        <Text className="mt-1 font-jakarta-regular text-[12px] leading-5 text-[#6F7173]">
          {notification.body}
        </Text>
      </View>
    </Pressable>
  );
}

function NotificationSkeleton() {
  return (
    <View className="flex-row rounded-[18px] border border-[#EFEFEF] p-4">
      <SkeletonBlock className="h-11 w-11 rounded-full" />
      <View className="ml-3 flex-1">
        <SkeletonBlock className="h-4 w-36 rounded-full" />
        <SkeletonBlock className="mt-3 h-3 w-full rounded-full" />
      </View>
    </View>
  );
}
