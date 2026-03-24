import { Tabs } from "expo-router";
import React from "react";
import { Platform, Text, View } from "react-native";

// Import Semua Icon Kustom Anda
import CompassIcon from "@/components/icons/navbar icons/CompassIcon";
import PersonIcon from "@/components/icons/navbar icons/PersonIcon";
import WavingHandIcon from "@/components/icons/navbar icons/WavingHandIcon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "transparent",
        tabBarInactiveTintColor: "transparent",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: Platform.OS === "ios" ? 90 : 75, // Sedikit lebih tinggi untuk kenyamanan
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          elevation: 0,
          paddingTop: 10,
        },
      }}
    >
      {/* 1. EXPLORE (Index) */}
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-center">
              <View
                className={`w-16 h-8 rounded-2xl items-center justify-center mb-1.5 ${focused ? "bg-primary-yellow/80" : "bg-transparent"}`}
              >
                <WavingHandIcon
                  width={28}
                  height={28}
                  className={focused ? "text-primary-black " : "text-inactive"}
                />
              </View>
              <Text
                className={`text-xs ${focused ? "text-primary-black font-jakarta-bold" : "text-inactive font-jakarta"}`}
              >
                Matches
              </Text>
            </View>
          ),
        }}
      />

      {/* 2. MATCHES */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-center">
              <View
                className={`w-16 h-8 rounded-2xl items-center justify-center mb-1.5 ${focused ? "bg-primary-yellow/80" : "bg-transparent"}`}
              >
                <CompassIcon
                  width={28}
                  height={28}
                  className={focused ? "text-primary-black" : "text-inactive"}
                />
              </View>
              <Text
                className={`text-xs ${focused ? "text-primary-black font-jakarta-bold" : "text-inactive font-jakarta"}`}
              >
                Explore
              </Text>
            </View>
          ),
        }}
      />

      {/* 3. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-center">
              <View
                className={`w-16 h-8 rounded-2xl items-center justify-center mb-1.5 ${focused ? "bg-primary-yellow/80" : "bg-transparent"}`}
              >
                <PersonIcon
                  width={28}
                  height={28}
                  className={focused ? "text-primary-black " : "text-inactive"}
                />
              </View>
              <Text
                className={`text-xs ${focused ? "text-primary-black font-jakarta-bold" : "text-inactive font-jakarta"}`}
              >
                Profile
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
