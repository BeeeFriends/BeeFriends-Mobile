import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { getNotificationSettings } from "@/api/notifications/getNotificationSettings";

export function useGetNotificationSettings(userId?: number) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS, userId],
    queryFn: () => getNotificationSettings(userId as number),
  });
}
