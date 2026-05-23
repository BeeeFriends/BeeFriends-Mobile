import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateMessageDto } from "@beefriends/shared-kernel/dto/chat";

import { QUERY_KEYS } from "@/api/queryKeys";
import { sendMessage } from "@/api/conversations/sendMessage";

type SendMessagePayload = {
  payload: CreateMessageDto;
  senderId: number;
};

export function useMutationSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, senderId }: SendMessagePayload) =>
      sendMessage(payload, senderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS],
      });
    },
  });
}
