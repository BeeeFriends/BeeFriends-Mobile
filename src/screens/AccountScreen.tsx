import { Ionicons } from "@expo/vector-icons";
import { router } from "@/navigation/router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { UserProfileDto } from "@beefriends/shared-kernel/types";
import { API_BASE_URL } from "@/api";
import { SkeletonBlock } from "@/components";
import { getValidAuthSession, goBackOrReplace } from "@/lib";

const TEXT_COLOR = "#171819";

export default function AccountScreen() {
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const session = await getValidAuthSession();

      if (!isMounted) return;

      if (!session) {
        router.replace("/");
        return;
      }

      setProfile(session.user);
      setIsLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = profile?.displayName?.trim() || "BeeFriend";
  const photoUri = getProfilePhotoUri(profile);

  if (isLoading) {
    return <AccountSkeletonScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6F6F6]">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-[#F6F6F6]">
        <View className="h-[88px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6 pt-8">
          <Pressable
            className="mr-4 h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back to settings"
            onPress={() => goBackOrReplace("/settings")}
          >
            <Ionicons name="arrow-back" size={26} color={TEXT_COLOR} />
          </Pressable>
          <Text className="font-jakarta-bold text-[20px] leading-7 text-[#171819]">
            Account
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <SectionHeader title="Profile" />
          <View className="min-h-[104px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6">
            <View className="mr-4 h-16 w-16 overflow-hidden rounded-full bg-[#F1F1F1]">
              {photoUri && !imageFailed ? (
                <Image
                  source={{ uri: photoUri }}
                  className="h-full w-full"
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-[#FFF7B8]">
                  <Text className="font-jakarta-bold text-[24px] text-[#171819]">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text
                className="font-jakarta-bold text-[18px] leading-6 text-[#171819]"
                numberOfLines={2}
              >
                {displayName}
              </Text>
              <Text className="mt-1 font-jakarta-semibold text-[13px] leading-5 text-[#777873]">
                B
                {profile?.binusianYear
                  ? String(profile.binusianYear).slice(-2)
                  : "--"}
              </Text>
            </View>
          </View>

          <SectionHeader title="Account details" />
          <DetailRow
            icon="mail-outline"
            label="Binusian Email"
            value={profile?.binusianEmail || "No email address"}
          />
          <DetailRow
            icon="call-outline"
            label="Phone Number"
            value={profile?.phoneNumber || "No phone number"}
          />
          <DetailRow
            icon="school-outline"
            label="Major"
            value={profile?.major?.name || "Major"}
          />
          <DetailRow
            icon="location-outline"
            label="Campus"
            value={profile?.campus?.name || "Campus"}
          />

          <View className="min-h-12 flex-1 bg-[#F6F6F6]" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function AccountSkeletonScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F6F6F6]">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-[#F6F6F6]">
        <View className="h-[88px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6 pt-8">
          <Pressable
            className="mr-4 h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back to settings"
            onPress={() => goBackOrReplace("/settings")}
          >
            <Ionicons name="arrow-back" size={26} color={TEXT_COLOR} />
          </Pressable>
          <Text className="font-jakarta-bold text-[20px] leading-7 text-[#171819]">
            Account
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <SectionHeader title="Profile" />
          <View className="min-h-[104px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6">
            <SkeletonBlock className="mr-4 h-16 w-16 rounded-full" />
            <View className="flex-1">
              <SkeletonBlock className="h-6 w-[58%] rounded-lg" />
              <SkeletonBlock className="mt-2 h-4 w-[88px] rounded-md" />
            </View>
          </View>

          <SectionHeader title="Account details" />
          {Array.from({ length: 4 }).map((_, index) => (
            <AccountDetailSkeletonRow key={index} />
          ))}

          <View className="min-h-12 flex-1 bg-[#F6F6F6]" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function AccountDetailSkeletonRow() {
  return (
    <View className="min-h-[74px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6">
      <SkeletonBlock className="mr-4 h-8 w-8 rounded-full" />
      <View className="flex-1">
        <SkeletonBlock className="h-4 w-[112px] rounded-md" />
        <SkeletonBlock className="mt-2 h-5 w-[68%] rounded-md" />
      </View>
    </View>
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

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="min-h-[74px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6">
      <View className="mr-4 w-8">
        <Ionicons name={icon} size={22} color={TEXT_COLOR} />
      </View>
      <View className="flex-1">
        <Text className="font-jakarta-semibold text-[13px] leading-5 text-[#777873]">
          {label}
        </Text>
        <Text
          className="font-jakarta-bold text-[15px] leading-6 text-[#171819]"
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function getProfilePhotoUri(profile: UserProfileDto | null) {
  const photoUri =
    profile?.profilePhotoUrl ||
    profile?.photos?.find((photo) => photo.isProfile)?.url ||
    profile?.photos?.[0]?.url ||
    "";

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
