import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserDto } from "@beefriends/shared-kernel/types";

import { QUERY_KEYS } from "@/api/queryKeys";
import { updateCurrentUserProfile } from "@/api/users/updateCurrentUserProfile";

export function useMutationUpdateCurrentUserProfile(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserDto) =>
      updateCurrentUserProfile(accessToken, payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROFILE, "me", accessToken],
        profile,
      );
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    },
  });
}
