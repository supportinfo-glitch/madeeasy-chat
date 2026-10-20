# MadeEasy chat for Flutter

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
flutter pub add madeeasy_chat
```

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

```dart
import 'package:madeeasy_chat/madeeasy_chat.dart';

// On your Help button:
await MadeEasyChat.open(context, getLink: () async {
  final res = await http.get(Uri.parse('https://your-server.example.com/support-chat-link')); // your endpoint
  return jsonDecode(res.body)['url'] as String;
});
```

If a link expires before it is used, the package asks `getLink` for a new one.

## Photos and files

The chat lets users attach photos and documents through the phone's own picker.

- **iOS** (`Info.plist`): `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`.
- **Android**: nothing extra for picking files.

## Security

- Only the chat's own address is shown; any other link opens in the phone's browser.
- Nothing is kept on the phone after the chat closes (cookies, cache and storage are cleared).
- The page reaches only files the user picks; debugging only in development builds.
- The page can tell your app only that it closed or that its link expired.
