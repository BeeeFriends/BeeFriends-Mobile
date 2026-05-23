import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getUserConversations } from "@/api/conversations/getUserConversations";

export function useGetUserConversations(userId?: number) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: [QUERY_KEYS.CONVERSATIONS, "user", userId],
    queryFn: () => getUserConversations(userId as number),
  });
}
