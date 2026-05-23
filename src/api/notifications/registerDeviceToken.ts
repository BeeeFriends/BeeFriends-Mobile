import { Platform } from "react-native";

import { requestJson } from "@/api/client";

import { NOTIFICATIONS_BASE } from "./constants";

export async function registerDeviceToken(userId: number, token: string) {
  return requestJson(`${NOTIFICATIONS_BASE}/device-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    }),
  });
}
