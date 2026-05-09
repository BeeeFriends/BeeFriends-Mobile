import {
  CONVERSATION_ENDPOINTS,
  MESSAGE_ENDPOINTS,
} from "@beefriends/shared-kernel";
import type {
  ConversationDto,
  ConversationWithMessagesDto,
  CreateConversationDto,
  CreateMessageDto,
  MessageDto,
} from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "./client";

export function getUserConversations(userId: number) {
  return requestJson<ConversationDto[]>(CONVERSATION_ENDPOINTS.BY_USER(userId));
}

export function createConversation(payload: CreateConversationDto) {
  return requestJson<ConversationDto>(CONVERSATION_ENDPOINTS.CREATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function getConversationWithMessages(conversationId: string) {
  return requestJson<ConversationWithMessagesDto>(
    CONVERSATION_ENDPOINTS.WITH_MESSAGES(conversationId),
  );
}

export function sendMessage(payload: CreateMessageDto, senderId: number) {
  const query = new URLSearchParams({
    senderId: String(senderId),
  });

  return requestJson<MessageDto>(`${MESSAGE_ENDPOINTS.SEND}?${query.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function markMessageRead(
  conversationId: string,
  messageId: string,
  userId: number,
) {
  const query = new URLSearchParams({
    conversationId,
    userId: String(userId),
  });

  return requestJson<MessageDto>(
    `${MESSAGE_ENDPOINTS.SEND}/${messageId}/read?${query.toString()}`,
    {
      method: "POST",
    },
  );
}
