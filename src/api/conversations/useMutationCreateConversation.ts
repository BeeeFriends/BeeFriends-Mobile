import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateConversationDto } from "@beefriends/shared-kernel/dto/chat";

import { QUERY_KEYS } from "@/api/queryKeys";
import { createConversation } from "@/api/conversations/createConversation";

export function useMutationCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConversationDto) => createConversation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS],
      });
    },
  });
}
