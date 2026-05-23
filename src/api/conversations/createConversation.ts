import { CONVERSATION_ENDPOINTS } from "@beefriends/shared-kernel";
import type {
  ConversationDto,
  CreateConversationDto,
} from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

export function createConversation(payload: CreateConversationDto) {
  return requestJson<ConversationDto>(CONVERSATION_ENDPOINTS.CREATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
