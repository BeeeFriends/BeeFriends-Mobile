import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getUserPresence } from "@/api/presence/getUserPresence";

export function useGetUserPresence(userId?: number) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: [QUERY_KEYS.PRESENCE, "user", userId],
    queryFn: () => getUserPresence(userId as number),
  });
}
