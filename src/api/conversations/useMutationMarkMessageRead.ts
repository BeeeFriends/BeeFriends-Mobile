import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { markMessageRead } from "@/api/conversations/markMessageRead";

type MarkMessageReadPayload = {
  conversationId: string;
  messageId: string;
  userId: number;
};

export function useMutationMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, messageId, userId }: MarkMessageReadPayload) =>
      markMessageRead(conversationId, messageId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS],
      });
    },
  });
}
