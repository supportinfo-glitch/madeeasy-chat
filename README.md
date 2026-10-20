# MadeEasy chat packages

Open a MadeEasy chat inside your iPhone or Android app, signed in as your user by
a single-use link from your server.

| Framework | Package | Folder |
|---|---|---|
| React Native | [`@agenticauto/madeeasy-chat`](https://www.npmjs.com/package/@agenticauto/madeeasy-chat) | [react-native](react-native) |
| Flutter | [`madeeasy_chat`](https://pub.dev/packages/madeeasy_chat) | [flutter](flutter) |

Each package's README explains the setup. In short:

1. Your server asks MadeEasy for a chat link with an API key that has the
   **Open the chat in your app** permission. The key stays on your server.
2. Your app opens the link with the package. The link works once, for a few
   minutes, for that one user.

The packages are thin: the chat itself is MadeEasy's page, shown in a locked-down
web view, so fixes to the chat reach your users without an app update.

## Reporting a security issue

Email support.info@agenticauto.net. Please don't open a public issue for it.
