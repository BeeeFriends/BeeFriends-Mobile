import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "@/navigation/router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  UpdateUserDto,
  UserProfileDto,
} from "@beefriends/shared-kernel/types";
import {
  EditablePhotoTile,
  EditField,
  EditProfileSkeleton,
  HobbyPicker,
  OptionSelectField,
  PersonIcon,
  ToastBanner,
  useToast,
} from "@/components";
import {
  getCampusOptions,
  getHobbyOptions,
  getMajorOptions,
  type SelectOption,
  updateCurrentUserProfile,
} from "@/api";
import {
  getValidAuthSession,
  goBackOrReplace,
  saveAuthSession,
} from "@/lib";
import {
  MAX_GALLERY_PHOTOS,
  MAX_HOBBY_SELECTIONS,
  createEditProfileDraft,
  getErrorMessage,
  resolveUploadedPhotoUrl,
  type EditProfileDraft,
} from "@/utils";

export default function EditProfileScreen() {
  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [draft, setDraft] = useState<EditProfileDraft | null>(null);
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const [majorOptions, setMajorOptions] = useState<SelectOption[]>([]);
  const [hobbyOptions, setHobbyOptions] = useState<SelectOption[]>([]);
  const [isMasterDataLoading, setIsMasterDataLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const [session, campuses, majors, hobbies] = await Promise.all([
          getValidAuthSession(),
          getCampusOptions(),
          getMajorOptions(),
          getHobbyOptions(),
        ]);

        if (!session) {
          router.replace("/");
          return;
        }

        if (!isMounted) return;

        setCampusOptions(campuses);
        setMajorOptions(majors);
        setHobbyOptions(hobbies);
        setProfile(session.user);
        setAccessToken(session.access_token);
        setDraft(createEditProfileDraft(session.user));
      } catch (error) {
        showToast({
          title: "Failed to load profile",
          message: getErrorMessage(error),
        });
      } finally {
        if (isMounted) {
          setIsMasterDataLoading(false);
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateDraft = (nextDraft: Partial<EditProfileDraft>) => {
    setDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, ...nextDraft } : currentDraft,
    );
  };

  const scrollFocusedInputIntoView = () => {
    setTimeout(() => {
      scrollViewRef.current?.assureFocusedInputVisible();
    }, 120);
  };

  const pickProfilePhoto = async () => {
    const uri = await pickImageFromLibrary(showToast);
    if (!uri) return;

    updateDraft({ profilePhotoUrl: uri });
  };

  const pickGalleryPhoto = async (index?: number) => {
    if (!draft) return;

    const uri = await pickImageFromLibrary(showToast);
    if (!uri) return;

    const nextPhotoUrls = [...draft.photoUrls];

    if (typeof index === "number") {
      nextPhotoUrls[index] = uri;
    } else if (nextPhotoUrls.length < MAX_GALLERY_PHOTOS) {
      nextPhotoUrls.push(uri);
    }

    updateDraft({ photoUrls: nextPhotoUrls.slice(0, MAX_GALLERY_PHOTOS) });
  };

  const removeGalleryPhoto = (index: number) => {
    if (!draft) return;

    updateDraft({
      photoUrls: draft.photoUrls.filter(
        (_, photoIndex) => photoIndex !== index,
      ),
    });
  };

  const toggleHobby = (hobbyId: string) => {
    if (!draft) return;

    if (
      !draft.hobbyIds.includes(hobbyId) &&
      draft.hobbyIds.length >= MAX_HOBBY_SELECTIONS
    ) {
      showToast({
        title: "Too many hobbies",
        message: `You can choose up to ${MAX_HOBBY_SELECTIONS} hobbies.`,
        kind: "info",
      });
      return;
    }

    updateDraft({
      hobbyIds: draft.hobbyIds.includes(hobbyId)
        ? draft.hobbyIds.filter(
            (selectedHobbyId) => selectedHobbyId !== hobbyId,
          )
        : [...draft.hobbyIds, hobbyId],
    });
  };

  const saveProfile = async () => {
    if (!draft || !accessToken || isSaving) return;

    const displayName = draft.displayName.trim();
    const age = Number(draft.age);

    if (!displayName) {
      showToast({
        title: "Profile incomplete",
        message: "Display name cannot be empty.",
      });
      return;
    }

    if (!Number.isFinite(age) || age < 17 || age > 60) {
      showToast({
        title: "Profile incomplete",
        message: "Age must be between 17 and 60.",
      });
      return;
    }

    if (!draft.campusId || !draft.majorId) {
      showToast({
        title: "Profile incomplete",
        message: "Please choose your campus and major.",
      });
      return;
    }

    if (draft.hobbyIds.length === 0) {
      showToast({
        title: "Profile incomplete",
        message: "Please choose at least one hobby.",
      });
      return;
    }

    if (draft.hobbyIds.length > MAX_HOBBY_SELECTIONS) {
      showToast({
        title: "Too many hobbies",
        message: `Please keep your hobbies to ${MAX_HOBBY_SELECTIONS} or fewer.`,
      });
      return;
    }

    setIsSaving(true);

    try {
      const profilePhotoUrl = await resolveUploadedPhotoUrl(
        accessToken,
        draft.profilePhotoUrl,
        "profile",
      );
      const galleryPhotoUrls = await Promise.all(
        draft.photoUrls
          .filter(Boolean)
          .slice(0, MAX_GALLERY_PHOTOS)
          .map((photoUri) =>
            resolveUploadedPhotoUrl(accessToken, photoUri, "gallery"),
          ),
      );

      const updatePayload: UpdateUserDto = {
        displayName,
        description: draft.description.trim(),
        age,
        campusId: Number(draft.campusId),
        majorId: Number(draft.majorId),
        hobbyIds: draft.hobbyIds.map(Number),
        profilePhotoUrl: profilePhotoUrl || profile?.profilePhotoUrl,
        photoUrls: galleryPhotoUrls.filter(Boolean).slice(0, MAX_GALLERY_PHOTOS),
      };
      const phoneNumber = draft.phoneNumber.trim();
      if (phoneNumber) updatePayload.phoneNumber = phoneNumber;

      const updatedProfile = await updateCurrentUserProfile(
        accessToken,
        updatePayload,
      );

      await saveAuthSession({
        access_token: accessToken,
        user: updatedProfile,
      });
      router.replace("/profile" as never);
    } catch (error) {
      showToast({
        title: "Failed to save profile",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !draft) {
    return <EditProfileSkeleton />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6F6F6]">
      <StatusBar style="dark" />
      <ToastBanner toast={toast} onDismiss={hideToast} />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white">
        <View className="h-[88px] flex-row items-center border-b border-[#EFEFEF] bg-white px-6 pt-8">
          <Pressable
            className="mr-4 h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
            disabled={isSaving}
            onPress={() => goBackOrReplace("/profile")}
          >
            <Ionicons name="arrow-back" size={26} color="#171819" />
          </Pressable>

          <Text className="flex-1 font-jakarta-bold text-[20px] leading-7 text-[#171819]">
            Edit profile
          </Text>

          <Pressable
            className={`h-10 min-w-[74px] items-center justify-center rounded-full px-4 ${
              isSaving ? "bg-[#D9D9D9]" : "bg-black"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
            disabled={isSaving}
            onPress={saveProfile}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="font-jakarta-bold text-[13px] text-white">
                Save
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAwareScrollView
          ref={scrollViewRef}
          className="flex-1 px-5"
          bottomOffset={32}
          contentContainerStyle={{
            paddingBottom: 32,
            paddingTop: 20,
          }}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[22px] bg-[#F7F7F7] p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-jakarta-bold text-[15px] text-[#171819]">
                  Main photo
                </Text>
                <Text className="mt-1 font-jakarta text-[12px] text-[#777873]">
                  Best at 4:5 ratio
                </Text>
              </View>
              <Pressable
                className="h-9 flex-row items-center justify-center rounded-full bg-black px-4"
                accessibilityRole="button"
                onPress={pickProfilePhoto}
              >
                <Ionicons name="camera" size={15} color="#FFFFFF" />
                <Text className="ml-2 font-jakarta-bold text-[12px] text-white">
                  Change
                </Text>
              </Pressable>
            </View>

            <Pressable
              className="mt-4 aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-[#EDEDED]"
              accessibilityRole="imagebutton"
              onPress={pickProfilePhoto}
            >
              {draft.profilePhotoUrl ? (
                <Image
                  source={{ uri: draft.profilePhotoUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <PersonIcon color="#777873" size={58} />
                </View>
              )}
            </Pressable>
          </View>

          <View className="mt-5">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="font-jakarta-bold text-[15px] text-[#171819]">
                  Gallery photos
                </Text>
                <Text className="mt-1 font-jakarta text-[12px] text-[#777873]">
                  Add up to 3 photos
                </Text>
              </View>
              <Text className="font-jakarta-bold text-[12px] text-[#777873]">
                {draft.photoUrls.length}/{MAX_GALLERY_PHOTOS}
              </Text>
            </View>

            <View className="mt-3 flex-row gap-3">
              {Array.from({ length: MAX_GALLERY_PHOTOS }).map((_, index) => {
                const photoUri = draft.photoUrls[index];

                return (
                  <EditablePhotoTile
                    key={index}
                    uri={photoUri}
                    onPick={() =>
                      pickGalleryPhoto(photoUri ? index : undefined)
                    }
                    onRemove={() => removeGalleryPhoto(index)}
                  />
                );
              })}
            </View>
          </View>

          <View className="mt-6 gap-4">
            <Text className="font-jakarta-bold text-[15px] text-[#171819]">
              Campus details
            </Text>
            <OptionSelectField
              label="Campus"
              value={draft.campusId}
              options={campusOptions}
              placeholder={
                isMasterDataLoading ? "Loading campuses..." : "Choose campus"
              }
              disabled={isMasterDataLoading || campusOptions.length === 0}
              onChange={(campusId) => updateDraft({ campusId })}
            />
            <OptionSelectField
              label="Major"
              value={draft.majorId}
              options={majorOptions}
              placeholder={
                isMasterDataLoading ? "Loading majors..." : "Choose major"
              }
              disabled={isMasterDataLoading || majorOptions.length === 0}
              onChange={(majorId) => updateDraft({ majorId })}
            />
          </View>

          <View className="mt-6">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="font-jakarta-bold text-[15px] text-[#171819]">
                  Hobbies
                </Text>
                <Text className="mt-1 font-jakarta text-[12px] text-[#777873]">
                  Choose up to {MAX_HOBBY_SELECTIONS} things people should
                  notice
                </Text>
              </View>
              <Text className="font-jakarta-bold text-[12px] text-[#777873]">
                {draft.hobbyIds.length}/{MAX_HOBBY_SELECTIONS}
              </Text>
            </View>
            <HobbyPicker
              options={hobbyOptions}
              selectedValues={draft.hobbyIds}
              maxSelected={MAX_HOBBY_SELECTIONS}
              disabled={isMasterDataLoading}
              onToggle={toggleHobby}
            />
          </View>

          <View className="mt-6 gap-4">
            <EditField
              label="Display name"
              value={draft.displayName}
              onFocus={scrollFocusedInputIntoView}
              onChangeText={(displayName) => updateDraft({ displayName })}
            />
            <EditField
              label="Phone number"
              value={draft.phoneNumber}
              keyboardType="phone-pad"
              onFocus={scrollFocusedInputIntoView}
              onChangeText={(phoneNumber) => updateDraft({ phoneNumber })}
            />
            <EditField
              label="Age"
              value={draft.age}
              keyboardType="number-pad"
              onFocus={scrollFocusedInputIntoView}
              onChangeText={(age) => updateDraft({ age })}
            />
            <EditField
              label="Bio"
              value={draft.description}
              multiline
              onFocus={scrollFocusedInputIntoView}
              onChangeText={(description) => updateDraft({ description })}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

async function pickImageFromLibrary(
  showToast: (toast: {
    title: string;
    message?: string;
    kind?: "error";
  }) => void,
) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    showToast({
      title: "Photo access needed",
      message: "Please allow photo access to update your profile photos.",
    });
    return "";
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 5],
    quality: 0.85,
  });

  if (result.canceled) return "";

  return result.assets[0]?.uri ?? "";
}
