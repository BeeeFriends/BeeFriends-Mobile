import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { markNotificationRead } from "@/api/notifications/markNotificationRead";

type MarkNotificationReadPayload = {
  id: string;
  userId: number;
};

export function useMutationMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: MarkNotificationReadPayload) =>
      markNotificationRead(id, userId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATIONS, "list", variables.userId],
      });
    },
  });
}
