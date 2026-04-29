import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthResponseDto } from "@beefriends/shared-kernel/types";

const AUTH_SESSION_KEY = "beefriends.auth.session";

export async function saveAuthSession(session: AuthResponseDto) {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function getAuthSession() {
  const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as AuthResponseDto;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
}
