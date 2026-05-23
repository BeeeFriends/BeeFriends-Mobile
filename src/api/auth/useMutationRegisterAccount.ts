import { useMutation } from "@tanstack/react-query";

import { registerAccount, type RegisterAccountPayload } from "@/api/auth/registerAccount";

export function useMutationRegisterAccount() {
  return useMutation({
    mutationFn: (payload: RegisterAccountPayload) => registerAccount(payload),
  });
}
