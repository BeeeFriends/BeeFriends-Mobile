import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { MatchDto, MatchProfileDto } from "@beefriends/shared-kernel/dto/chat";
import {
  CommentIcon,
  HandIcon,
  PersonIcon,
  SubstrackIcon,
} from "../components/icons";
import { MainTabScreen } from "../components/MainTabScreen";
import { NotificationButton } from "../components/NotificationButton";
import { SkeletonBlock } from "../components/SkeletonBlock";
import { ToastBanner, useToast } from "../components/ToastBanner";
import { API_BASE_URL } from "../lib/api/client";
import { getValidAuthSession } from "../lib/auth/session";
import { createConversation } from "../lib/api/conversations";
import { getUserMatches, unmatchUser } from "../lib/api/matches";

export default function MatchesScreen() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [matchToRemove, setMatchToRemove] = useState<MatchDto | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      const session = await getValidAuthSession();

      if (!session) {
        router.replace("/");
        return;
      }

      setCurrentUserId(session.user.id);

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

  const openMatchChat = async (match: MatchDto) => {
    if (!currentUserId || activeActionId) return;

    const conversationName = match.matchedUser.displayName?.trim() || "Chat";
    const photoUrl = getProfilePhotoUri(match.matchedUser);
    const profilePayload = JSON.stringify(match.matchedUser);

    if (match.conversationId) {
      router.push({
        pathname: "/chat-room",
        params: {
          conversationId: match.conversationId,
          name: conversationName,
          participantId: String(match.matchedUser.id),
          photoUrl,
          profile: profilePayload,
        },
      });
      return;
    }

    setActiveActionId(match.id);

    try {
      const conversation = await createConversation({
        participantIds: [currentUserId, match.matchedUser.id],
        name: conversationName,
        isGroup: false,
      });

      setMatches((currentMatches) =>
        currentMatches.map((currentMatch) =>
          currentMatch.id === match.id
            ? { ...currentMatch, conversationId: conversation.id }
            : currentMatch,
        ),
      );

      router.push({
        pathname: "/chat-room",
        params: {
          conversationId: conversation.id,
          name: conversation.name || conversationName,
          participantId: String(match.matchedUser.id),
          photoUrl,
          profile: profilePayload,
        },
      });
    } catch (error) {
      showToast({
        title: "Failed to open chat",
        message: getErrorMessage(error),
      });
    } finally {
      setActiveActionId(null);
    }
  };

  const confirmUnmatch = (match: MatchDto) => {
    if (activeActionId) return;

    setMatchToRemove(match);
  };

  const removeMatch = async (matchId: string) => {
    if (!currentUserId) return;

    setActiveActionId(matchId);

    try {
      await unmatchUser(matchId, currentUserId);
      setMatches((currentMatches) =>
        currentMatches.filter((match) => match.id !== matchId),
      );
      setMatchToRemove(null);
    } catch (error) {
      showToast({
        title: "Failed to remove match",
        message: getErrorMessage(error),
      });
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <MainTabScreen active="matches" contentClassName="px-6 pt-10">
      <ToastBanner toast={toast} onDismiss={hideToast} />
        <View className="flex-row items-center justify-between">
          <Text className="font-jakarta-bold text-[22px] leading-7 text-[#171819]">
            Matches
          </Text>
          <NotificationButton size={17} />
        </View>

        <View className="mt-5 flex-row items-center">
          <Text className="font-jakarta-bold text-[14px] leading-5 text-[#171819]">
            All matches
          </Text>
          <View className="ml-2 min-w-[28px] items-center rounded-full bg-[#F1F1F1] px-2 py-[2px]">
            <Text className="font-jakarta-bold text-[10px] leading-3 text-[#171819]">
              {isLoading ? "--" : matches.length}
            </Text>
          </View>
        </View>

        <ScrollView
          className="mt-4 flex-1"
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <MatchListSkeleton />
          ) : matches.length === 0 ? (
            <MatchEmptyState />
          ) : (
            matches.map((match, index) => (
              <MatchRow
                key={match.id}
                match={match}
                showNewBadge={index === 0}
                isBusy={activeActionId === match.id}
                onChat={() => openMatchChat(match)}
                onOpenProfile={() => openProfileDetail(match.matchedUser)}
                onUnmatch={() => confirmUnmatch(match)}
              />
            ))
          )}
        </ScrollView>
      <RemoveMatchModal
        match={matchToRemove}
        isRemoving={Boolean(matchToRemove && activeActionId === matchToRemove.id)}
        onCancel={() => {
          if (!activeActionId) setMatchToRemove(null);
        }}
        onRemove={() => {
          if (matchToRemove) removeMatch(matchToRemove.id);
        }}
      />
    </MainTabScreen>
  );
}

function RemoveMatchModal({
  match,
  isRemoving,
  onCancel,
  onRemove,
}: {
  match: MatchDto | null;
  isRemoving: boolean;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const user = match?.matchedUser;
  const photoUri = user ? getProfilePhotoUri(user) : "";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(match)}
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/35">
        <Pressable className="flex-1" onPress={onCancel} />
        <View className="mx-auto w-full max-w-[430px] rounded-t-[28px] bg-white px-6 pb-8 pt-5">
          <View className="mb-5 h-1 w-12 self-center rounded-full bg-[#D9D9D9]" />
          <View className="items-center">
            <View className="h-16 w-16 overflow-hidden rounded-full bg-[#F1F1F1]">
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <PersonIcon color="#777873" size={32} />
                </View>
              )}
            </View>
            <Text className="mt-4 text-center font-jakarta-bold text-[21px] text-[#171819]">
              Remove match?
            </Text>
            <Text className="mt-2 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
              {`You will no longer see ${user?.displayName || "this match"} in Matches.`}
            </Text>
          </View>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              className="h-12 flex-1 items-center justify-center rounded-full bg-[#F5F5F5]"
              accessibilityRole="button"
              disabled={isRemoving}
              onPress={onCancel}
            >
              <Text className="font-jakarta-bold text-[14px] text-[#171819]">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              className={`h-12 flex-1 items-center justify-center rounded-full ${
                isRemoving ? "bg-[#D9D9D9]" : "bg-[#171819]"
              }`}
              accessibilityRole="button"
              disabled={isRemoving}
              onPress={onRemove}
            >
              {isRemoving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="font-jakarta-bold text-[14px] text-white">
                  Remove
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MatchEmptyState() {
  return (
    <View className="h-[430px] items-center justify-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF7B8]">
        <HandIcon color="#252D36" fillColor="#FFEA00" size={34} />
      </View>
      <Text className="mt-5 text-center font-jakarta-bold text-[22px] leading-7 text-[#171819]">
        No matches yet
      </Text>
      <Text className="mt-2 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
        Like someone in Explore. If they like you back, they will appear here.
      </Text>
    </View>
  );
}

function MatchListSkeleton() {
  return (
    <View className="mt-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <View key={index} className="mb-3 h-[47px] flex-row items-center">
          <SkeletonBlock className="h-[42px] w-[42px] rounded-full" />
          <View className="ml-4 flex-1">
            <SkeletonBlock className="h-5 w-[48%] rounded-md" />
            <SkeletonBlock className="mt-2 h-4 w-[72%] rounded-md" />
          </View>
          <SkeletonBlock className="h-8 w-8 rounded-full" />
          <SkeletonBlock className="ml-1 h-8 w-8 rounded-full" />
        </View>
      ))}
    </View>
  );
}

function MatchRow({
  match,
  showNewBadge,
  isBusy,
  onChat,
  onOpenProfile,
  onUnmatch,
}: {
  match: MatchDto;
  showNewBadge: boolean;
  isBusy: boolean;
  onChat: () => void;
  onOpenProfile: () => void;
  onUnmatch: () => void;
}) {
  const user = match.matchedUser;
  const photoUri = getProfilePhotoUri(user);

  return (
    <View className="mb-3 h-[47px] flex-row items-center">
      <Pressable
        className="h-[42px] w-[42px] overflow-hidden rounded-full bg-[#F1F1F1]"
        accessibilityRole="button"
        onPress={onOpenProfile}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <PersonIcon color="#777873" size={25} />
          </View>
        )}
      </Pressable>

      <Pressable
        className="ml-4 flex-1"
        accessibilityRole="button"
        onPress={onOpenProfile}
      >
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
      </Pressable>

      <Pressable
        className="h-8 w-8 items-center justify-center"
        accessibilityRole="button"
        disabled={isBusy}
        onPress={onChat}
      >
        {isBusy ? (
          <ActivityIndicator color="#171819" size="small" />
        ) : (
          <CommentIcon size={14} />
        )}
      </Pressable>
      <Pressable
        className="h-8 w-8 items-center justify-center"
        accessibilityRole="button"
        disabled={isBusy}
        onPress={onUnmatch}
      >
        <SubstrackIcon size={11} />
      </Pressable>
    </View>
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

function openProfileDetail(user: MatchProfileDto) {
  router.push({
    pathname: "/profile-detail" as never,
    params: { profile: JSON.stringify(user) },
  });
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}
