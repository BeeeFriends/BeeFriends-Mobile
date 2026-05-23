import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getUserMatches } from "@/api/matches/getUserMatches";

export function useGetUserMatches(userId?: number) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: [QUERY_KEYS.MATCHES, "user", userId],
    queryFn: () => getUserMatches(userId as number),
  });
}
