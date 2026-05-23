import { MESSAGE_ENDPOINTS } from "@beefriends/shared-kernel";
import type { MessageDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

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
