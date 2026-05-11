import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  NotificationSettingsDto,
  UpdateNotificationSettingsPayload,
} from "@beefriends/shared-kernel/dto/notification";
import { ToastBanner, useToast } from "../components/ToastBanner";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../lib/api/notifications";
import { getValidAuthSession } from "../lib/auth/session";
import { goBackOrReplace } from "../lib/navigation/back";

const TEXT_COLOR = "#171819";
const fallbackSettings = (userId: number): NotificationSettingsDto => ({
  userId,
  matchEnabled: true,
  chatEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
});
const SERVER_SYNC_TIMEOUT_MS = 8000;

export default function NotificationSettingsScreen() {
  const [userId, setUserId] = useState<number | null>(null);
  const [settings, setSettings] = useState<NotificationSettingsDto | null>(
    null,
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [savingKeys, setSavingKeys] = useState<
    Partial<Record<keyof Omit<NotificationSettingsDto, "userId">, boolean>>
  >({});
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const session = await getValidAuthSession();
      if (!session) {
        router.replace("/");
        return;
      }

      setUserId(session.user.id);
      setIsLoadingSettings(true);

      try {
        const nextSettings = await withTimeout(
          getNotificationSettings(session.user.id),
          SERVER_SYNC_TIMEOUT_MS,
          "Loading notification settings timed out.",
        );
        const normalizedSettings = normalizeNotificationSettings(
          nextSettings,
          session.user.id,
        );
        if (isMounted) {
          setSettings(normalizedSettings);
        }
        if (normalizedSettings.pushEnabled) {
          registerPushToken(session.user.id);
        }
      } catch (error) {
        if (isMounted) {
          setSettings(fallbackSettings(session.user.id));
          showToast({
            title: "Notification service error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load notification settings.",
          });
        }
      } finally {
        if (isMounted) setIsLoadingSettings(false);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveSetting = async (
    key: keyof Omit<NotificationSettingsDto, "userId">,
    value: boolean,
  ) => {
    if (!userId || !settings) return;

    const currentSettings = settings;
    const next = { ...currentSettings, [key]: value };
    setSettings(next);
    setSavingKeys((current) => ({ ...current, [key]: true }));

    try {
      const saved = await withTimeout(
        updateNotificationSettings(userId, {
          [key]: value,
        }),
        SERVER_SYNC_TIMEOUT_MS,
        "Saving notification settings timed out.",
      );
      const normalizedSettings = normalizeNotificationSettings(saved, userId);
      setSettings(normalizedSettings);

      if (key === "pushEnabled" && value) {
        registerPushToken(userId);
      }
      if (key === "pushEnabled" && !value) {
        disablePushToken(userId);
      }
    } catch (error) {
      setSettings(currentSettings);
      showToast({
        title: "Notification service error",
        message:
          error instanceof Error
            ? error.message
            : "Could not save notification settings.",
      });
    } finally {
      setSavingKeys((current) => ({ ...current, [key]: false }));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ToastBanner toast={toast} onDismiss={hideToast} />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white">
        <View className="h-[88px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6 pt-8">
          <Pressable
            className="mr-4 h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close smart notifications"
            onPress={() => goBackOrReplace("/settings")}
          >
            <Ionicons name="close" size={28} color={TEXT_COLOR} />
          </Pressable>
          <Text className="font-jakarta-bold text-[20px] leading-7 text-[#171819]">
            Smart Notifications
          </Text>
        </View>

        <View className="flex-1 px-6">
          <View className="mt-7 overflow-hidden rounded-[18px] border border-[#EFEFEF] bg-white">
            {isLoadingSettings || !settings ? (
              <SettingsLoadingRows />
            ) : (
              <>
                <SettingRow
                  title="New matches"
                  subtitle="When someone likes you back"
                  value={settings.matchEnabled}
                  disabled={Boolean(savingKeys.matchEnabled)}
                  onValueChange={(value) => saveSetting("matchEnabled", value)}
                />
                <Divider />
                <SettingRow
                  title="Device push"
                  subtitle="Show alerts on your phone"
                  value={settings.pushEnabled}
                  disabled={Boolean(savingKeys.pushEnabled)}
                  onValueChange={(value) => saveSetting("pushEnabled", value)}
                />
                <Divider />
                <SettingRow
                  title="In-app inbox"
                  subtitle="Save notifications in BeeFriends"
                  value={settings.inAppEnabled}
                  disabled={Boolean(savingKeys.inAppEnabled)}
                  onValueChange={(value) => saveSetting("inAppEnabled", value)}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function registerPushToken(userId: number) {
  import("../lib/notifications/push")
    .then(({ registerForPushNotifications }) =>
      registerForPushNotifications(userId),
    )
    .catch(() => undefined);
}

function disablePushToken(userId: number) {
  import("../lib/notifications/push")
    .then(({ syncPushDeliveryState }) =>
      syncPushDeliveryState(userId, false).catch(() => undefined),
    )
    .catch(() => undefined);
}

function normalizeNotificationSettings(
  value: Partial<NotificationSettingsDto> | UpdateNotificationSettingsPayload,
  userId: number,
): NotificationSettingsDto {
  return {
    userId,
    matchEnabled: toBoolean(value.matchEnabled, true),
    chatEnabled: toBoolean(value.chatEnabled, true),
    pushEnabled: toBoolean(value.pushEnabled, true),
    inAppEnabled: toBoolean(value.inAppEnabled, true),
  };
}

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  if (typeof value === "number") return value === 1;

  return fallback;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function SettingRow({
  title,
  subtitle,
  value,
  disabled = false,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center px-4 py-4">
      <View className="flex-1 pr-4">
        <Text className="font-jakarta-bold text-[14px] leading-5 text-[#171819]">
          {title}
        </Text>
        <Text className="mt-[2px] font-jakarta-regular text-[12px] leading-4 text-[#8A8C8E]">
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: "#E4E4E4", true: "#FFF06A" }}
        thumbColor={value ? "#171819" : "#FFFFFF"}
      />
    </View>
  );
}

function Divider() {
  return <View className="mx-4 h-px bg-[#EFEFEF]" />;
}

function SettingsLoadingRows() {
  return (
    <View>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index}>
          <View className="flex-row items-center px-4 py-4">
            <View className="flex-1 pr-4">
              <View className="h-4 w-32 rounded-full bg-[#EFEFEF]" />
              <View className="mt-2 h-3 w-48 rounded-full bg-[#F4F4F4]" />
            </View>
            <View className="h-8 w-12 rounded-full bg-[#EFEFEF]" />
          </View>
          {index < 2 ? <Divider /> : null}
        </View>
      ))}
    </View>
  );
}
