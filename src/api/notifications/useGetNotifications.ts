import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getNotifications } from "@/api/notifications/getNotifications";

export function useGetNotifications(userId?: number) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: [QUERY_KEYS.NOTIFICATIONS, "list", userId],
    queryFn: () => getNotifications(userId as number),
  });
}
