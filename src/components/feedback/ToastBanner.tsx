import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

type ToastKind = "error" | "success" | "info";

export type ToastState = {
  id: number;
  title: string;
  message?: string;
  kind: ToastKind;
};

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    ({
      title,
      message,
      kind = "error",
    }: {
      title: string;
      message?: string;
      kind?: ToastKind;
    }) => {
      setToast({
        id: Date.now(),
        title,
        message,
        kind,
      });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}

export function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastState | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;

    const timeoutId = setTimeout(onDismiss, 3600);

    return () => clearTimeout(timeoutId);
  }, [onDismiss, toast]);

  if (!toast) return null;

  const accentClassName =
    toast.kind === "success"
      ? "bg-[#21C45D]"
      : toast.kind === "info"
        ? "bg-[#7AE4F0]"
        : "bg-[#FF4D4D]";

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 top-0 z-50 px-4 pt-3">
      <Pressable
        className="mx-auto w-full max-w-[398px] overflow-hidden rounded-2xl bg-[#262626] shadow-lg"
        accessibilityRole="button"
        onPress={onDismiss}
      >
        <View className={`h-1 w-full ${accentClassName}`} />
        <View className="px-4 py-3">
          <Text className="font-jakarta-bold text-[14px] text-white">
            {toast.title}
          </Text>
          {toast.message ? (
            <Text className="mt-1 font-jakarta text-[12px] leading-4 text-white/80">
              {toast.message}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
