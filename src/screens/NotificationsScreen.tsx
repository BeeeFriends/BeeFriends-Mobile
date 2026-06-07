import { Ionicons } from "@expo/vector-icons";
import { router } from "@/navigation/router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NotificationItemDto } from "@beefriends/shared-kernel/dto/notification";
import type { UserProfileDto } from "@beefriends/shared-kernel/types";
import {
  API_BASE_URL,
  getNotifications,
  getUserProfileById,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api";
import { SkeletonBlock } from "@/components";
import {
  countUnreadNotifications,
  getValidAuthSession,
  goBackOrReplace,
  isNotificationUnread,
  setUnreadNotificationCount,
} from "@/lib";

const TEXT_COLOR = "#171819";

type EnrichedNotification = NotificationItemDto & {
  senderProfile?: UserProfileDto | null;
};

export default function NotificationsScreen() {
  const [userId, setUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<EnrichedNotification[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(
    async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
      if (showLoading) setIsLoading(true);

      const session = await getValidAuthSession();
      if (!session) {
        router.replace("/");
        return;
      }

      setUserId(session.user.id);

      try {
        const nextNotifications = await getNotifications(session.user.id);
        const chatSenderIds = Array.from(
          new Set(
            nextNotifications
              .filter((notification) => notification.type === "CHAT")
              .map((notification) => Number(notification.data?.senderId ?? NaN))
              .filter((userId) => Number.isInteger(userId) && userId > 0),
          ),
        );
        const senderProfiles = await Promise.all(
          chatSenderIds.map((senderId) =>
            getUserProfileById(session.access_token, senderId).catch(
              () => null,
            ),
          ),
        );
        const senderProfileById = new Map(
          senderProfiles
            .filter((profile): profile is UserProfileDto => Boolean(profile))
            .map((profile) => [profile.id, profile] as const),
        );

        const enrichedNotifications = nextNotifications.map((notification) => {
          const senderId = Number(notification.data?.senderId ?? NaN);

          return {
            ...notification,
            senderProfile:
              notification.type === "CHAT" && Number.isInteger(senderId)
                ? (senderProfileById.get(senderId) ?? null)
                : null,
          };
        });

        setNotifications(enrichedNotifications);
        setUnreadNotificationCount(
          countUnreadNotifications(enrichedNotifications),
        );
      } catch {
        if (showLoading) {
          setNotifications([]);
          setUnreadNotificationCount(0);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadNotifications({ showLoading: true });
  }, [loadNotifications]);

  useEffect(() => {
    const refresh = () => {
      void loadNotifications().catch(() => undefined);
    };

    const intervalId = setInterval(refresh, 5000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [loadNotifications]);

  const openNotification = async (notification: EnrichedNotification) => {
    if (userId && isNotificationUnread(notification)) {
      setNotifications((current) => {
        const nextNotifications = current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        );
        setUnreadNotificationCount(countUnreadNotifications(nextNotifications));
        return nextNotifications;
      });
      await markNotificationRead(notification.id, userId).catch(
        () => undefined,
      );
    }

    if (notification.type === "CHAT" && notification.data?.conversationId) {
      const senderId = Number(notification.data.senderId ?? NaN);
      const senderProfile = notification.senderProfile ?? null;

      router.push({
        pathname: "/chat-room",
        params: {
          conversationId: notification.data.conversationId,
          participantId:
            Number.isInteger(senderId) && senderId > 0 ? String(senderId) : "",
          name:
            senderProfile?.displayName?.trim() || notification.title || "Chat",
          photoUrl: getProfilePhotoUri(senderProfile),
          profile: senderProfile ? JSON.stringify(senderProfile) : "",
        },
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
    setUnreadNotificationCount(0);
    await markAllNotificationsRead(userId).catch(() => undefined);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white">
        <View className="h-[88px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6 pt-8">
          <Pressable
            className="mr-4 h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
            onPress={() => goBackOrReplace("/home")}
          >
            <Ionicons name="close" size={28} color={TEXT_COLOR} />
          </Pressable>
          <Text className="flex-1 font-jakarta-bold text-[20px] leading-7 text-[#171819]">
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

        <View className="flex-1 px-6">
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
      </View>
    </SafeAreaView>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: EnrichedNotification;
  onPress: () => void;
}) {
  const isChat = notification.type === "CHAT";
  const isMatch = notification.type === "MATCH";
  const avatarUri = getNotificationAvatarUri(notification);
  const iconName =
    notification.type === "MATCH" ? "heart-outline" : "chatbubble-outline";

  return (
    <Pressable
      className="mb-3 flex-row rounded-[18px] border border-[#EFEFEF] bg-white p-4"
      accessibilityRole="button"
      onPress={onPress}
    >
      <View className="h-11 w-11 overflow-hidden rounded-full bg-[#FFF7BE]">
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name={iconName} size={21} color="#171819" />
          </View>
        )}
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-start">
          <Text className="flex-1 font-jakarta-bold text-[14px] leading-5 text-[#171819]">
            {isChat && notification.senderProfile?.displayName
              ? notification.senderProfile.displayName
              : isMatch && notification.data?.matchedUserName
                ? notification.data.matchedUserName
                : notification.title}
          </Text>
          {isNotificationUnread(notification) && (
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

function getNotificationAvatarUri(notification: EnrichedNotification) {
  if (notification.type === "CHAT") {
    return normalizePhotoUri(
      getProfilePhotoUri(notification.senderProfile) ||
        notification.data?.senderPhotoUrl ||
        "",
    );
  }

  if (notification.type === "MATCH") {
    return normalizePhotoUri(notification.data?.matchedUserPhotoUrl || "");
  }

  return "";
}

function getProfilePhotoUri(profile?: UserProfileDto | null) {
  return normalizePhotoUri(
    profile?.profilePhotoUrl ||
      profile?.photos?.find((photo) => photo.isProfile)?.url ||
      profile?.photos?.[0]?.url ||
      "",
  );
}

function normalizePhotoUri(photoUri: string) {
  if (!photoUri) return "";

  if (
    photoUri.startsWith("http://") ||
    photoUri.startsWith("https://") ||
    photoUri.startsWith("file://") ||
    photoUri.startsWith("content://") ||
    photoUri.startsWith("data:")
  ) {
    return photoUri;
  }

  if (photoUri.startsWith("/")) {
    return `${API_BASE_URL}${photoUri}`;
  }

  return photoUri;
}
