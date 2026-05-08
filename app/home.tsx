import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  MatchDecision,
  MatchProfileDto,
} from "@beefriends/shared-kernel/dto/chat";
import type { AuthResponseDto } from "@beefriends/shared-kernel/types";
import {
  HandIcon,
  LocationCampusIcon,
  MajorIcon,
  PersonIcon,
  SettingIcon,
} from "../components/icons";
import { BottomNav } from "../components/BottomNav";
import { SkeletonBlock } from "../components/SkeletonBlock";
import { API_BASE_URL } from "../lib/api/client";
import { getValidAuthSession } from "../lib/auth/session";
import { discoverMatches, swipeUser } from "../lib/api/matches";

export default function HomeScreen() {
  const [session, setSession] = useState<AuthResponseDto | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [candidates, setCandidates] = useState<MatchProfileDto[]>([]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const savedSession = await getValidAuthSession();

      if (!isMounted) return;

      if (!savedSession) {
        router.replace("/");
        return;
      }

      setSession(savedSession);
      setIsCheckingSession(false);
      registerPushToken(savedSession.user.id);
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCandidates() {
      if (!session?.user.id) return;

      setIsLoadingCandidates(true);

      try {
        const nextCandidates = await discoverMatches({
          userId: session.user.id,
          limit: 20,
        });

        if (!isMounted) return;

        setCandidates(nextCandidates);
        setCandidateIndex(0);
        setImageFailed(false);
      } catch {
        if (!isMounted) return;

        setCandidates([]);
        setCandidateIndex(0);
      } finally {
        if (isMounted) setIsLoadingCandidates(false);
      }
    }

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, [session?.user.id]);

  const handleSwipe = async (decision: MatchDecision) => {
    const swiperId = session?.user.id;
    const targetUserId = candidates[candidateIndex]?.id;

    if (!swiperId || !targetUserId || isSwiping) return;

    setIsSwiping(true);

    try {
      await swipeUser({
        swiperId,
        targetUserId,
        decision,
      });

      setCandidateIndex((index) => index + 1);
      setImageFailed(false);
    } finally {
      setIsSwiping(false);
    }
  };

  if (isCheckingSession) {
    return <ExploreSkeleton />;
  }

  const user = candidates[candidateIndex] ?? null;
  const hobbies = user?.hobbies?.slice(0, 3) ?? [];
  const profilePhotoUri = getProfilePhotoUri(user);
  const hasCandidate = Boolean(user);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 px-3 pb-3 pt-4">
        <View className="flex-row items-center justify-between px-1">
          <Image
            source={require("../assets/images/beefriends_title.png")}
            className="h-[31px] w-[98px]"
            resizeMode="contain"
          />

          <Pressable
            className="h-10 w-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push("/settings" as never)}
          >
            <SettingIcon size={22} />
          </Pressable>
        </View>

        <View className="mt-2 flex-1 items-center">
          {isLoadingCandidates ? (
            <ExploreCardSkeleton />
          ) : hasCandidate ? (
          <View className="relative w-full overflow-hidden rounded-[18px] bg-[#211C1D]">
            <View className="aspect-[9/16] w-full">
              {profilePhotoUri && !imageFailed ? (
                <Image
                  source={{ uri: profilePhotoUri }}
                  className="h-full w-full"
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-[#F1F1F1]">
                  <PersonIcon color="#777873" size={54} />
                </View>
              )}
            </View>

            <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-24">
              <View className="absolute inset-0 bg-black/35" />

              <View className="relative">
                <View className="mb-2 self-start rounded-full bg-[#7AE4F0] px-2 py-1">
                  <Text className="font-jakarta-bold text-[9px] text-[#171819]">
                    Searching for Casual Friend
                  </Text>
                </View>

                <Text className="font-jakarta-bold text-[24px] leading-8 text-white">
                  {user?.displayName || "BeeFriend"}, B
                  {user?.binusianYear ? String(user.binusianYear).slice(-2) : "--"}
                </Text>

                <View className="mt-1 gap-1">
                  <InfoLine type="location" text={user?.campus?.name} />
                  <InfoLine type="major" text={user?.major?.name} />
                </View>

                {user?.description ? (
                  <Text className="mt-5 font-jakarta-semibold text-[14px] leading-5 text-white">
                    {user.description}
                  </Text>
                ) : null}

                {hobbies.length > 0 ? (
                  <View className="mt-5 flex-row flex-wrap gap-2">
                    {hobbies.map((hobby) => (
                      <InterestPill key={hobby.id} label={hobby.name} />
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            <View className="absolute bottom-16 right-4 gap-3">
              <ActionButton
                disabled={!user || isSwiping}
                onPress={() => handleSwipe("PASS")}
              />
              <ActionButton
                active
                disabled={!user || isSwiping}
                onPress={() => handleSwipe("LIKE")}
              />
            </View>
          </View>
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF7B8]">
                <HandIcon color="#252D36" fillColor="#FFEA00" size={34} />
              </View>
              <Text className="mt-5 text-center font-jakarta-bold text-[22px] text-[#171819]">
                No profiles found
              </Text>
              <Text className="mt-2 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
                There are no other BeeFriends to explore yet.
              </Text>
            </View>
          )}
        </View>

        <BottomNav active="home" heightClassName="h-[58px]" />
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

function ExploreSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 px-3 pb-3 pt-4">
        <View className="flex-row items-center justify-between px-1">
          <Image
            source={require("../assets/images/beefriends_title.png")}
            className="h-[31px] w-[98px]"
            resizeMode="contain"
          />
          <SkeletonBlock className="h-10 w-10 rounded-full" />
        </View>

        <View className="mt-2 flex-1 items-center">
          <ExploreCardSkeleton />
        </View>

        <BottomNav active="home" heightClassName="h-[58px]" />
      </View>
    </SafeAreaView>
  );
}

function ExploreCardSkeleton() {
  return (
    <View className="relative w-full overflow-hidden rounded-[18px] bg-[#211C1D]">
      <View className="aspect-[9/16] w-full bg-[#E7E7E7]" />

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-24">
        <View className="absolute inset-0 bg-black/35" />

        <View className="relative pr-16">
          <SkeletonBlock className="mb-2 h-5 w-[142px] rounded-full bg-[#7AE4F0]/80" />
          <SkeletonBlock className="h-8 w-[188px] rounded-lg bg-white/85" />
          <SkeletonBlock className="mt-3 h-4 w-[198px] rounded-md bg-white/75" />
          <SkeletonBlock className="mt-2 h-4 w-[162px] rounded-md bg-white/75" />
          <SkeletonBlock className="mt-5 h-4 w-full rounded-md bg-white/75" />
          <SkeletonBlock className="mt-2 h-4 w-[74%] rounded-md bg-white/75" />

          <View className="mt-5 flex-row gap-2">
            <SkeletonBlock className="h-7 w-[70px] rounded-full bg-white/75" />
            <SkeletonBlock className="h-7 w-[82px] rounded-full bg-white/75" />
            <SkeletonBlock className="h-7 w-[64px] rounded-full bg-white/75" />
          </View>
        </View>
      </View>

      <View className="absolute bottom-16 right-4 gap-3">
        <View className="h-10 w-10 rounded-full border-2 border-white bg-white" />
        <View className="h-10 w-10 rounded-full border-2 border-white bg-[#FFDD2D]" />
      </View>
    </View>
  );
}

function InfoLine({
  type,
  text,
}: {
  type: "location" | "major";
  text?: string;
}) {
  if (!text) return null;

  return (
    <View className="flex-row items-center gap-1">
      <View className="h-4 w-5 items-center justify-center">
        {type === "location" ? (
          <LocationCampusIcon size={15} />
        ) : (
          <MajorIcon size={16} />
        )}
      </View>
      <Text className="font-jakarta-semibold text-[12px] leading-4 text-white">
        {text}
      </Text>
    </View>
  );
}

function InterestPill({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-white px-3 py-1">
      <Text className="font-jakarta-bold text-[10px] text-white">{label}</Text>
    </View>
  );
}

function ActionButton({
  active = false,
  disabled = false,
  onPress,
}: {
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className={`h-10 w-10 items-center justify-center rounded-full border-2 border-white ${
        active ? "bg-[#FFDD2D]" : "bg-white"
      } ${disabled ? "opacity-60" : ""}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
    >
      {active ? (
        <HandIcon color="#171819" size={27} />
      ) : (
        <Ionicons name="close" size={28} color="#171819" />
      )}
    </Pressable>
  );
}

function getProfilePhotoUri(user: MatchProfileDto | null) {
  const profilePhoto =
    user?.profilePhotoUrl ||
    user?.photos?.find((photo) => photo.isProfile)?.url ||
    user?.photos?.[0]?.url ||
    "";

  if (!profilePhoto) return "";

  if (
    profilePhoto.startsWith("http://") ||
    profilePhoto.startsWith("https://") ||
    profilePhoto.startsWith("file://") ||
    profilePhoto.startsWith("content://") ||
    profilePhoto.startsWith("data:")
  ) {
    return profilePhoto;
  }

  if (profilePhoto.startsWith("/")) {
    return `${API_BASE_URL}${profilePhoto}`;
  }

  return profilePhoto;
}
