import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { CardIcon, ChatIcon, HandIcon, PersonIcon } from "./icons";
import { useMainTabBackBehavior } from "../lib/navigation/back";

type BottomNavRoute = "home" | "matches" | "chat" | "profile";

type BottomNavProps = {
  active: BottomNavRoute;
  bordered?: boolean;
};

const NAV_HEIGHT_CLASS = "h-[62px]";
const ICON_SIZE = 27;

const TABS: Array<{
  route: BottomNavRoute;
  icon: "card" | "hand" | "chat" | "person";
  label: string;
  href: "/home" | "/matches" | "/chat" | "/profile";
}> = [
  { route: "home", icon: "card", label: "Explore", href: "/home" },
  { route: "matches", icon: "hand", label: "Matches", href: "/matches" },
  { route: "chat", icon: "chat", label: "Chat", href: "/chat" },
  { route: "profile", icon: "person", label: "Profile", href: "/profile" },
];

export function BottomNav({
  active,
  bordered = false,
}: BottomNavProps) {
  useMainTabBackBehavior(active);

  return (
    <View
      className={`${NAV_HEIGHT_CLASS} w-full flex-row items-center bg-white px-4 ${
        bordered ? "border-t border-[#F1F1F1]" : ""
      }`}
    >
      {TABS.map((tab) => (
        <BottomNavItem
          key={tab.route}
          active={active === tab.route}
          icon={tab.icon}
          label={tab.label}
          onPress={() => {
            if (active !== tab.route) router.replace(tab.href);
          }}
        />
      ))}
    </View>
  );
}

function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: "card" | "hand" | "chat" | "person";
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const activeProgress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeProgress, {
      toValue: active ? 1 : 0,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [active, activeProgress]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.94,
      damping: 16,
      stiffness: 260,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 16,
      stiffness: 260,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  };

  const color = active ? "#252D36" : "#777873";
  const pillOpacity = activeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const pillScale = activeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const iconTranslateY = activeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  return (
    <Pressable
      className="flex-1 items-center"
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        className="items-center"
        style={{ transform: [{ scale: pressScale }] }}
      >
        <View className="h-9 w-12 items-center justify-center">
          <Animated.View
            className="absolute h-8 w-11 rounded-full bg-[#FFEA00]"
            style={{
              opacity: pillOpacity,
              transform: [{ scaleX: pillScale }, { scaleY: pillScale }],
            }}
          />
          <Animated.View style={{ transform: [{ translateY: iconTranslateY }] }}>
            {icon === "card" && (
              <CardIcon
                color={color}
                fillColor={active ? "#FFEA00" : "#FFFFFF"}
                size={ICON_SIZE}
              />
            )}
            {icon === "hand" && (
              <HandIcon
                color={color}
                fillColor={active ? "#FFEA00" : undefined}
                size={ICON_SIZE}
              />
            )}
            {icon === "chat" && (
              <ChatIcon
                color={color}
                fillColor={active ? "#FFEA00" : "#FFFFFF"}
                size={ICON_SIZE}
              />
            )}
            {icon === "person" && (
              <PersonIcon
                color={color}
                fillColor={active ? "#FFEA00" : "#FFFFFF"}
                size={ICON_SIZE}
              />
            )}
          </Animated.View>
        </View>
        <Text
          className={`mt-[2px] text-[11px] leading-4 ${
            active
              ? "font-jakarta-bold text-[#252D36]"
              : "font-jakarta-semibold text-[#777873]"
          }`}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
