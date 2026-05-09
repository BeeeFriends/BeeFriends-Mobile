import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  UpdateUserDto,
  UserProfileDto,
} from "@beefriends/shared-kernel/types";
import { PersonIcon } from "../components/icons";
import { SkeletonBlock } from "../components/SkeletonBlock";
import { ToastBanner, useToast } from "../components/ToastBanner";
import { getCampusOptions } from "../lib/api/campus";
import { API_BASE_URL } from "../lib/api/client";
import { getHobbyOptions } from "../lib/api/hobbies";
import { getMajorOptions } from "../lib/api/majors";
import type { SelectOption } from "../lib/api/types";
import { getValidAuthSession, saveAuthSession } from "../lib/auth/session";
import { updateCurrentUserProfile, uploadProfilePhoto } from "../lib/api/users";
import { goBackOrReplace } from "../lib/navigation/back";

type EditProfileDraft = {
  displayName: string;
  phoneNumber: string;
  description: string;
  age: string;
  profilePhotoUrl: string;
  photoUrls: string[];
  campusId: string;
  majorId: string;
  hobbyIds: string[];
};

export default function EditProfileScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [draft, setDraft] = useState<EditProfileDraft | null>(null);
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const [majorOptions, setMajorOptions] = useState<SelectOption[]>([]);
  const [hobbyOptions, setHobbyOptions] = useState<SelectOption[]>([]);
  const [isMasterDataLoading, setIsMasterDataLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
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

        const galleryPhotos =
          session.user.photos
            ?.filter((photo) => !photo.isProfile)
            .slice(0, 3)
            .map((photo) => normalizePhotoUri(photo.url)) ?? [];

        setCampusOptions(campuses);
        setMajorOptions(majors);
        setHobbyOptions(hobbies);
        setProfile(session.user);
        setAccessToken(session.access_token);
        setDraft({
          displayName: session.user.displayName || "",
          phoneNumber: session.user.phoneNumber || "",
          description: session.user.description || "",
          age: session.user.age ? String(session.user.age) : "",
          profilePhotoUrl: getProfilePhotoUri(session.user),
          photoUrls: galleryPhotos,
          campusId: session.user.campus?.id ? String(session.user.campus.id) : "",
          majorId: session.user.major?.id ? String(session.user.major.id) : "",
          hobbyIds: session.user.hobbies?.map((hobby) => String(hobby.id)) ?? [],
        });
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

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      Keyboard.scheduleLayoutAnimation?.(event);
      setIsKeyboardOpen(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      Keyboard.scheduleLayoutAnimation?.(event);
      setIsKeyboardOpen(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const updateDraft = (nextDraft: Partial<EditProfileDraft>) => {
    setDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, ...nextDraft } : currentDraft,
    );
  };

  const scrollFocusedInputIntoView = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
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
    } else if (nextPhotoUrls.length < 3) {
      nextPhotoUrls.push(uri);
    }

    updateDraft({ photoUrls: nextPhotoUrls.slice(0, 3) });
  };

  const removeGalleryPhoto = (index: number) => {
    if (!draft) return;

    updateDraft({
      photoUrls: draft.photoUrls.filter((_, photoIndex) => photoIndex !== index),
    });
  };

  const toggleHobby = (hobbyId: string) => {
    if (!draft) return;

    updateDraft({
      hobbyIds: draft.hobbyIds.includes(hobbyId)
        ? draft.hobbyIds.filter((selectedHobbyId) => selectedHobbyId !== hobbyId)
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
          .slice(0, 3)
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
        photoUrls: galleryPhotoUrls.filter(Boolean).slice(0, 3),
      };
      const phoneNumber = draft.phoneNumber.trim();
      if (phoneNumber) updatePayload.phoneNumber = phoneNumber;

      const updatedProfile = await updateCurrentUserProfile(
        accessToken,
        updatePayload,
      );

      await saveAuthSession({ access_token: accessToken, user: updatedProfile });
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ToastBanner toast={toast} onDismiss={hideToast} />
      <KeyboardAvoidingView
        className="mx-auto w-full max-w-[430px] flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1">
            <View className="h-16 flex-row items-center justify-between px-5">
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => goBackOrReplace("/profile")}
              >
                <Ionicons name="chevron-back" size={22} color="#171819" />
              </Pressable>

              <Text className="font-jakarta-bold text-[18px] text-[#171819]">
                Edit profile
              </Text>

              <Pressable
                className={`h-10 min-w-[78px] items-center justify-center rounded-full px-4 ${
                  isSaving ? "bg-[#D9D9D9]" : "bg-black"
                }`}
                accessibilityRole="button"
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

            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-5"
              contentContainerClassName={isKeyboardOpen ? "pb-80" : "pb-8"}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
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
                    {draft.photoUrls.length}/3
                  </Text>
                </View>

                <View className="mt-3 flex-row gap-3">
                  {Array.from({ length: 3 }).map((_, index) => {
                    const photoUri = draft.photoUrls[index];

                    return (
                      <EditablePhotoTile
                        key={index}
                        uri={photoUri}
                        onPick={() => pickGalleryPhoto(photoUri ? index : undefined)}
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
                      Choose what you want people to notice
                    </Text>
                  </View>
                  <Text className="font-jakarta-bold text-[12px] text-[#777873]">
                    {draft.hobbyIds.length}
                  </Text>
                </View>
                <HobbyPicker
                  options={hobbyOptions}
                  selectedValues={draft.hobbyIds}
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
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OptionSelectField({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View>
      <RequiredLabel>{label}</RequiredLabel>
      <Pressable
        className={`h-[45px] flex-row items-center justify-between rounded-xl border border-[#9A9A9A] px-4 ${
          disabled ? "opacity-60" : ""
        }`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={`mr-3 flex-1 font-jakarta text-[13px] ${
            selectedOption ? "text-[#171819]" : "text-[#8D8D8D]"
          }`}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#777873" />
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/30"
          onPress={() => setIsOpen(false)}
        >
          <Pressable className="max-h-[420px] rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-3 h-1 w-12 self-center rounded-full bg-[#D9D9D9]" />
            <Text className="mb-3 font-jakarta-bold text-[16px] text-[#171819]">
              {label}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  className="flex-row items-center justify-between border-b border-[#F0F0F0] py-4"
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text className="font-jakarta text-[14px] text-[#171819]">
                    {option.label}
                  </Text>
                  {value === option.value ? (
                    <Ionicons name="checkmark" size={20} color="#211C1D" />
                  ) : null}
                </Pressable>
              ))}

              {options.length === 0 ? (
                <View className="h-24 items-center justify-center">
                  <Text className="font-jakarta text-[12px] text-[#777873]">
                    No options available.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-jakarta-bold text-[12px] text-[#171819]">
      {children}
      <Text className="text-[#D71920]">*</Text>
    </Text>
  );
}

function HobbyPicker({
  options,
  selectedValues,
  disabled,
  onToggle,
}: {
  options: SelectOption[];
  selectedValues: string[];
  disabled?: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <View className="mt-4 flex-row flex-wrap gap-2">
      {disabled ? (
        <Text className="font-jakarta text-[12px] text-[#777873]">
          Loading interests...
        </Text>
      ) : options.length === 0 ? (
        <Text className="font-jakarta text-[12px] text-[#777873]">
          No interests available.
        </Text>
      ) : (
        options.map((option) => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <Pressable
              key={option.value}
              className={`h-[34px] items-center justify-center rounded-full border px-4 ${
                isSelected
                  ? "border-[#211C1D] bg-[#211C1D]"
                  : "border-[#211C1D] bg-white"
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onToggle(option.value)}
            >
              <Text
                className={`font-jakarta-semibold text-[12px] ${
                  isSelected ? "text-white" : "text-[#171819]"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

function EditablePhotoTile({
  uri,
  onPick,
  onRemove,
}: {
  uri?: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      className="aspect-square flex-1 overflow-hidden rounded-2xl bg-[#F1F1F1]"
      accessibilityRole="button"
      onPress={onPick}
    >
      {uri ? (
        <>
          <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
          <Pressable
            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-black/70"
            accessibilityRole="button"
            onPress={onRemove}
          >
            <Ionicons name="trash" size={14} color="#FFFFFF" />
          </Pressable>
        </>
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="add" size={25} color="#777873" />
        </View>
      )}
    </Pressable>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  onFocus,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text className="mb-2 font-jakarta-bold text-[12px] text-[#171819]">
        {label}
      </Text>
      <TextInput
        value={value}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-2xl bg-[#F5F5F5] px-4 font-jakarta text-[14px] text-[#171819] ${
          multiline ? "min-h-[112px] py-3 leading-5" : "h-12"
        }`}
        placeholderTextColor="#8D8D8D"
        onFocus={onFocus}
        onBlur={Keyboard.dismiss}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function EditProfileSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white px-5">
        <View className="h-16 flex-row items-center justify-between">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <SkeletonBlock className="h-6 w-28 rounded-md" />
          <SkeletonBlock className="h-10 w-[78px] rounded-full" />
        </View>
        <SkeletonBlock className="mt-2 aspect-[4/5] w-full rounded-[22px]" />
        <View className="mt-5 flex-row gap-3">
          <SkeletonBlock className="aspect-square flex-1 rounded-2xl" />
          <SkeletonBlock className="aspect-square flex-1 rounded-2xl" />
          <SkeletonBlock className="aspect-square flex-1 rounded-2xl" />
        </View>
        <SkeletonBlock className="mt-6 h-12 w-full rounded-2xl" />
        <SkeletonBlock className="mt-4 h-12 w-full rounded-2xl" />
        <SkeletonBlock className="mt-4 h-[112px] w-full rounded-2xl" />
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

async function resolveUploadedPhotoUrl(
  accessToken: string,
  photoUri: string,
  kind: "profile" | "gallery",
) {
  if (!photoUri) return "";
  if (!isLocalPhotoUri(photoUri)) return photoUri;

  const uploadedPhoto = await uploadProfilePhoto(accessToken, photoUri, kind);
  return uploadedPhoto.url;
}

function isLocalPhotoUri(photoUri: string) {
  return (
    photoUri.startsWith("file://") ||
    photoUri.startsWith("content://") ||
    photoUri.startsWith("ph://")
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
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
