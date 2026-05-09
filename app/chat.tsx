import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type {
  ConversationDto,
  MatchDto,
  MessageDto,
} from "@beefriends/shared-kernel/dto/chat";
import {
  ChatIcon,
  NotificationIcon,
  PersonIcon,
  SearchIcon,
} from "../components/icons";
import { MainTabScreen } from "../components/MainTabScreen";
import { SkeletonBlock } from "../components/SkeletonBlock";
import { API_BASE_URL } from "../lib/api/client";
import { getUserConversations } from "../lib/api/conversations";
import { getUserMatches } from "../lib/api/matches";
import { getBatchPresence } from "../lib/api/presence";
import { getValidAuthSession } from "../lib/auth/session";
import { CHAT_EVENTS, getChatSocket } from "../lib/realtime/chatSocket";

type ChatItem = {
  id: string;
  name: string;
  preview: string;
  time: string;
  photoUrl: string;
  otherUserId: number | null;
  isOnline: boolean | null;
  isLastMessageMine: boolean;
  isLastMessageRead: boolean;
  unreadCount: number;
  profilePayload: string;
};

export default function ChatScreen() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<number, boolean>
  >({});
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      const session = await getValidAuthSession();

      if (!session) {
        router.replace("/");
        return;
      }

      setCurrentUserId(session.user.id);

      try {
        const [nextConversations, nextMatches] = await Promise.all([
          getUserConversations(session.user.id),
          getUserMatches(session.user.id).catch(() => []),
        ]);
        const participantIds = nextConversations
          .flatMap(
            (conversation) =>
              conversation.participantIds ?? conversation.participants,
          )
          .filter((userId) => userId !== session.user.id);
        const uniqueParticipantIds = Array.from(new Set(participantIds));
        const nextPresence = uniqueParticipantIds.length
          ? await getBatchPresence(uniqueParticipantIds).catch(() => [])
          : [];

        if (!isMounted) return;

        setConversations(nextConversations);
        setMatches(nextMatches);
        setPresenceByUserId(
          nextPresence.reduce<Record<number, boolean>>((presenceMap, presence) => {
            presenceMap[presence.userId] = presence.isOnline;
            return presenceMap;
          }, {}),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getChatSocket(currentUserId);
    const handleMessageReceived = (message: MessageDto) => {
      setConversations((currentConversations) =>
        sortConversations(
          currentConversations.map((conversation) =>
            conversation.id === message.conversationId
              ? updateConversationWithMessage(
                  conversation,
                  message,
                  currentUserId,
                )
              : conversation,
          ),
        ),
      );
    };
    const handlePresenceChanged = (presence: {
      userId: number;
      isOnline: boolean;
    }) => {
      setPresenceByUserId((currentPresence) =>
        currentPresence[presence.userId] === presence.isOnline
          ? currentPresence
          : {
              ...currentPresence,
              [presence.userId]: presence.isOnline,
            },
      );
    };
    const handleMessageRead = (event: {
      conversationId: string;
      messageId: string;
      userId: number;
    }) => {
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === event.conversationId
            ? applyConversationReadReceipt(
                conversation,
                event.messageId,
                event.userId,
                currentUserId,
              )
            : conversation,
        ),
      );
    };

    socket.on(CHAT_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    socket.on(CHAT_EVENTS.PRESENCE_CHANGED, handlePresenceChanged);
    socket.on(CHAT_EVENTS.MESSAGE_READ, handleMessageRead);

    return () => {
      socket.off(CHAT_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      socket.off(CHAT_EVENTS.PRESENCE_CHANGED, handlePresenceChanged);
      socket.off(CHAT_EVENTS.MESSAGE_READ, handleMessageRead);
    };
  }, [currentUserId]);

  const chatItems = useMemo(
    () =>
      conversations
        .map((conversation) =>
          toChatItem(conversation, currentUserId, presenceByUserId, matches),
        )
        .filter((item): item is ChatItem => Boolean(item))
        .filter((item) =>
          item.name.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    [conversations, currentUserId, matches, presenceByUserId, query],
  );

  return (
    <MainTabScreen active="chat" borderedNav contentClassName="px-5 pt-8">
        <View className="flex-row items-center justify-between">
          <Text className="font-jakarta-bold text-[24px] text-[#171819]">
            Chat
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push("/notifications" as never)}
          >
            <NotificationIcon size={17} />
          </Pressable>
        </View>

        <View className="mt-5 h-12 flex-row items-center rounded-full bg-[#F5F5F5] px-4">
          <SearchIcon color="#171819" size={15} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for chats"
            placeholderTextColor="#8D8D8D"
            className="ml-3 flex-1 font-jakarta text-[14px] text-[#171819]"
          />
        </View>

        <ScrollView
          className="mt-5 flex-1"
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ChatListSkeleton />
          ) : chatItems.length === 0 ? (
            <ChatEmptyState />
          ) : (
            chatItems.map((item) => <ChatRow key={item.id} item={item} />)
          )}
        </ScrollView>
    </MainTabScreen>
  );
}

function ChatEmptyState() {
  return (
    <View className="h-[430px] items-center justify-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF7B8]">
        <ChatIcon color="#252D36" fillColor="#FFEA00" size={34} />
      </View>
      <Text className="mt-5 text-center font-jakarta-bold text-[22px] leading-7 text-[#171819]">
        No chats yet
      </Text>
      <Text className="mt-2 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
        Your conversations will show up here after you match and start talking.
      </Text>
    </View>
  );
}

function ChatListSkeleton() {
  return (
    <View>
      {Array.from({ length: 7 }).map((_, index) => (
        <View key={index} className="h-[64px] flex-row items-center">
          <SkeletonBlock className="h-12 w-12 rounded-full" />
          <View className="ml-3 flex-1">
            <SkeletonBlock className="h-5 w-[54%] rounded-md" />
            <SkeletonBlock className="mt-2 h-4 w-[86%] rounded-md" />
          </View>
          <SkeletonBlock className="ml-2 h-3 w-9 self-start rounded-md" />
        </View>
      ))}
    </View>
  );
}

function updateConversationWithMessage(
  conversation: ConversationDto,
  message: MessageDto,
  currentUserId: number,
): ConversationDto {
  const currentUnreadCount = getUnreadCount(conversation);
  const shouldIncrementUnread = message.senderId !== currentUserId;

  return {
    ...conversation,
    lastMessageId: message.id,
    lastMessagePreview: getMessagePreview(message),
    lastMessageSenderId: message.senderId,
    lastMessage: mergeMessageReadBy(conversation.lastMessage, message),
    unreadCount: shouldIncrementUnread
      ? currentUnreadCount + 1
      : currentUnreadCount,
    updatedAt: message.updatedAt,
  } as ConversationDto & { unreadCount: number };
}

function applyConversationReadReceipt(
  conversation: ConversationDto,
  messageId: string,
  userId: number,
  currentUserId: number,
): ConversationDto {
  if (conversation.lastMessage?.id !== messageId) return conversation;

  return {
    ...conversation,
    unreadCount:
      userId === currentUserId ? 0 : getUnreadCount(conversation),
    lastMessage: {
      ...conversation.lastMessage,
      readBy: Array.from(
        new Set([...(conversation.lastMessage.readBy ?? []), userId]),
      ),
    },
  } as ConversationDto & { unreadCount: number };
}

function mergeMessageReadBy(
  currentMessage: MessageDto | null,
  nextMessage: MessageDto,
) {
  if (!currentMessage || currentMessage.id !== nextMessage.id) {
    return nextMessage;
  }

  return {
    ...currentMessage,
    ...nextMessage,
    readBy: Array.from(
      new Set([...(currentMessage.readBy ?? []), ...(nextMessage.readBy ?? [])]),
    ),
  };
}

function sortConversations(conversations: ConversationDto[]) {
  return [...conversations].sort(
    (firstConversation, secondConversation) =>
      getConversationTime(secondConversation) -
      getConversationTime(firstConversation),
  );
}

function getConversationTime(conversation: ConversationDto) {
  const date = new Date(conversation.updatedAt);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getMessagePreview(message: MessageDto) {
  if (message.attachmentUrls?.length && message.content === "Photo") {
    return "Photo";
  }

  return message.content.length > 120
    ? `${message.content.slice(0, 117)}...`
    : message.content;
}

function ChatRow({ item }: { item: ChatItem }) {
  return (
    <Pressable
      className="h-[64px] flex-row items-center"
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/chat-room",
          params: {
            conversationId: item.id,
            name: item.name,
            participantId: item.otherUserId ? String(item.otherUserId) : "",
            photoUrl: item.photoUrl,
            profile: item.profilePayload,
          },
        })
      }
    >
      <View className="h-12 w-12">
        <View className="h-full w-full overflow-hidden rounded-full bg-[#F1F1F1]">
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <PersonIcon color="#777873" size={26} />
            </View>
          )}
        </View>
        <View
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            item.isOnline ? "bg-[#21C45D]" : "bg-[#C9C9C9]"
          }`}
        />
      </View>

      <View className="ml-3 flex-1">
        <Text
          className="font-jakarta-bold text-[16px] text-[#171819]"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View className="mt-1 flex-row items-center">
          {item.isLastMessageMine ? (
            <View className="mr-2 flex-row items-center">
              <Ionicons
                name={item.isLastMessageRead ? "checkmark-done" : "checkmark"}
                size={13}
                color={item.isLastMessageRead ? "#2F80ED" : "#9A9A9A"}
              />
              <Text
                className={`ml-1 font-jakarta-semibold text-[12px] ${
                  item.isLastMessageRead ? "text-[#2F80ED]" : "text-[#9A9A9A]"
                }`}
              >
                {item.isLastMessageRead ? "Read" : "Sent"}
              </Text>
            </View>
          ) : null}
          <Text
            className="flex-1 font-jakarta text-[13px] text-[#8D8D8D]"
            numberOfLines={1}
          >
            {item.preview || "No messages yet"}
          </Text>
        </View>
      </View>

      <View className="ml-2 min-w-9 items-end self-stretch pt-2">
        <Text className="font-jakarta text-[12px] text-[#777873]">
          {item.time}
        </Text>
        {item.unreadCount > 0 ? (
          <View className="mt-2 min-w-6 items-center justify-center rounded-full bg-[#FFE036] px-2 py-[3px]">
            <Text className="font-jakarta-bold text-[11px] text-[#171819]">
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function toChatItem(
  conversation: ConversationDto,
  currentUserId: number | null,
  presenceByUserId: Record<number, boolean>,
  matches: MatchDto[],
): ChatItem | null {
  const participantIds = conversation.participantIds ?? conversation.participants;
  const otherUserId = participantIds.find((id) => id !== currentUserId) ?? null;
  const match = matches.find(
    (match) =>
      match.conversationId === conversation.id ||
      match.matchedUser.id === otherUserId,
  );

  if (!match) return null;

  const matchedUser = match.matchedUser;
  const name =
    conversation.name?.trim() ||
    matchedUser?.displayName?.trim() ||
    "Conversation";
  const photoUrl = normalizePhotoUri(
    matchedUser?.profilePhotoUrl ||
      matchedUser?.photos?.find((photo) => photo.isProfile)?.url ||
      matchedUser?.photos?.[0]?.url ||
      "",
  );

  return {
    id: conversation.id,
    name,
    preview:
      conversation.lastMessagePreview ||
      (conversation.lastMessage?.attachmentUrls?.length ? "Photo" : ""),
    time: formatChatTime(conversation.updatedAt),
    photoUrl,
    otherUserId,
    isOnline: otherUserId ? presenceByUserId[otherUserId] ?? null : null,
    isLastMessageMine: conversation.lastMessageSenderId === currentUserId,
    isLastMessageRead: Boolean(
      otherUserId && conversation.lastMessage?.readBy?.includes(otherUserId),
    ),
    unreadCount: getUnreadCount(conversation),
    profilePayload: matchedUser ? JSON.stringify(matchedUser) : "",
  };
}

function getUnreadCount(conversation: ConversationDto) {
  return Number(
    (conversation as ConversationDto & { unreadCount?: number }).unreadCount ??
      0,
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

function formatChatTime(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
