import { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { getNotifications } from "../api/notifications";
import { getValidAuthSession } from "../auth/session";

const REFRESH_INTERVAL_MS = 7000;

let unreadCount = 0;
let refreshPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return unreadCount;
}

export function setUnreadNotificationCount(nextCount: number) {
  const normalizedCount = Math.max(0, nextCount);
  if (normalizedCount === unreadCount) return;

  unreadCount = normalizedCount;
  emitChange();
}

export async function refreshUnreadNotificationCount(userId?: number) {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const resolvedUserId =
      userId ?? (await getValidAuthSession().then((session) => session?.user.id));

    if (!resolvedUserId) {
      setUnreadNotificationCount(0);
      return;
    }

    const notifications = await getNotifications(resolvedUserId);
    setUnreadNotificationCount(
      notifications.filter((notification) => !notification.isRead).length,
    );
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export function useUnreadNotificationCount() {
  const count = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    let isDisposed = false;

    const refresh = () => {
      if (isDisposed) return;
      void refreshUnreadNotificationCount().catch(() => undefined);
    };

    refresh();
    const intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      isDisposed = true;
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  return count;
}
