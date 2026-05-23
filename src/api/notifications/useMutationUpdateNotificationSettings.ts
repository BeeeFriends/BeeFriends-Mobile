import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateNotificationSettingsPayload } from "@beefriends/shared-kernel/dto/notification";

import { QUERY_KEYS } from "@/api/queryKeys";
import { updateNotificationSettings } from "@/api/notifications/updateNotificationSettings";

type UpdateNotificationSettingsMutationPayload = {
  userId: number;
  payload: UpdateNotificationSettingsPayload;
};

export function useMutationUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: UpdateNotificationSettingsMutationPayload) =>
      updateNotificationSettings(userId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS, variables.userId],
      });
    },
  });
}
