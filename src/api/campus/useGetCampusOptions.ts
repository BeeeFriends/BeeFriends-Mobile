import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getCampusOptions } from "@/api/campus/getCampusOptions";

export function useGetCampusOptions() {
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPUS_OPTIONS],
    queryFn: getCampusOptions,
  });
}
