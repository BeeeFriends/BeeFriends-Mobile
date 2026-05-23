import { CONVERSATION_ENDPOINTS } from "@beefriends/shared-kernel";
import type { ConversationDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export function getUserConversations(userId: number) {
  return requestJson<ConversationDto[]>(CONVERSATION_ENDPOINTS.BY_USER(userId));
}
