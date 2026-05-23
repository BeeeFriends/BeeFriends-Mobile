import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/api/queryKeys";
import { unmatchUser } from "@/api/matches/unmatchUser";

type UnmatchUserPayload = {
  matchId: string;
  userId: number;
};

export function useMutationUnmatchUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, userId }: UnmatchUserPayload) =>
      unmatchUser(matchId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MATCHES] });
    },
  });
}
