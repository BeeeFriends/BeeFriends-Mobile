import { Ionicons } from "@expo/vector-icons";
import { router } from "@/navigation/router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearAuthSession, getValidAuthSession, goBackOrReplace } from "@/lib";

const TEXT_COLOR = "#171819";
export default function SettingsScreen() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const savedSession = await getValidAuthSession();
      if (!isMounted) return;

      if (!savedSession) {
        router.replace("/");
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await clearAuthSession();
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F6F6]">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-[#F6F6F6]">
        <View className="h-[88px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6 pt-8">
          <Pressable
            className="mr-4 h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            onPress={() => goBackOrReplace("/home")}
          >
            <Ionicons name="close" size={28} color={TEXT_COLOR} />
          </Pressable>
          <Text className="font-jakarta-bold text-[20px] leading-7 text-[#171819]">
            Settings
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <SectionHeader title="Settings" />
          <SettingRow
            icon="notifications-outline"
            title="Smart Notifications"
            onPress={() => router.push("/notification-settings" as never)}
          />

          <SectionHeader title="Account" />
          <SettingRow
            icon="person-outline"
            title="Account"
            onPress={() => router.push("/account" as never)}
          />
          <SettingRow
            icon="log-out-outline"
            title="Logout"
            tone="danger"
            onPress={() => setShowLogoutModal(true)}
          />

          <View className="min-h-12 flex-1 bg-[#F6F6F6]" />
        </ScrollView>
      </View>

      <LogoutModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="h-[38px] justify-center bg-[#F6F6F6] px-6">
      <Text className="font-jakarta-bold text-[15px] leading-5 text-[#9A9A9A]">
        {title}
      </Text>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  tone = "default",
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone?: "default" | "danger";
  onPress: () => void;
}) {
  const color = tone === "danger" ? "#EF4444" : TEXT_COLOR;

  return (
    <Pressable
      className="min-h-[64px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6"
      accessibilityRole="button"
      onPress={onPress}
    >
      <View className="mr-4 w-8">
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text
        className="flex-1 font-jakarta-bold text-[16px] leading-6"
        style={{ color }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function LogoutModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={onCancel} />
        <View className="rounded-t-[26px] bg-white px-6 pb-9 pt-7">
          <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-[#FFF7BE]">
            <Ionicons name="log-out-outline" size={24} color={TEXT_COLOR} />
          </View>
          <Text className="mt-5 font-jakarta-bold text-[22px] leading-7 text-[#171819]">
            Logout from BeeFriends?
          </Text>
          <Text className="mt-3 font-jakarta-regular text-[14px] leading-6 text-[#6F7173]">
            You can sign back in anytime with your account.
          </Text>
          <Pressable
            className="mt-7 h-[52px] items-center justify-center rounded-full bg-[#171819]"
            accessibilityRole="button"
            onPress={onConfirm}
          >
            <Text className="font-jakarta-bold text-[14px] leading-5 text-white">
              Logout
            </Text>
          </Pressable>
          <Pressable
            className="mt-3 h-[48px] items-center justify-center"
            accessibilityRole="button"
            onPress={onCancel}
          >
            <Text className="font-jakarta-bold text-[14px] leading-5 text-[#171819]">
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
