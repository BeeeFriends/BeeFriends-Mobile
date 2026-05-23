import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getCurrentUserProfile } from "@/api/users/getCurrentUserProfile";

export function useGetCurrentUserProfile(accessToken: string) {
  return useQuery({
    enabled: Boolean(accessToken),
    queryKey: [QUERY_KEYS.PROFILE, "me", accessToken],
    queryFn: () => getCurrentUserProfile(accessToken),
  });
}
