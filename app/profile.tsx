import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { UserProfileDto } from "@beefriends/shared-kernel/types";
import { CardIcon, ChatIcon, HandIcon, PersonIcon } from "../components/icons";
import { API_BASE_URL } from "../lib/api/client";
import { getValidAuthSession } from "../lib/auth/session";
import { getCurrentUserProfile } from "../lib/api/users";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const session = await getValidAuthSession();

      if (!session) {
        router.replace("/");
        return;
      }

      if (!isMounted) return;

      setProfile(session.user);
      setIsLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <SafeAreaView className="flex-1 bg-white" />;
  }

  const photoUri = getProfilePhotoUri(profile);
  const gender = getProfileGender(profile);
  const age = getProfileAge(profile);
  const galleryPhotos =
    profile?.photos?.filter((photo) => !photo.isProfile).slice(0, 3) ?? [];
  const hobbies = profile?.hobbies ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white">
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="h-[292px] w-full bg-[#F1F1F1]">
            {photoUri && !imageFailed ? (
              <Image
                source={{ uri: photoUri }}
                className="h-full w-full"
                resizeMode="cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <PersonIcon color="#777873" size={64} />
              </View>
            )}
          </View>

          <View className="px-5 pt-4">
            <View className="self-start rounded-full bg-[#7AE4F0] px-2 py-1">
              <Text className="font-jakarta-bold text-[9px] text-[#171819]">
                Searching for Casual Friend
              </Text>
            </View>

            <View className="mt-4 flex-row items-center gap-2">
              <Text className="font-jakarta-bold text-[24px] leading-8 text-[#171819]">
                {profile?.displayName || "BeeFriend"}
              </Text>
              <View className="flex-row items-center rounded-full bg-[#DBEEFF] px-2 py-1">
                <Ionicons
                  name={gender === "Female" ? "female" : "male"}
                  size={13}
                  color="#2F80ED"
                />
                <Text className="ml-1 font-jakarta-bold text-[12px] text-[#2F80ED]">
                  {age || "--"}
                </Text>
              </View>
            </View>

            <Text className="mt-1 font-jakarta text-[13px] leading-5 text-[#777873]">
              B{profile?.binusianYear ? String(profile.binusianYear).slice(-2) : "--"} •{" "}
              {profile?.major?.name || "Major"}
            </Text>
            <Text className="font-jakarta text-[13px] leading-5 text-[#777873]">
              {profile?.campus?.name || "Campus"}
            </Text>

            <Pressable
              className="mt-4 h-9 w-[132px] flex-row items-center justify-center rounded-full bg-black"
              accessibilityRole="button"
            >
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
              <Text className="ml-2 font-jakarta-bold text-[13px] text-white">
                Edit profile
              </Text>
            </Pressable>

            <View className="mt-5 h-px bg-[#E5E5E5]" />

            <Text className="mt-4 font-jakarta-bold text-[18px] text-[#171819]">
              Photos
            </Text>

            <View className="mt-3 flex-row gap-3">
              {galleryPhotos.map((photo) => (
                <PhotoTile key={photo.id} uri={normalizePhotoUri(photo.url)} />
              ))}
              {Array.from({
                length: Math.max(0, 3 - galleryPhotos.length),
              }).map((_, index) => (
                <PhotoTile key={`empty-${index}`} />
              ))}
            </View>

            <Text className="mt-4 font-jakarta-bold text-[18px] text-[#171819]">
              Bio
            </Text>
            <Text className="mt-2 font-jakarta text-[13px] leading-5 text-[#777873]">
              {profile?.description ||
                "Hey! Searching for online friends to chat with."}
            </Text>

            {hobbies.length > 0 && (
              <View className="mt-4 flex-row flex-wrap gap-2">
                {hobbies.map((hobby) => (
                  <View
                    key={hobby.id}
                    className="rounded-full border border-[#D7D7D7] px-3 py-1"
                  >
                    <Text className="font-jakarta-semibold text-[11px] text-[#171819]">
                      {hobby.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View className="h-[62px] flex-row items-center justify-around border-t border-[#F1F1F1] bg-white">
          <TabItem icon="card" label="Explore" onPress={() => router.push("/home")} />
          <TabItem
            icon="hand"
            label="Matches"
            onPress={() => router.push("/matches")}
          />
          <TabItem
            icon="chat"
            label="Chat"
            onPress={() => router.push("/chat")}
          />
          <TabItem icon="person" label="Profile" active />
        </View>
      </View>
    </SafeAreaView>
  );
}

function PhotoTile({ uri }: { uri?: string }) {
  return (
    <View className="h-[58px] w-[58px] overflow-hidden rounded-xl bg-[#F1F1F1]">
      {uri ? (
        <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="add" size={25} color="#777873" />
        </View>
      )}
    </View>
  );
}

function TabItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: "card" | "hand" | "chat" | "person";
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const color = active ? "#252D36" : "#777873";

  return (
    <Pressable
      className="min-w-[58px] items-center"
      accessibilityRole="button"
      onPress={onPress}
    >
      <View className="h-8 items-center justify-center">
        {icon === "card" && (
          <CardIcon
            color={color}
            fillColor={active ? "#FFEA00" : "#FFFFFF"}
            size={28}
          />
        )}
        {icon === "hand" && (
          <HandIcon
            color={color}
            fillColor={active ? "#FFEA00" : undefined}
            size={28}
          />
        )}
        {icon === "chat" && (
          <ChatIcon
            color={color}
            fillColor={active ? "#FFEA00" : "#FFFFFF"}
            size={28}
          />
        )}
        {icon === "person" && (
          <PersonIcon
            color={color}
            fillColor={active ? "#FFEA00" : "#FFFFFF"}
            size={28}
          />
        )}
      </View>
      <Text
        className={`mt-1 text-[12px] ${
          active
            ? "font-jakarta-bold text-[#252D36]"
            : "font-jakarta-semibold text-[#777873]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getProfilePhotoUri(profile: UserProfileDto | null) {
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

function getProfileGender(profile: UserProfileDto | null) {
  return typeof (profile as { gender?: unknown } | null)?.gender === "string"
    ? String((profile as { gender?: string }).gender)
    : "";
}

function getProfileAge(profile: UserProfileDto | null) {
  return typeof (profile as { age?: unknown } | null)?.age === "number"
    ? Number((profile as { age?: number }).age)
    : undefined;
}
