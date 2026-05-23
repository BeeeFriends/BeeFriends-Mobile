import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getBatchPresence } from "@/api/presence/getBatchPresence";

export function useGetBatchPresence(userIds: number[]) {
  return useQuery({
    enabled: userIds.length > 0,
    queryKey: [QUERY_KEYS.PRESENCE, "batch", userIds],
    queryFn: () => getBatchPresence(userIds),
  });
}
