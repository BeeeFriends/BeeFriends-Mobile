import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getMajorOptions } from "@/api/majors/getMajorOptions";

export function useGetMajorOptions() {
  return useQuery({
    queryKey: [QUERY_KEYS.MAJOR_OPTIONS],
    queryFn: getMajorOptions,
  });
}
