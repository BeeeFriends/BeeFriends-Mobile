import {
  createNavigationContainerRef,
  StackActions,
  useRoute,
} from "@react-navigation/native";

import { resolvePathRoute } from "./routes";
import type { AppRouteName, RootStackParamList } from "./types";

type ExpoLikeHref =
  | string
  | {
      pathname: string;
      params?: Record<string, unknown>;
    };

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const pendingActions: Array<() => void> = [];

export function useLocalSearchParams<T extends Record<string, unknown>>() {
  return (useRoute().params ?? {}) as Partial<T>;
}

function normalizeHref(href: ExpoLikeHref) {
  if (typeof href === "string") {
    return resolvePathRoute(href);
  }

  const route = resolvePathRoute(href.pathname);
  return {
    ...route,
    params: href.params as RootStackParamList[AppRouteName],
  };
}

function runWhenReady(callback: () => void) {
  if (navigationRef.isReady()) {
    callback();
    return;
  }

  pendingActions.push(callback);
}

export function flushPendingNavigation() {
  while (navigationRef.isReady() && pendingActions.length > 0) {
    pendingActions.shift()?.();
  }
}

export const router = {
  back() {
    runWhenReady(() => navigationRef.goBack());
  },

  canGoBack() {
    return navigationRef.isReady() && navigationRef.canGoBack();
  },

  push(href: ExpoLikeHref) {
    runWhenReady(() => {
      const route = normalizeHref(href);
      navigationRef.dispatch(StackActions.push(route.name, route.params));
    });
  },

  replace(href: ExpoLikeHref) {
    runWhenReady(() => {
      const route = normalizeHref(href);
      navigationRef.dispatch(StackActions.replace(route.name, route.params));
    });
  },
};
