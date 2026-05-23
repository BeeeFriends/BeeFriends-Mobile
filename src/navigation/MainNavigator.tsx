import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {
  AccountScreen,
  ChatRoomScreen,
  ChatScreen,
  EditProfileScreen,
  HomeScreen,
  LoginScreen,
  MatchesScreen,
  NotificationSettingsScreen,
  NotificationsScreen,
  OnboardingScreen,
  ProfileDetailScreen,
  ProfileScreen,
  RegisterScreen,
  SettingsScreen,
} from "@/screens";

import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
