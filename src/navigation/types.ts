export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Matches: undefined;
  Chat: undefined;
  ChatRoom:
    | {
        conversationId?: string;
        name?: string;
        participantId?: string;
        photoUrl?: string;
        profile?: string;
      }
    | undefined;
  Settings: undefined;
  Account: undefined;
  NotificationSettings: undefined;
  Notifications: undefined;
  Profile: undefined;
  ProfileDetail:
    | {
        profile?: string;
      }
    | undefined;
  EditProfile: undefined;
};

export type AppRouteName = keyof RootStackParamList;
