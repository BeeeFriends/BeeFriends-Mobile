import { useMutation } from "@tanstack/react-query";

import { loginAccount } from "@/api/auth/loginAccount";

type LoginAccountPayload = {
  binusianEmail: string;
  password: string;
};

export function useMutationLoginAccount() {
  return useMutation({
    mutationFn: ({ binusianEmail, password }: LoginAccountPayload) =>
      loginAccount(binusianEmail, password),
  });
}
