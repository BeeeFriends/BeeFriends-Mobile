import { requestJson } from "@/api/client";

import { NOTIFICATIONS_BASE } from "./constants";

export async function updateDeviceTokenState(
  userId: number,
  token: string,
  isActive: boolean,
) {
  return requestJson(`${NOTIFICATIONS_BASE}/device-tokens/state`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      token,
      isActive,
    }),
  });
}
