import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { swipeUser, type SwipeUserPayload } from "@/api/matches/swipeUser";

export function useMutationSwipeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SwipeUserPayload) => swipeUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATCHES] });
    },
  });
}
