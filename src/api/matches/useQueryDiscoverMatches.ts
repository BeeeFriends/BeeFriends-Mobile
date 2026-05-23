import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import {
  discoverMatches,
  type DiscoverMatchesParams,
} from "@/api/matches/discoverMatches";

export function useQueryDiscoverMatches(params: DiscoverMatchesParams) {
  return useQuery({
    enabled: Boolean(params.userId),
    queryKey: [QUERY_KEYS.MATCHES, "discover", params],
    queryFn: () => discoverMatches(params),
  });
}
