import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NotificationSettingsDto } from "@beefriends/shared-kernel/dto/notification";
import { ToastBanner, useToast } from "../components/ToastBanner";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../lib/api/notifications";
import { getValidAuthSession } from "../lib/auth/session";

const fallbackSettings = (userId: number): NotificationSettingsDto => ({
  userId,
  matchEnabled: true,
  chatEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
});

export default function NotificationSettingsScreen() {
  const [userId, setUserId] = useState<number | null>(null);
  const [settings, setSettings] = useState<NotificationSettingsDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

      try {
        const nextSettings = await getNotificationSettings(session.user.id);
        if (isMounted) setSettings(nextSettings);
        registerPushToken(session.user.id);
      } catch {
        if (isMounted) setSettings(fallbackSettings(session.user.id));
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveSetting = async (
    key: keyof Omit<NotificationSettingsDto, "userId">,
  ) => {
    if (!settings || !userId || isSaving) return;

    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setIsSaving(true);

    try {
      const saved = await updateNotificationSettings(userId, {
        [key]: next[key],
      });
      setSettings(saved);

      if (key === "pushEnabled" && next.pushEnabled) {
        registerPushToken(userId);
      }
    } catch (error) {
      setSettings(settings);
      showToast({
        title: "Notification setting failed",
        message:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ToastBanner toast={toast} onDismiss={hideToast} />
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
          <Text className="ml-3 font-jakarta-bold text-[22px] leading-7 text-[#171819]">
            Notifications
          </Text>
        </View>

        <View className="mt-7 overflow-hidden rounded-[18px] border border-[#EFEFEF] bg-white">
          <SettingRow
            title="New matches"
            subtitle="When someone likes you back"
            value={settings?.matchEnabled ?? true}
            onValueChange={() => saveSetting("matchEnabled")}
          />
          <Divider />
          <SettingRow
            title="Chat messages"
            subtitle="Messages from active matches"
            value={settings?.chatEnabled ?? true}
            onValueChange={() => saveSetting("chatEnabled")}
          />
          <Divider />
          <SettingRow
            title="Device push"
            subtitle="Show alerts on your phone"
            value={settings?.pushEnabled ?? true}
            onValueChange={() => saveSetting("pushEnabled")}
          />
          <Divider />
          <SettingRow
            title="In-app inbox"
            subtitle="Save notifications in BeeFriends"
            value={settings?.inAppEnabled ?? true}
            onValueChange={() => saveSetting("inAppEnabled")}
          />
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

function SettingRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: () => void;
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
