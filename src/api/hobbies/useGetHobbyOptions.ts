import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getHobbyOptions } from "@/api/hobbies/getHobbyOptions";

export function useGetHobbyOptions() {
  return useQuery({
    queryKey: [QUERY_KEYS.HOBBY_OPTIONS],
    queryFn: getHobbyOptions,
  });
}
