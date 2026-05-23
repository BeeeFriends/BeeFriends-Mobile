import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "@/navigation/router";
import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { UserProfileDto } from "@beefriends/shared-kernel/types";
import { API_BASE_URL } from "@/api";
import { MainTabScreen, PersonIcon, SkeletonBlock } from "@/components";
import { getValidAuthSession } from "@/lib";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
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
    }, []),
  );

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const photoUri = getProfilePhotoUri(profile);
  const gender = getProfileGender(profile);
  const age = getProfileAge(profile);
  const galleryPhotos =
    profile?.photos?.filter((photo) => !photo.isProfile).slice(0, 3) ?? [];
  const hobbies = profile?.hobbies ?? [];

  return (
    <MainTabScreen active="profile" borderedNav>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-5"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            className="h-[292px] w-full bg-[#F1F1F1]"
            accessibilityRole={photoUri && !imageFailed ? "imagebutton" : "image"}
            onPress={() => {
              if (photoUri && !imageFailed) setPreviewUri(photoUri);
            }}
          >
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
          </Pressable>

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
              onPress={() => router.push("/edit-profile")}
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
                <PhotoTile
                  key={photo.id}
                  uri={normalizePhotoUri(photo.url)}
                  onPress={setPreviewUri}
                />
              ))}
              {Array.from({
                length: Math.max(0, 3 - galleryPhotos.length),
              }).map((_, index) => (
                <PhotoTile key={`empty-${index}`} onPress={setPreviewUri} />
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

      <ImagePreviewModal
        uri={previewUri}
        onClose={() => setPreviewUri(null)}
      />
    </MainTabScreen>
  );
}

function ProfileSkeleton() {
  return (
    <MainTabScreen active="profile" borderedNav>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-5"
          showsVerticalScrollIndicator={false}
        >
          <SkeletonBlock className="h-[292px] w-full rounded-none" />

          <View className="px-5 pt-4">
            <SkeletonBlock className="h-5 w-[138px] rounded-full" />

            <View className="mt-4 flex-row items-center gap-2">
              <SkeletonBlock className="h-8 w-[168px] rounded-lg" />
              <SkeletonBlock className="h-7 w-[54px] rounded-full" />
            </View>

            <SkeletonBlock className="mt-2 h-4 w-[210px] rounded-md" />
            <SkeletonBlock className="mt-2 h-4 w-[150px] rounded-md" />
            <SkeletonBlock className="mt-4 h-9 w-[132px] rounded-full" />

            <View className="mt-5 h-px bg-[#E5E5E5]" />

            <SkeletonBlock className="mt-4 h-6 w-[74px] rounded-md" />

            <View className="mt-3 flex-row gap-3">
              <SkeletonBlock className="h-[58px] w-[58px] rounded-xl" />
              <SkeletonBlock className="h-[58px] w-[58px] rounded-xl" />
              <SkeletonBlock className="h-[58px] w-[58px] rounded-xl" />
            </View>

            <SkeletonBlock className="mt-4 h-6 w-[48px] rounded-md" />
            <SkeletonBlock className="mt-3 h-4 w-full rounded-md" />
            <SkeletonBlock className="mt-2 h-4 w-[86%] rounded-md" />

            <View className="mt-4 flex-row gap-2">
              <SkeletonBlock className="h-7 w-[72px] rounded-full" />
              <SkeletonBlock className="h-7 w-[88px] rounded-full" />
              <SkeletonBlock className="h-7 w-[64px] rounded-full" />
            </View>
          </View>
        </ScrollView>
    </MainTabScreen>
  );
}

function PhotoTile({
  uri,
  onPress,
}: {
  uri?: string;
  onPress: (uri: string) => void;
}) {
  return (
    <Pressable
      className="h-[58px] w-[58px] overflow-hidden rounded-xl bg-[#F1F1F1]"
      accessibilityRole={uri ? "imagebutton" : "button"}
      disabled={!uri}
      onPress={() => {
        if (uri) onPress(uri);
      }}
    >
      {uri ? (
        <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="add" size={25} color="#777873" />
        </View>
      )}
    </Pressable>
  );
}

function ImagePreviewModal({
  uri,
  onClose,
}: {
  uri: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(uri)}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/95">
        <SafeAreaView className="flex-1">
          <View className="h-14 flex-row items-center justify-end px-4">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
              accessibilityRole="button"
              accessibilityLabel="Close image preview"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <Pressable className="flex-1 items-center justify-center" onPress={onClose}>
            {uri ? (
              <Image
                source={{ uri }}
                className="h-full w-full"
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
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
