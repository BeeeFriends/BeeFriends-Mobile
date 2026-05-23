import type {
  MessageDto,
  MessageReadEvent,
  PresenceDto,
  TypingIndicatorEvent,
} from "@beefriends/shared-kernel/dto/chat";
import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/api";

const CHAT_EVENTS = {
  JOIN_CONVERSATION: "join_conversation",
  LEAVE_CONVERSATION: "leave_conversation",
  SEND_MESSAGE: "send_message",
  MESSAGE_RECEIVED: "message_received",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  MESSAGE_READ: "message_read",
  PRESENCE_CHANGED: "presence_changed",
  PRESENCE_GET: "presence_get",
} as const;

type PresenceChangedEvent = PresenceDto & {
  timestamp?: string;
};

type ServerToClientEvents = {
  [CHAT_EVENTS.MESSAGE_RECEIVED]: (message: MessageDto) => void;
  [CHAT_EVENTS.MESSAGE_READ]: (event: MessageReadEvent) => void;
  [CHAT_EVENTS.PRESENCE_CHANGED]: (event: PresenceChangedEvent) => void;
  [CHAT_EVENTS.TYPING_START]: (event: TypingIndicatorEvent) => void;
  [CHAT_EVENTS.TYPING_STOP]: (event: TypingIndicatorEvent) => void;
};

type ClientToServerEvents = {
  [CHAT_EVENTS.JOIN_CONVERSATION]: (data: {
    conversationId: string;
    userId: number;
  }) => void;
  [CHAT_EVENTS.LEAVE_CONVERSATION]: (data: {
    conversationId: string;
    userId: number;
  }) => void;
  [CHAT_EVENTS.MESSAGE_READ]: (event: MessageReadEvent) => void;
  [CHAT_EVENTS.TYPING_START]: (event: TypingIndicatorEvent) => void;
  [CHAT_EVENTS.TYPING_STOP]: (event: TypingIndicatorEvent) => void;
};

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;
let socketUserId: number | null = null;

export function getChatSocket(userId: number) {
  if (socket && socketUserId === userId) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket?.disconnect();
  socketUserId = userId;
  socket = io(API_BASE_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { userId },
    query: { userId: String(userId) },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  return socket;
}

export { CHAT_EVENTS };
