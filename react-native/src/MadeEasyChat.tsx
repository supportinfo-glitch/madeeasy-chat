/**
 * The MadeEasy chat, full screen, inside a React Native app.
 *
 * Mount `<MadeEasyChatHost />` once near the root of the app, then open the
 * chat from anywhere with `MadeEasyChat.open({ getLink })`. `getLink` is the
 * app's own code: it asks the app's server for a single-use link (the server
 * asks MadeEasy with its API key). The app never holds a key or a lasting token.
 *
 * The web view is locked down: it shows only the link's own address (any other
 * link opens in the phone's browser), keeps nothing on the phone once closed,
 * has no access to the phone's files, and is debuggable only in development.
 * The page can tell the app only that it closed, that its link expired (a new
 * one is fetched), or that a reply is unread.
 */

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Modal, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";

import { checkLink, mayOpenOutside, readNotice, staysInChat, type ChatNotice, type CheckedLink } from "./policy";

/** How the app opens the chat. */
export interface OpenChatOptions {
  /** Asks the app's own server for a fresh single-use link. */
  getLink: () => Promise<string>;
  /** Called when the page says a reply is waiting (for a badge). */
  onUnread?: () => void;
}

/** The host's handle, kept by `MadeEasyChat` while a host is mounted. */
interface Host {
  open: (options: OpenChatOptions) => Promise<void>;
  close: () => void;
}

let mountedHost: Host | null = null;

/** The shortest gap between two link requests, so a failing page can't flood the app's server. */
const MIN_RELINK_MS = 3000;

/** Open and close the chat from anywhere in the app. */
export const MadeEasyChat = {
  /**
   * Open the chat full screen.
   *
   * @param options - How to get a link, and an optional unread callback.
   * @throws Error when no `<MadeEasyChatHost />` is mounted, or the link is not a MadeEasy chat link.
   */
  async open(options: OpenChatOptions): Promise<void> {
    if (!mountedHost) throw new Error("MadeEasy chat: mount <MadeEasyChatHost /> once near the root of your app.");
    await mountedHost.open(options);
  },
  /** Close the chat. */
  close(): void {
    mountedHost?.close();
  },
};

/**
 * The chat's full-screen view. Mount once near the root of the app.
 *
 * @returns The chat when open, otherwise nothing.
 */
export function MadeEasyChatHost() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<CheckedLink | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const options = useRef<OpenChatOptions | null>(null);
  const lastRequest = useRef(0);
  const developing = typeof __DEV__ !== "undefined" && __DEV__;

  async function fetchLink(): Promise<void> {
    const now = Date.now();
    if (!options.current || now - lastRequest.current < MIN_RELINK_MS) return;
    lastRequest.current = now;
    try {
      setFailure(null);
      setLink(checkLink(await options.current.getLink(), developing));
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "The chat could not be opened.");
    }
  }

  useEffect(() => {
    mountedHost = {
      open: async (next) => {
        options.current = next;
        lastRequest.current = 0;
        setLink(null);
        setOpen(true);
        await fetchLink();
      },
      close: () => close(),
    };
    return () => {
      mountedHost = null;
    };
  });

  function close() {
    setOpen(false);
    setLink(null);
    setFailure(null);
    options.current = null;
  }

  function onNotice(notice: ChatNotice) {
    if (notice === "closed") close();
    else if (notice === "link_expired") void fetchLink();
    else options.current?.onUnread?.();
  }

  function onNavigate(request: WebViewNavigation): boolean {
    if (!link || staysInChat(request.url, link.origin)) return true;
    if (mayOpenOutside(request.url)) void Linking.openURL(request.url);
    return false;
  }

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaView style={styles.fill}>
        {link ? (
          <WebView
            key={link.url}
            source={{ uri: link.url }}
            originWhitelist={[link.origin]}
            onShouldStartLoadWithRequest={onNavigate}
            onMessage={(event: WebViewMessageEvent) => {
              const notice = readNotice(event.nativeEvent.data);
              if (notice) onNotice(notice);
            }}
            javaScriptEnabled
            domStorageEnabled
            incognito
            cacheEnabled={false}
            sharedCookiesEnabled={false}
            thirdPartyCookiesEnabled={false}
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            mixedContentMode="never"
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            allowsBackForwardNavigationGestures={false}
            mediaPlaybackRequiresUserAction
            webviewDebuggingEnabled={developing}
            style={styles.fill}
          />
        ) : (
          <View style={styles.centre}>
            {failure ? <Text style={styles.failure}>{failure}</Text> : <ActivityIndicator />}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  failure: { textAlign: "center", fontSize: 15 },
});

declare const __DEV__: boolean | undefined;
