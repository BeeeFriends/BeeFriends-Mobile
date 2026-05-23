import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getUserProfileById } from "@/api/users/getUserProfileById";

export function useGetUserProfileById(accessToken: string, userId?: number) {
  return useQuery({
    enabled: Boolean(accessToken && userId),
    queryKey: [QUERY_KEYS.PROFILE, "user", userId, accessToken],
    queryFn: () => getUserProfileById(accessToken, userId as number),
  });
}
