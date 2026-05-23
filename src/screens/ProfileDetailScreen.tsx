import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "@/navigation/router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MatchProfileDto } from "@beefriends/shared-kernel/dto/chat";
import { API_BASE_URL } from "@/api";
import { PersonIcon } from "@/components";
import { goBackOrReplace } from "@/lib";

export default function ProfileDetailScreen() {
  const params = useLocalSearchParams<{ profile?: string }>();
  const profileParam = Array.isArray(params.profile)
    ? params.profile[0]
    : params.profile;
  const profile = useMemo(() => parseProfile(profileParam), [profileParam]);
  const [imageFailed, setImageFailed] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="mx-auto w-full max-w-[430px] flex-1 px-5 pt-4">
          <Header title="Profile" />
          <View className="flex-1 items-center justify-center px-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF7B8]">
              <PersonIcon color="#252D36" fillColor="#FFEA00" size={34} />
            </View>
            <Text className="mt-5 text-center font-jakarta-bold text-[21px] text-[#171819]">
              Profile unavailable
            </Text>
            <Text className="mt-2 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
              This profile could not be opened from the current data.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const photoUri = getProfilePhotoUri(profile);
  const gender = getProfileGender(profile);
  const age = getProfileAge(profile);
  const hobbies = profile.hobbies ?? [];
  const galleryPhotos = getGalleryPhotoUris(profile);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white">
        <Header title="Profile" />
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="h-[506px] w-full bg-[#F1F1F1]">
            {photoUri && !imageFailed ? (
              <Pressable
                className="h-full w-full"
                accessibilityRole="imagebutton"
                onPress={() => setPreviewUri(photoUri)}
              >
                <Image
                  source={{ uri: photoUri }}
                  className="h-full w-full"
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              </Pressable>
            ) : (
              <View className="h-full w-full items-center justify-center">
                <PersonIcon color="#777873" size={74} />
              </View>
            )}
          </View>

          <View className="px-5 pt-4">
            <View className="flex-row items-center">
              <Text
                className="mr-2 flex-shrink font-jakarta-bold text-[22px] leading-7 text-[#171819]"
                numberOfLines={1}
              >
                {profile.displayName || "BeeFriend"}
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
              B{profile.binusianYear ? String(profile.binusianYear).slice(-2) : "--"}{" "}
              - {profile.major?.name || "Major"}
            </Text>
            <Text className="font-jakarta text-[13px] leading-5 text-[#777873]">
              {profile.campus?.name || "Campus"}
            </Text>

            <Text className="mt-4 font-jakarta text-[15px] leading-6 text-[#777873]">
              {profile.description ||
                "Hey! Searching for online friends to chat with."}
            </Text>

            <Text className="mt-5 font-jakarta-bold text-[17px] text-[#171819]">
              Photos
            </Text>
            <View className="mt-3 flex-row gap-3">
              {galleryPhotos.map((uri) => (
                <PhotoTile key={uri} uri={uri} onPress={setPreviewUri} />
              ))}
              {Array.from({ length: Math.max(0, 3 - galleryPhotos.length) }).map(
                (_, index) => (
                  <PhotoTile key={`empty-${index}`} onPress={setPreviewUri} />
                ),
              )}
            </View>

            <Text className="mt-5 font-jakarta-bold text-[17px] text-[#171819]">
              Hobbies / Likes
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {hobbies.length ? (
                hobbies.map((hobby) => (
                  <View
                    key={hobby.id}
                    className="rounded-full border border-[#171819] px-3 py-[6px]"
                  >
                    <Text className="font-jakarta-bold text-[12px] text-[#171819]">
                      {hobby.name}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="font-jakarta text-[13px] text-[#777873]">
                  No hobbies listed yet.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
      <ImagePreviewModal uri={previewUri} onClose={() => setPreviewUri(null)} />
    </SafeAreaView>
  );
}

function PhotoTile({
  uri,
  onPress,
}: {
  uri?: string;
  onPress: (uri: string) => void;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <Pressable
      className="aspect-square flex-1 overflow-hidden rounded-xl bg-[#F1F1F1]"
      accessibilityRole={uri && !hasError ? "imagebutton" : "button"}
      disabled={!uri || hasError}
      onPress={() => {
        if (uri && !hasError) onPress(uri);
      }}
    >
      {uri && !hasError ? (
        <Image
          source={{ uri }}
          className="h-full w-full"
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="image-outline" size={24} color="#777873" />
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

function Header({ title }: { title: string }) {
  return (
    <View className="h-[54px] flex-row items-center px-5">
      <Pressable
        className="h-10 w-10 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => goBackOrReplace("/home")}
      >
        <Ionicons name="arrow-back" size={23} color="#171819" />
      </Pressable>
      <Text className="ml-1 font-jakarta-bold text-[19px] text-[#171819]">
        {title}
      </Text>
    </View>
  );
}

function parseProfile(profileParam?: string): MatchProfileDto | null {
  if (!profileParam) return null;

  try {
    return JSON.parse(profileParam) as MatchProfileDto;
  } catch {
    return null;
  }
}

function getProfilePhotoUri(profile: MatchProfileDto) {
  return normalizePhotoUri(
    profile.profilePhotoUrl ||
      profile.photos?.find((photo) => photo.isProfile)?.url ||
      profile.photos?.[0]?.url ||
      "",
  );
}

function getGalleryPhotoUris(profile: MatchProfileDto) {
  return (
    profile.photos
      ?.filter((photo) => !photo.isProfile)
      .map((photo) => normalizePhotoUri(photo.url))
      .filter(Boolean)
      .slice(0, 3) ?? []
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

function getProfileGender(profile: MatchProfileDto) {
  return typeof (profile as { gender?: unknown }).gender === "string"
    ? String((profile as { gender?: string }).gender)
    : "";
}

function getProfileAge(profile: MatchProfileDto) {
  return typeof (profile as { age?: unknown }).age === "number"
    ? Number((profile as { age?: number }).age)
    : undefined;
}
