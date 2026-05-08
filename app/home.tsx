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
  CardIcon,
  ChatIcon,
  HandIcon,
  LocationCampusIcon,
  MajorIcon,
  PersonIcon,
  SettingIcon,
} from "../components/icons";
import { API_BASE_URL } from "../lib/api/client";
import { getValidAuthSession } from "../lib/auth/session";
import { discoverMatches, swipeUser } from "../lib/api/matches";

export default function HomeScreen() {
  const [session, setSession] = useState<AuthResponseDto | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
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
    return <SafeAreaView className="flex-1 bg-white" />;
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
          >
            <SettingIcon size={22} />
          </Pressable>
        </View>

        <View className="mt-2 flex-1 items-center">
          {hasCandidate ? (
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

                <Text className="mt-5 font-jakarta-semibold text-[14px] leading-5 text-white">
                  {user?.description || "Looking for a gym buddy from CS!"}
                </Text>

                <View className="mt-5 flex-row flex-wrap gap-2">
                  {hobbies.length > 0 ? (
                    hobbies.map((hobby) => (
                      <InterestPill key={hobby.id} label={hobby.name} />
                    ))
                  ) : (
                    <>
                      <InterestPill label="Soccer" />
                      <InterestPill label="Movies" />
                      <InterestPill label="Gym" />
                    </>
                  )}
                </View>
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
              <Text className="text-center font-jakarta-bold text-[22px] text-[#171819]">
                No profiles found
              </Text>
              <Text className="mt-2 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
                There are no other BeeFriends to explore yet.
              </Text>
            </View>
          )}
        </View>

        <View className="h-[58px] flex-row items-center justify-around">
          <TabItem icon="card" label="Explore" active />
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
          <TabItem
            icon="person"
            label="Profile"
            onPress={() => router.push("/profile")}
          />
        </View>
      </View>
    </SafeAreaView>
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
