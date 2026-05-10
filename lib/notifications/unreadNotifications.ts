import { useCallback, useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import type { NotificationItemDto } from "@beefriends/shared-kernel/dto/notification";
import { getNotifications } from "../api/notifications";
import { getValidAuthSession } from "../auth/session";

const REFRESH_INTERVAL_MS = 4000;

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

export function isNotificationUnread(notification: NotificationItemDto) {
  const value = notification.isRead as unknown;

  if (value === false || value === 0 || value === "false") return true;
  if (value === true || value === 1 || value === "true") return false;

  return !Boolean(value);
}

export function countUnreadNotifications(
  notifications: NotificationItemDto[],
) {
  return notifications.filter(isNotificationUnread).length;
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
    setUnreadNotificationCount(countUnreadNotifications(notifications));
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export function useUnreadNotificationCount() {
  const count = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(() => {
    void refreshUnreadNotificationCount().catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    let isDisposed = false;

    const refreshIfActive = () => {
      if (isDisposed) return;
      refresh();
    };

    refreshIfActive();
    const intervalId = setInterval(refreshIfActive, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshIfActive();
    });

    return () => {
      isDisposed = true;
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [refresh]);

  return count;
}
