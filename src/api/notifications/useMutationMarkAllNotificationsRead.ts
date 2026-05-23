import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { markAllNotificationsRead } from "@/api/notifications/markAllNotificationsRead";

export function useMutationMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => markAllNotificationsRead(userId),
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATIONS, "list", userId],
      });
    },
  });
}
