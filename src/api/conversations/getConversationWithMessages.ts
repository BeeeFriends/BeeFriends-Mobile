import { CONVERSATION_ENDPOINTS } from "@beefriends/shared-kernel";
import type { ConversationWithMessagesDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export function getConversationWithMessages(conversationId: string) {
  return requestJson<ConversationWithMessagesDto>(
    CONVERSATION_ENDPOINTS.WITH_MESSAGES(conversationId),
  );
}
