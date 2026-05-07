import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MatchDto, MatchProfileDto } from "@beefriends/shared-kernel/dto/chat";
import {
  CardIcon,
  ChatIcon,
  CommentIcon,
  HandIcon,
  NotificationIcon,
  PersonIcon,
  SubstrackIcon,
} from "../components/icons";
import { API_BASE_URL } from "../lib/api/client";
import { getValidAuthSession } from "../lib/auth/session";
import { getUserMatches } from "../lib/api/matches";

export default function MatchesScreen() {
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      const session = await getValidAuthSession();

      if (!session) {
        router.replace("/");
        return;
      }

      try {
        const nextMatches = await getUserMatches(session.user.id);

        if (!isMounted) return;

        setMatches(nextMatches);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white px-6 pt-10">
        <View className="flex-row items-center justify-between">
          <Text className="font-jakarta-bold text-[22px] leading-7 text-[#171819]">
            Matches
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center"
            accessibilityRole="button"
          >
            <NotificationIcon size={17} />
          </Pressable>
        </View>

        <View className="mt-5 flex-row items-center">
          <Text className="font-jakarta-bold text-[14px] leading-5 text-[#171819]">
            All matches
          </Text>
          <View className="ml-2 min-w-[28px] items-center rounded-full bg-[#F1F1F1] px-2 py-[2px]">
            <Text className="font-jakarta-bold text-[10px] leading-3 text-[#171819]">
              {matches.length}
            </Text>
          </View>
        </View>

        <ScrollView
          className="mt-4 flex-1"
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <Text className="mt-6 font-jakarta text-[13px] text-[#777873]">
              Loading matches...
            </Text>
          ) : matches.length === 0 ? (
            <Text className="mt-6 font-jakarta text-[13px] text-[#777873]">
              No matches yet.
            </Text>
          ) : (
            matches.map((match, index) => (
              <MatchRow
                key={match.id}
                match={match}
                showNewBadge={index === 0}
              />
            ))
          )}
        </ScrollView>

        <View className="h-[74px] flex-row items-center justify-around bg-white">
          <TabItem icon="card" label="Explore" onPress={() => router.push("/home")} />
          <TabItem icon="hand" label="Matches" active />
          <TabItem
            icon="chat"
            label="Chat"
            onPress={() => router.push("/chat")}
          />
          <TabItem icon="person" label="Profile" onPress={() => router.push("/profile")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MatchRow({
  match,
  showNewBadge,
}: {
  match: MatchDto;
  showNewBadge: boolean;
}) {
  const user = match.matchedUser;
  const photoUri = getProfilePhotoUri(user);

  return (
    <View className="mb-3 h-[47px] flex-row items-center">
      <View className="h-[42px] w-[42px] overflow-hidden rounded-full bg-[#F1F1F1]">
        {photoUri ? (
          <Image source={{ uri: photoUri }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <PersonIcon color="#777873" size={25} />
          </View>
        )}
      </View>

      <View className="ml-4 flex-1">
        <View className="flex-row items-center">
          <Text
            className="max-w-[154px] font-jakarta-bold text-[15px] leading-5 text-[#171819]"
            numberOfLines={1}
          >
            {user.displayName || "BeeFriend"}
          </Text>
          {showNewBadge ? (
            <View className="ml-2 rounded-full bg-[#FFEA00] px-[6px] py-[2px]">
              <Text className="font-jakarta-bold text-[7px] leading-[9px] text-[#171819]">
                NEW
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          className="font-jakarta text-[13px] leading-5 text-[#9A9A9A]"
          numberOfLines={1}
        >
          B{user.binusianYear ? String(user.binusianYear).slice(-2) : "--"},{" "}
          {user.major?.name || "Major"}
        </Text>
      </View>

      <Pressable
        className="h-8 w-8 items-center justify-center"
        accessibilityRole="button"
      >
        <CommentIcon size={14} />
      </Pressable>
      <Pressable
        className="h-8 w-8 items-center justify-center"
        accessibilityRole="button"
      >
        <SubstrackIcon size={11} />
      </Pressable>
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

function getProfilePhotoUri(user: MatchProfileDto) {
  return normalizePhotoUri(
    user.profilePhotoUrl ||
      user.photos?.find((photo) => photo.isProfile)?.url ||
      user.photos?.[0]?.url ||
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
