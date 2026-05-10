# BeeFriends Mobile

BeeFriends mobile app for Binusian social discovery, matching, realtime chat, profile management, and push notifications.

---

## Features

- **Explore** - browse recommended Binusian profiles and view detailed profile cards
- **Matches** - see mutual matches and open conversations from matched users
- **Chat** - realtime conversations with images, typing indicators, read receipts, and presence
- **Notifications** - in-app notifications and push notification registration
- **Profile** - view and update profile details, interests, photos, and account settings
- **Settings** - notification preferences, account screen, and session controls

---

## Tech Stack

| Layer | Stack |
| ----- | ----- |
| App | Expo, React Native, TypeScript |
| Navigation | Expo Router |
| Styling | NativeWind, Tailwind CSS |
| Auth | Firebase Auth, BeeFriends JWT session |
| Realtime | Socket.IO client |
| Push | Expo Notifications, Firebase Cloud Messaging device token |
| Contracts | `@beefriends/shared-kernel` |

---

## Architecture

```txt
BeeFriends Mobile
  -> BeeFriends API Gateway
    -> User Service
    -> Match Chat Service
    -> Notification Service
```

Realtime chat connects to the same gateway domain through Socket.IO.

---

## API Base URL

| Environment | URL |
| ----------- | --- |
| Production | `https://beefriends-be.drian.my.id` |

The API base URL is configured in `lib/api/client.ts`.

---

## Environment Variables

Create the Expo environment values needed by `lib/firebase/client.ts`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Android push notifications also require `google-services.json` in the project root.

---

## Getting Started

```bash
npm install
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run start` | Start Expo dev server |
| `npm run android` | Build and run Android app |
| `npm run ios` | Build and run iOS app |
| `npm run web` | Start Expo web |
| `npm run typecheck` | Run TypeScript check |

---

## Notes

- Android is configured with `softwareKeyboardLayoutMode: resize` for chat keyboard behavior.
- Shared API paths and DTO types should come from `@beefriends/shared-kernel` instead of being copied manually.
