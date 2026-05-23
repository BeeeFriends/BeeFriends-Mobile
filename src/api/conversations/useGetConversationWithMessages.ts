import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getConversationWithMessages } from "@/api/conversations/getConversationWithMessages";

export function useGetConversationWithMessages(conversationId?: string) {
  return useQuery({
    enabled: Boolean(conversationId),
    queryKey: [QUERY_KEYS.CONVERSATIONS, "detail", conversationId],
    queryFn: () => getConversationWithMessages(conversationId as string),
  });
}
