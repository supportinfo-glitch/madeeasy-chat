# MadeEasy chat for React Native

Open a MadeEasy chat inside your iPhone or Android app, signed in as your user.

## How it works

1. Your **server** asks MadeEasy for a single-use chat link for the signed-in
   user, with an API key that has the **Open the chat in your app**
   (`chat_links`) permission. The key stays on your server.
2. Your **app** gets that link from your server and opens it with this package.
3. The link works **once** and only for a few minutes. The chat it opens is tied
   to that one user and conversation.

Nothing secret is stored in your app.

## Install

```sh
npm install @agenticauto/madeeasy-chat react-native-webview
cd ios && pod install
```

With Expo: `npx expo install react-native-webview`, then `npm install @agenticauto/madeeasy-chat`.

## Your server

```http
POST https://YOUR-MADEEASY-ADDRESS/api/processes/YOUR_PROCESS/chat-links
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{ "user_id": "cust_4821", "user_name": "Ada", "reference": "cust_4821" }
```

The answer is `{ "url": "https://…/chat/YOUR_PROCESS#code=…", "expires_at": "…" }`.
Give the `url` to your app. `reference` is optional: send your own id for the
user to continue their conversation next time; leave it out to start a new one.

## Your app

```tsx
import { MadeEasyChat, MadeEasyChatHost } from "@agenticauto/madeeasy-chat";

export default function App() {
  return (
    <>
      <YourApp />
      <MadeEasyChatHost />
    </>
  );
}

// On your Help button:
await MadeEasyChat.open({
  getLink: async () => {
    // Your own endpoint, called as the signed-in user (however your app signs in to your server).
    const res = await fetch("https://your-server.example.com/support-chat-link", {
      headers: { Authorization: `Bearer ${yourUserSessionToken}` },
    });
    return (await res.json()).url;
  },
});
```

If a link expires before it is used, the package asks `getLink` for a new one.
The chat has its own close button; the package closes the screen when it is tapped.

The full setup guide, including your server's endpoint in Node.js and Python and
every error message, is in MadeEasy's help guide under "Chat in your mobile app".

## Photos and files

The chat lets users attach photos and documents. Add the usual permissions:

- **iOS** (`Info.plist`): `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`.
- **Android** (`AndroidManifest.xml`): `android.permission.CAMERA` if you allow
  taking a photo.

## Security

- Only the chat's own address is shown; any other link opens in the phone's browser.
- Nothing is kept on the phone after the chat closes (a private web view).
- No access to the phone's files; debugging only in development builds.
- The page can tell your app only that it closed or that its link expired.
