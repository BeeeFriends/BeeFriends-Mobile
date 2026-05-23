import { useMutation } from "@tanstack/react-query";

import { registerDeviceToken } from "@/api/notifications/registerDeviceToken";

type RegisterDeviceTokenPayload = {
  userId: number;
  token: string;
};

export function useMutationRegisterDeviceToken() {
  return useMutation({
    mutationFn: ({ userId, token }: RegisterDeviceTokenPayload) =>
      registerDeviceToken(userId, token),
  });
}
