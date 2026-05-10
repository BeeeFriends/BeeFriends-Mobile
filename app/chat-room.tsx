import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type {
  ConversationWithMessagesDto,
  MessageDto,
} from "@beefriends/shared-kernel/dto/chat";
import { ChatIcon } from "../components/icons";
import { SkeletonBlock } from "../components/SkeletonBlock";
import { ToastBanner, useToast } from "../components/ToastBanner";
import { API_BASE_URL } from "../lib/api/client";
import {
  getConversationWithMessages,
  markMessageRead,
  sendMessage,
} from "../lib/api/conversations";
import { getUserPresence } from "../lib/api/presence";
import { uploadChatAttachment } from "../lib/api/users";
import { getValidAuthSession } from "../lib/auth/session";
import { goBackOrReplace } from "../lib/navigation/back";
import { CHAT_EVENTS, getChatSocket } from "../lib/realtime/chatSocket";

const ANDROID_KEYBOARD_CLEARANCE = 50;

const emojiCategories = [
  {
    id: "recent",
    icon: "time-outline",
    label: "Recent",
    emojis: [
      "\uD83D\uDE0A",
      "\uD83D\uDE02",
      "\uD83D\uDE0D",
      "\uD83D\uDD25",
      "\uD83D\uDE4C",
      "\u2728",
      "\uD83D\uDC4B",
      "\uD83D\uDC4D",
      "\uD83E\uDD79",
      "\uD83D\uDC9B",
    ],
  },
  {
    id: "smileys",
    icon: "happy-outline",
    label: "Smileys",
    emojis: [
      "\uD83D\uDE00",
      "\uD83D\uDE03",
      "\uD83D\uDE04",
      "\uD83D\uDE01",
      "\uD83D\uDE06",
      "\uD83D\uDE05",
      "\uD83E\uDD23",
      "\uD83D\uDE02",
      "\uD83D\uDE42",
      "\uD83D\uDE09",
      "\uD83D\uDE0C",
      "\uD83D\uDE0D",
      "\uD83E\uDD70",
      "\uD83D\uDE18",
      "\uD83D\uDE0B",
      "\uD83D\uDE1C",
      "\uD83E\uDD2A",
      "\uD83E\uDD73",
      "\uD83E\uDD79",
      "\uD83D\uDE2D",
      "\uD83D\uDE24",
      "\uD83D\uDE31",
      "\uD83E\uDD14",
      "\uD83D\uDE34",
    ],
  },
  {
    id: "hands",
    icon: "hand-left-outline",
    label: "Hands",
    emojis: [
      "\uD83D\uDC4B",
      "\uD83E\uDD1A",
      "\uD83D\uDD90\uFE0F",
      "\u270B",
      "\uD83D\uDC4C",
      "\uD83E\uDD0C",
      "\uD83E\uDD1E",
      "\uD83E\uDEF0",
      "\uD83D\uDC4D",
      "\uD83D\uDC4E",
      "\uD83D\uDC4F",
      "\uD83D\uDE4C",
      "\uD83E\uDD32",
      "\uD83D\uDE4F",
      "\uD83D\uDCAA",
      "\uD83E\uDD1D",
    ],
  },
  {
    id: "hearts",
    icon: "heart-outline",
    label: "Love",
    emojis: [
      "\uD83D\uDC9B",
      "\u2764\uFE0F",
      "\uD83E\uDDE1",
      "\uD83D\uDC9A",
      "\uD83D\uDC99",
      "\uD83D\uDC9C",
      "\uD83D\uDDA4",
      "\uD83E\uDD0D",
      "\uD83D\uDC8C",
      "\uD83D\uDC98",
      "\uD83D\uDC9D",
      "\uD83D\uDC96",
      "\uD83D\uDC97",
      "\uD83D\uDC93",
      "\uD83D\uDC95",
      "\uD83D\uDC9E",
    ],
  },
  {
    id: "food",
    icon: "fast-food-outline",
    label: "Food",
    emojis: [
      "\u2615",
      "\uD83C\uDF75",
      "\uD83E\uDD64",
      "\uD83C\uDF70",
      "\uD83C\uDF55",
      "\uD83C\uDF54",
      "\uD83C\uDF5F",
      "\uD83C\uDF5C",
      "\uD83C\uDF63",
      "\uD83C\uDF66",
      "\uD83C\uDF6A",
      "\uD83C\uDF6B",
    ],
  },
  {
    id: "activity",
    icon: "football-outline",
    label: "Fun",
    emojis: [
      "\u26BD",
      "\uD83C\uDFC0",
      "\uD83C\uDFB5",
      "\uD83C\uDFA7",
      "\uD83C\uDFAE",
      "\uD83C\uDFAC",
      "\uD83D\uDCF8",
      "\uD83C\uDF89",
      "\uD83D\uDD25",
      "\u2728",
      "\uD83C\uDF1F",
      "\uD83D\uDCAF",
    ],
  },
] as const;

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    conversationId?: string;
    name?: string;
    participantId?: string;
    photoUrl?: string;
    profile?: string;
  }>();
  const messageListRef = useRef<FlatList<MessageDto>>(null);
  const composerRef = useRef<View>(null);
  const composerTranslateY = useRef(new Animated.Value(0)).current;
  const readReceiptsSentRef = useRef<Set<string>>(new Set());
  const isTypingRef = useRef(false);
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;
  const routeName = Array.isArray(params.name) ? params.name[0] : params.name;
  const routePhotoUrl = Array.isArray(params.photoUrl)
    ? params.photoUrl[0]
    : params.photoUrl;
  const participantIdParam = Array.isArray(params.participantId)
    ? params.participantId[0]
    : params.participantId;
  const participantId = participantIdParam ? Number(participantIdParam) : null;
  const routeProfile = Array.isArray(params.profile)
    ? params.profile[0]
    : params.profile;

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [conversation, setConversation] =
    useState<ConversationWithMessagesDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [messageText, setMessageText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [previewImageUri, setPreviewImageUri] = useState("");
  const [isEmojiTrayOpen, setIsEmojiTrayOpen] = useState(false);
  const [activeEmojiCategoryId, setActiveEmojiCategoryId] =
    useState<(typeof emojiCategories)[number]["id"]>("recent");
  const [isParticipantOnline, setIsParticipantOnline] = useState<
    boolean | null
  >(null);
  const [isParticipantTyping, setIsParticipantTyping] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadConversation() {
      const session = await getValidAuthSession();

      if (!session) {
        router.replace("/");
        return;
      }

      if (!conversationId) {
        goBackOrReplace("/chat");
        return;
      }

      setCurrentUserId(session.user.id);
      setAccessToken(session.access_token);

      try {
        const nextConversation =
          await getConversationWithMessages(conversationId);

        if (!isMounted) return;

        setConversation(nextConversation);
        setMessages(nextConversation.messages ?? []);
      } catch (error) {
        showToast({
          title: "Failed to open chat",
          message: getErrorMessage(error),
        });
        goBackOrReplace("/chat");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadConversation();

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  const refreshConversationMessages = useCallback(async () => {
    if (!conversationId) return;

    const nextConversation = await getConversationWithMessages(conversationId);
    setConversation(nextConversation);
    setMessages((currentMessages) =>
      mergeMessageLists(currentMessages, nextConversation.messages ?? []),
    );
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const socket = getChatSocket(currentUserId);
    const joinConversation = () => {
      socket.emit(CHAT_EVENTS.JOIN_CONVERSATION, {
        conversationId,
        userId: currentUserId,
      });
      void refreshConversationMessages().catch(() => undefined);
    };
    const handleMessageReceived = (message: MessageDto) => {
      if (message.conversationId !== conversationId) return;

      if (message.senderId !== currentUserId) {
        setIsParticipantTyping(false);
      }

      setMessages((currentMessages) =>
        mergeMessageList(currentMessages, message),
      );
      setConversation((currentConversation) =>
        currentConversation
          ? {
              ...currentConversation,
              lastMessageId: message.id,
              lastMessagePreview: getMessagePreview(message),
              lastMessageSenderId: message.senderId,
              lastMessage: message,
              updatedAt: message.updatedAt,
            }
          : currentConversation,
      );
    };
    const handlePresenceChanged = (presence: {
      userId: number;
      isOnline: boolean;
    }) => {
      if (participantId && presence.userId === participantId) {
        setIsParticipantOnline(presence.isOnline);
      }
    };
    const handleMessageRead = (event: {
      conversationId: string;
      messageId: string;
      userId: number;
    }) => {
      if (event.conversationId !== conversationId) return;

      setMessages((currentMessages) =>
        applyReadReceipt(currentMessages, event.messageId, event.userId),
      );
    };
    const handleTypingStart = (event: {
      conversationId: string;
      userId: number;
    }) => {
      if (event.conversationId !== conversationId) return;
      if (event.userId === currentUserId) return;
      if (participantId && event.userId !== participantId) return;

      setIsParticipantTyping(true);
      if (remoteTypingTimeoutRef.current) {
        clearTimeout(remoteTypingTimeoutRef.current);
      }
      remoteTypingTimeoutRef.current = setTimeout(() => {
        setIsParticipantTyping(false);
      }, 2500);
    };
    const handleTypingStop = (event: {
      conversationId: string;
      userId: number;
    }) => {
      if (event.conversationId !== conversationId) return;
      if (event.userId === currentUserId) return;
      if (participantId && event.userId !== participantId) return;

      setIsParticipantTyping(false);
      if (remoteTypingTimeoutRef.current) {
        clearTimeout(remoteTypingTimeoutRef.current);
        remoteTypingTimeoutRef.current = null;
      }
    };

    if (socket.connected) joinConversation();
    socket.on("connect", joinConversation);
    socket.on(CHAT_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    socket.on(CHAT_EVENTS.PRESENCE_CHANGED, handlePresenceChanged);
    socket.on(CHAT_EVENTS.MESSAGE_READ, handleMessageRead);
    socket.on(CHAT_EVENTS.TYPING_START, handleTypingStart);
    socket.on(CHAT_EVENTS.TYPING_STOP, handleTypingStop);

    return () => {
      socket.emit(CHAT_EVENTS.LEAVE_CONVERSATION, {
        conversationId,
        userId: currentUserId,
      });
      socket.emit(CHAT_EVENTS.TYPING_STOP, {
        conversationId,
        userId: currentUserId,
      });
      socket.off("connect", joinConversation);
      socket.off(CHAT_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      socket.off(CHAT_EVENTS.PRESENCE_CHANGED, handlePresenceChanged);
      socket.off(CHAT_EVENTS.MESSAGE_READ, handleMessageRead);
      socket.off(CHAT_EVENTS.TYPING_START, handleTypingStart);
      socket.off(CHAT_EVENTS.TYPING_STOP, handleTypingStop);
    };
  }, [
    conversationId,
    currentUserId,
    participantId,
    refreshConversationMessages,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadPresence() {
      if (!participantId || Number.isNaN(participantId)) return;

      try {
        const presence = await getUserPresence(participantId);

        if (!isMounted) return;

        setIsParticipantOnline(presence.isOnline);
      } catch {
        if (isMounted) setIsParticipantOnline(null);
      }
    }

    loadPresence();
    const intervalId = setInterval(loadPresence, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [participantId]);

  useEffect(() => {
    if (messages.length === 0) return;

    requestAnimationFrame(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  useEffect(() => {
    if (!isParticipantTyping) return;

    requestAnimationFrame(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    });
  }, [isParticipantTyping]);

  useEffect(() => {
    if (!conversationId || !currentUserId || isLoading) return;

    const intervalId = setInterval(() => {
      void refreshConversationMessages().catch(() => undefined);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [conversationId, currentUserId, isLoading, refreshConversationMessages]);

  useEffect(() => {
    if (!conversationId || !currentUserId || messages.length === 0) return;

    const unreadMessageIds = messages
      .filter(
        (message) =>
          message.senderId !== currentUserId &&
          !message.readBy?.includes(currentUserId) &&
          !readReceiptsSentRef.current.has(message.id),
      )
      .map((message) => message.id);

    if (unreadMessageIds.length === 0) return;

    const socket = getChatSocket(currentUserId);

    unreadMessageIds.forEach((messageId) => {
      readReceiptsSentRef.current.add(messageId);
      socket.emit(CHAT_EVENTS.MESSAGE_READ, {
        conversationId,
        messageId,
        userId: currentUserId,
      });
      markMessageRead(conversationId, messageId, currentUserId).catch(() => {
        readReceiptsSentRef.current.delete(messageId);
      });
    });

    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        unreadMessageIds.includes(message.id)
          ? {
              ...message,
              readBy: Array.from(
                new Set([...(message.readBy ?? []), currentUserId]),
              ),
            }
          : message,
      ),
    );
  }, [conversationId, currentUserId, messages]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const animateComposer = (offset: number, duration?: number) => {
      Animated.timing(composerTranslateY, {
        toValue: -offset,
        duration: duration && duration > 0 ? duration : 220,
        useNativeDriver: true,
      }).start();
    };

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      Keyboard.scheduleLayoutAnimation?.(event);
      setIsKeyboardOpen(true);
      setIsEmojiTrayOpen(false);

      if (Platform.OS === "android") {
        requestAnimationFrame(() => {
          const keyboardHeight = Math.max(0, event.endCoordinates.height ?? 0);

          if (!composerRef.current) {
            setKeyboardInset(keyboardHeight);
            animateComposer(keyboardHeight, event.duration);
            messageListRef.current?.scrollToEnd({ animated: true });
            return;
          }

          composerRef.current?.measureInWindow((_, composerY, __, height) => {
            const keyboardTop = Math.max(
              0,
              event.endCoordinates.screenY - ANDROID_KEYBOARD_CLEARANCE,
            );
            const composerBottom = composerY + height;
            const overlap = Math.max(0, composerBottom - keyboardTop);
            const nextInset = keyboardHeight
              ? Math.min(overlap, keyboardHeight + ANDROID_KEYBOARD_CLEARANCE)
              : overlap;

            setKeyboardInset(nextInset);
            animateComposer(nextInset, event.duration);
            messageListRef.current?.scrollToEnd({ animated: true });
          });
        });
        return;
      }

      setKeyboardInset(0);
      animateComposer(0, event.duration);
      requestAnimationFrame(() => {
        messageListRef.current?.scrollToEnd({ animated: true });
      });
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      Keyboard.scheduleLayoutAnimation?.(event);
      setIsKeyboardOpen(false);
      setKeyboardInset(0);
      animateComposer(0, event.duration);
      setTimeout(() => {
        messageListRef.current?.scrollToEnd({ animated: false });
      }, 80);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [composerTranslateY]);

  const title = useMemo(
    () => routeName || conversation?.name || "Chat",
    [conversation?.name, routeName],
  );
  const headerPhotoUrl = normalizeAttachmentUri(routePhotoUrl || "");
  const activeEmojiCategory =
    emojiCategories.find((category) => category.id === activeEmojiCategoryId) ??
    emojiCategories[0];
  const composerBottomPadding = isKeyboardOpen
    ? 8
    : Math.max(insets.bottom, 16);
  const participantStatus = isParticipantTyping
    ? "Typing..."
    : isParticipantOnline
      ? "Online"
      : "Offline";

  const emitTypingStop = useCallback(() => {
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }

    if (!conversationId || !currentUserId || !isTypingRef.current) return;

    isTypingRef.current = false;
    getChatSocket(currentUserId).emit(CHAT_EVENTS.TYPING_STOP, {
      conversationId,
      userId: currentUserId,
    });
  }, [conversationId, currentUserId]);

  const emitTypingStart = useCallback(() => {
    if (!conversationId || !currentUserId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      getChatSocket(currentUserId).emit(CHAT_EVENTS.TYPING_START, {
        conversationId,
        userId: currentUserId,
      });
    }

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }
    typingStopTimeoutRef.current = setTimeout(emitTypingStop, 1300);
  }, [conversationId, currentUserId, emitTypingStop]);

  const handleMessageTextChange = (text: string) => {
    setMessageText(text);

    if (text.trim()) {
      emitTypingStart();
      return;
    }

    emitTypingStop();
  };

  useEffect(
    () => () => {
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
      }
      if (remoteTypingTimeoutRef.current) {
        clearTimeout(remoteTypingTimeoutRef.current);
      }
      emitTypingStop();
    },
    [emitTypingStop],
  );

  const handleSend = async () => {
    const content = messageText.trim();

    if (
      !conversationId ||
      !currentUserId ||
      (selectedImageUri && !accessToken) ||
      (!content && !selectedImageUri) ||
      isSending
    ) {
      return;
    }

    setIsSending(true);
    emitTypingStop();

    try {
      const nextMessage = await sendMessage(
        {
          conversationId,
          content: content || "Photo",
          attachmentUrls: selectedImageUri
            ? [(await uploadChatAttachment(accessToken, selectedImageUri)).url]
            : undefined,
        },
        currentUserId,
      );

      setMessages((currentMessages) =>
        mergeMessageList(currentMessages, nextMessage),
      );
      setMessageText("");
      setSelectedImageUri("");
      setIsEmojiTrayOpen(false);
    } catch (error) {
      showToast({
        title: "Failed to send message",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSending(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showToast({
        title: "Photo access needed",
        message: "Please allow photo access to send images.",
        kind: "info",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled) return;

    setSelectedImageUri(result.assets[0]?.uri ?? "");
  };

  const addEmoji = (emoji: string) => {
    setMessageText((currentText) => {
      const nextText = `${currentText}${emoji}`;
      if (nextText.trim()) emitTypingStart();
      return nextText;
    });
  };

  const toggleEmojiTray = () => {
    Keyboard.dismiss();
    setIsEmojiTrayOpen((isOpen) => !isOpen);
  };

  const openProfileDetail = (profilePayload?: string) => {
    if (!profilePayload) return;

    router.push({
      pathname: "/profile-detail" as never,
      params: { profile: profilePayload },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ToastBanner toast={toast} onDismiss={hideToast} />
      <KeyboardAvoidingView
        className="mx-auto w-full max-w-[430px] flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="h-[72px] flex-row items-center border-b border-[#F1F1F1] bg-white px-4">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]"
            accessibilityRole="button"
            onPress={() => goBackOrReplace("/chat")}
          >
            <Ionicons name="chevron-back" size={22} color="#171819" />
          </Pressable>

          <Pressable
            className="ml-3 h-11 w-11"
            accessibilityRole="button"
            disabled={!routeProfile}
            onPress={() => openProfileDetail(routeProfile)}
          >
            <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#FFF7B8]">
              {headerPhotoUrl ? (
                <Image
                  source={{ uri: headerPhotoUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-jakarta-bold text-[16px] text-[#171819]">
                  {getInitial(title)}
                </Text>
              )}
            </View>
            <View
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                isParticipantOnline ? "bg-[#21C45D]" : "bg-[#C9C9C9]"
              }`}
            />
          </Pressable>

          <Pressable
            className="ml-3 flex-1 justify-center"
            accessibilityRole="button"
            disabled={!routeProfile}
            onPress={() => openProfileDetail(routeProfile)}
          >
            <View className="flex-row items-center">
              <Text
                className="max-w-[210px] font-jakarta-bold text-[17px] text-[#171819]"
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
            <View className="mt-[3px] flex-row items-center">
              <Text
                className={`font-jakarta text-[11px] ${
                  isParticipantTyping ? "text-[#2F80ED]" : "text-[#777873]"
                }`}
              >
                {participantStatus}
              </Text>
            </View>
          </Pressable>
        </View>

        {isLoading ? (
          <ChatRoomSkeleton />
        ) : messages.length === 0 ? (
          <ChatRoomEmptyState />
        ) : (
          <FlatList
            ref={messageListRef}
            data={messages}
            keyExtractor={(message) => message.id}
            className="flex-1 bg-[#FAFAFA] px-4"
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom:
                Platform.OS === "android" && isKeyboardOpen
                  ? keyboardInset + 12
                  : isKeyboardOpen
                    ? 12
                    : 20,
            }}
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              messageListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              messageListRef.current?.scrollToEnd({ animated: false })
            }
            ListHeaderComponent={
              <View className="mb-5 self-center rounded-full bg-white px-3 py-1 shadow-sm">
                <Text className="font-jakarta-semibold text-[11px] text-[#777873]">
                  Today
                </Text>
              </View>
            }
            ListFooterComponent={
              isParticipantTyping ? <TypingIndicatorBubble /> : null
            }
            renderItem={({ item: message }) => (
              <MessageBubble
                message={message}
                isMine={message.senderId === currentUserId}
                participantId={participantId}
                onPreviewImage={setPreviewImageUri}
              />
            )}
          />
        )}

        <Animated.View
          ref={composerRef}
          className="border-t border-[#F1F1F1] bg-white px-4 pt-3"
          style={[
            { paddingBottom: composerBottomPadding },
            Platform.OS === "android"
              ? { transform: [{ translateY: composerTranslateY }] }
              : null,
          ]}
        >
          {selectedImageUri ? (
            <View className="mb-3 flex-row items-center rounded-3xl bg-[#F7F7F7] p-2">
              <View className="overflow-hidden rounded-2xl bg-[#F1F1F1]">
                <Image
                  source={{ uri: selectedImageUri }}
                  className="h-16 w-16"
                  resizeMode="cover"
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-jakarta-bold text-[13px] text-[#171819]">
                  Image ready
                </Text>
                <Text className="mt-1 font-jakarta text-[11px] text-[#777873]">
                  Add a message or send it now.
                </Text>
              </View>
              <Pressable
                className="h-9 w-9 items-center justify-center rounded-full bg-white"
                accessibilityRole="button"
                onPress={() => setSelectedImageUri("")}
              >
                <Ionicons name="close" size={17} color="#171819" />
              </Pressable>
            </View>
          ) : null}

          {isEmojiTrayOpen ? (
            <EmojiPanel
              activeCategoryId={activeEmojiCategoryId}
              activeEmojis={activeEmojiCategory.emojis}
              onSelectCategory={setActiveEmojiCategoryId}
              onSelectEmoji={addEmoji}
            />
          ) : null}

          <View className="flex-row items-end">
            <Pressable
              className="mr-2 h-11 w-11 items-center justify-center rounded-full bg-[#F5F5F5]"
              accessibilityRole="button"
              accessibilityLabel="Add image"
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={21} color="#171819" />
            </Pressable>

            <Pressable
              className={`mr-2 h-11 w-11 items-center justify-center rounded-full ${
                isEmojiTrayOpen ? "bg-[#FFE036]" : "bg-[#F5F5F5]"
              }`}
              accessibilityRole="button"
              accessibilityLabel="Open emoji picker"
              onPress={toggleEmojiTray}
            >
              <Ionicons name="happy-outline" size={20} color="#171819" />
            </Pressable>

            <View className="min-h-11 flex-1 flex-row items-end rounded-[22px] bg-[#F5F5F5] px-3 py-1">
              <TextInput
                value={messageText}
                multiline
                scrollEnabled
                placeholder="Message"
                placeholderTextColor="#8D8D8D"
                className="max-h-28 flex-1 px-1 py-2 font-jakarta text-[14px] leading-5 text-[#171819]"
                textAlignVertical={
                  messageText.includes("\n") ? "top" : "center"
                }
                onFocus={() => {
                  setIsEmojiTrayOpen(false);
                  requestAnimationFrame(() => {
                    messageListRef.current?.scrollToEnd({ animated: true });
                  });
                }}
                onChangeText={handleMessageTextChange}
              />
            </View>

            <Pressable
              className={`ml-2 h-11 w-11 items-center justify-center rounded-full ${
                (messageText.trim() || selectedImageUri) && !isSending
                  ? "bg-[#171819]"
                  : "bg-[#D9D9D9]"
              }`}
              accessibilityRole="button"
              disabled={(!messageText.trim() && !selectedImageUri) || isSending}
              onPress={handleSend}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
      <ImagePreviewModal
        uri={previewImageUri}
        onClose={() => setPreviewImageUri("")}
      />
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  isMine,
  participantId,
  onPreviewImage,
}: {
  message: MessageDto;
  isMine: boolean;
  participantId: number | null;
  onPreviewImage: (uri: string) => void;
}) {
  const attachmentUrls = message.attachmentUrls ?? [];
  const textContent =
    attachmentUrls.length > 0 && message.content === "Photo"
      ? ""
      : message.content;

  return (
    <View className={`mb-3 ${isMine ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[80%] overflow-hidden rounded-[22px] ${
          isMine ? "rounded-br-md bg-[#171819]" : "rounded-bl-md bg-white"
        }`}
      >
        {textContent ? (
          <Text
            className={`px-4 py-3 font-jakarta text-[14px] leading-5 ${
              isMine ? "text-white" : "text-[#171819]"
            }`}
          >
            {textContent}
          </Text>
        ) : null}
        {attachmentUrls.length ? (
          <View className={textContent ? "px-2 pb-2" : "p-1"}>
            {attachmentUrls.map((attachmentUrl) => (
              <AttachmentImage
                key={attachmentUrl}
                uri={normalizeAttachmentUri(attachmentUrl)}
                onPress={onPreviewImage}
              />
            ))}
          </View>
        ) : null}
      </View>
      <MessageMeta
        isMine={isMine}
        isRead={Boolean(
          participantId && message.readBy?.includes(participantId),
        )}
        time={formatMessageTime(message.timestamp || message.createdAt)}
      />
    </View>
  );
}

function AttachmentImage({
  uri,
  onPress,
}: {
  uri: string;
  onPress: (uri: string) => void;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !uri) {
    return (
      <View className="h-56 w-56 items-center justify-center rounded-[18px] bg-[#F1F1F1]">
        <Ionicons name="image-outline" size={34} color="#777873" />
        <Text className="mt-2 font-jakarta-semibold text-[12px] text-[#777873]">
          Image unavailable
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel="Preview image"
      onPress={() => onPress(uri)}
    >
      <Image
        source={{ uri }}
        className="h-56 w-56 rounded-[18px]"
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    </Pressable>
  );
}

function TypingIndicatorBubble() {
  return (
    <View className="mb-3 items-start">
      <View className="flex-row items-center rounded-[22px] rounded-bl-md bg-white px-4 py-3">
        <TypingDot delayClass="opacity-40" />
        <TypingDot delayClass="opacity-70" />
        <TypingDot delayClass="opacity-100" />
        <Text className="ml-2 font-jakarta-semibold text-[11px] text-[#777873]">
          typing
        </Text>
      </View>
    </View>
  );
}

function TypingDot({ delayClass }: { delayClass: string }) {
  return (
    <View
      className={`mr-1 h-1.5 w-1.5 rounded-full bg-[#777873] ${delayClass}`}
    />
  );
}

function ImagePreviewModal({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={Boolean(uri)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/90">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-end px-5 pt-2">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
              accessibilityRole="button"
              accessibilityLabel="Close image preview"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center px-4 pb-12">
            {uri ? (
              <Image
                source={{ uri }}
                className="h-full w-full"
                resizeMode="contain"
              />
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function MessageMeta({
  isMine,
  isRead,
  time,
}: {
  isMine: boolean;
  isRead: boolean;
  time: string;
}) {
  return (
    <View className="mt-1 flex-row items-center px-1">
      <Text className="font-jakarta text-[10px] text-[#9A9A9A]">{time}</Text>
      {isMine ? (
        <View className="ml-2 flex-row items-center">
          <Ionicons
            name={isRead ? "checkmark-done" : "checkmark"}
            size={13}
            color={isRead ? "#2F80ED" : "#9A9A9A"}
          />
          <Text
            className={`ml-1 font-jakarta text-[10px] ${
              isRead ? "text-[#2F80ED]" : "text-[#9A9A9A]"
            }`}
          >
            {isRead ? "Read" : "Sent"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function EmojiPanel({
  activeCategoryId,
  activeEmojis,
  onSelectCategory,
  onSelectEmoji,
}: {
  activeCategoryId: (typeof emojiCategories)[number]["id"];
  activeEmojis: readonly string[];
  onSelectCategory: (
    categoryId: (typeof emojiCategories)[number]["id"],
  ) => void;
  onSelectEmoji: (emoji: string) => void;
}) {
  return (
    <View className="mb-3 overflow-hidden rounded-[26px] bg-[#F7F7F7]">
      <View className="border-b border-[#ECECEC] px-3 py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row gap-2">
            {emojiCategories.map((category) => {
              const isActive = category.id === activeCategoryId;

              return (
                <Pressable
                  key={category.id}
                  className={`h-10 min-w-10 flex-row items-center justify-center rounded-full px-3 ${
                    isActive ? "bg-[#FFE036]" : "bg-white"
                  }`}
                  accessibilityRole="button"
                  onPress={() => onSelectCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={isActive ? "#171819" : "#777873"}
                  />
                  {isActive ? (
                    <Text className="ml-2 font-jakarta-bold text-[12px] text-[#171819]">
                      {category.label}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="max-h-[238px]"
        contentContainerClassName="flex-row flex-wrap px-3 pb-4 pt-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeEmojis.map((emoji, index) => (
          <Pressable
            key={`${emoji}-${index}`}
            className="h-12 w-[12.5%] items-center justify-center"
            accessibilityRole="button"
            onPress={() => onSelectEmoji(emoji)}
          >
            <Text className="text-[26px]">{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function normalizeAttachmentUri(uri: string) {
  if (!uri) return "";

  if (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("data:")
  ) {
    return uri;
  }

  if (uri.startsWith("/")) {
    return `${API_BASE_URL}${uri}`;
  }

  return uri;
}

function mergeMessageList(
  currentMessages: MessageDto[],
  nextMessage: MessageDto,
) {
  const existingMessage = currentMessages.find(
    (message) => message.id === nextMessage.id,
  );

  const mergedMessages = existingMessage
    ? currentMessages.map((message) =>
        message.id === nextMessage.id
          ? {
              ...message,
              ...nextMessage,
              readBy: Array.from(
                new Set([
                  ...(message.readBy ?? []),
                  ...(nextMessage.readBy ?? []),
                ]),
              ),
            }
          : message,
      )
    : [...currentMessages, nextMessage];

  return mergedMessages.sort(
    (firstMessage, secondMessage) =>
      getMessageTime(firstMessage) - getMessageTime(secondMessage),
  );
}

function mergeMessageLists(
  currentMessages: MessageDto[],
  nextMessages: MessageDto[],
) {
  return nextMessages.reduce(
    (mergedMessages, nextMessage) =>
      mergeMessageList(mergedMessages, nextMessage),
    currentMessages,
  );
}

function applyReadReceipt(
  currentMessages: MessageDto[],
  messageId: string,
  userId: number,
) {
  return currentMessages.map((message) => {
    if (message.id !== messageId || message.readBy?.includes(userId)) {
      return message;
    }

    return {
      ...message,
      readBy: [...(message.readBy ?? []), userId],
    };
  });
}

function getMessagePreview(message: MessageDto) {
  if (message.attachmentUrls?.length && message.content === "Photo") {
    return "Photo";
  }

  return message.content.length > 120
    ? `${message.content.slice(0, 117)}...`
    : message.content;
}

function getMessageTime(message: MessageDto) {
  const value = message.timestamp || message.createdAt;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "B";
}

function ChatRoomEmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF7B8]">
        <ChatIcon color="#252D36" fillColor="#FFEA00" size={34} />
      </View>
      <Text className="mt-5 text-center font-jakarta-bold text-[22px] leading-7 text-[#171819]">
        Start the chat
      </Text>
      <Text className="mt-2 text-center font-jakarta text-[13px] leading-5 text-[#777873]">
        Send the first message and keep the match warm.
      </Text>
    </View>
  );
}

function ChatRoomSkeleton() {
  return (
    <View className="flex-1 px-5 pt-5">
      <SkeletonBlock className="h-10 w-[58%] rounded-3xl" />
      <SkeletonBlock className="ml-auto mt-4 h-12 w-[72%] rounded-3xl" />
      <SkeletonBlock className="mt-4 h-12 w-[66%] rounded-3xl" />
      <SkeletonBlock className="ml-auto mt-4 h-10 w-[46%] rounded-3xl" />
    </View>
  );
}

function formatMessageTime(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
