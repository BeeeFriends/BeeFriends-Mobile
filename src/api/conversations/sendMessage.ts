import { MESSAGE_ENDPOINTS } from "@beefriends/shared-kernel";
import type { CreateMessageDto, MessageDto } from "@beefriends/shared-kernel/dto/chat";

import { requestJson } from "@/api/client";

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
