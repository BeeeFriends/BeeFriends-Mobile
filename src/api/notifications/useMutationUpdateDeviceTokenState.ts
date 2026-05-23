import { useMutation } from "@tanstack/react-query";

import { updateDeviceTokenState } from "@/api/notifications/updateDeviceTokenState";

type UpdateDeviceTokenStatePayload = {
  userId: number;
  token: string;
  isActive: boolean;
};

export function useMutationUpdateDeviceTokenState() {
  return useMutation({
    mutationFn: ({ userId, token, isActive }: UpdateDeviceTokenStatePayload) =>
      updateDeviceTokenState(userId, token, isActive),
  });
}
