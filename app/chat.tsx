import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ConversationDto } from "@beefriends/shared-kernel/dto/chat";
import {
  CardIcon,
  ChatIcon,
  HandIcon,
  PersonIcon,
  SearchIcon,
} from "../components/icons";
import { getUserConversations } from "../lib/api/conversations";
import { getValidAuthSession } from "../lib/auth/session";

type ChatItem = {
  id: string;
  name: string;
  preview: string;
  time: string;
  photoUrl: string;
};

export default function ChatScreen() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
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
        const nextConversations = await getUserConversations(session.user.id);

        if (!isMounted) return;

        setConversations(nextConversations);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  const chatItems = useMemo(
    () =>
      conversations
        .map((conversation) => toChatItem(conversation, currentUserId))
        .filter((item) =>
          item.name.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    [conversations, currentUserId, query],
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="mx-auto w-full max-w-[430px] flex-1 bg-white px-5 pt-8">
        <Text className="font-jakarta-bold text-[24px] text-[#171819]">
          Chat
        </Text>

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
            <Text className="font-jakarta text-[13px] text-[#777873]">
              Loading chats...
            </Text>
          ) : chatItems.length === 0 ? (
            <Text className="font-jakarta text-[13px] text-[#777873]">
              No chats found.
            </Text>
          ) : (
            chatItems.map((item) => <ChatRow key={item.id} item={item} />)
          )}
        </ScrollView>

        <View className="h-[62px] flex-row items-center justify-around border-t border-[#F1F1F1] bg-white">
          <TabItem icon="card" label="Explore" onPress={() => router.push("/home")} />
          <TabItem icon="hand" label="Matches" onPress={() => router.push("/matches")} />
          <TabItem icon="chat" label="Chat" active />
          <TabItem icon="person" label="Profile" onPress={() => router.push("/profile")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ChatRow({ item }: { item: ChatItem }) {
  return (
    <Pressable className="h-[64px] flex-row items-center" accessibilityRole="button">
      <View className="h-12 w-12 overflow-hidden rounded-full bg-[#F1F1F1]">
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

      <View className="ml-3 flex-1">
        <Text
          className="font-jakarta-bold text-[16px] text-[#171819]"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          className="mt-1 font-jakarta text-[13px] text-[#8D8D8D]"
          numberOfLines={1}
        >
          {item.preview}
        </Text>
      </View>

      <Text className="ml-2 self-start pt-2 font-jakarta text-[12px] text-[#777873]">
        {item.time}
      </Text>
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

function toChatItem(
  conversation: ConversationDto,
  currentUserId: number | null,
): ChatItem {
  const participantIds = conversation.participantIds ?? conversation.participants;
  const otherUserId = participantIds.find((id) => id !== currentUserId);

  return {
    id: conversation.id,
    name: conversation.name || (otherUserId ? `BeeFriend ${otherUserId}` : "BeeFriend"),
    preview: conversation.lastMessagePreview || "Say hi and start a conversation.",
    time: formatChatTime(conversation.updatedAt),
    photoUrl: "",
  };
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
