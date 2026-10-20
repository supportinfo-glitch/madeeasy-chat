/**
 * An example app: a Help button that opens a MadeEasy chat with the package.
 *
 * The link comes from a server (here, `example/server.mjs`), never from a key in
 * the app. Set EXPO_PUBLIC_LINK_ENDPOINT to that server's link address.
 */
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MadeEasyChat, MadeEasyChatHost } from "@agenticauto/madeeasy-chat";

const LINK_ENDPOINT = process.env.EXPO_PUBLIC_LINK_ENDPOINT ?? "";

/** Ask this app's server for a fresh single-use chat link. */
async function getLink(): Promise<string> {
  const res = await fetch(LINK_ENDPOINT);
  if (!res.ok) throw new Error(`The link server answered ${res.status}.`);
  return ((await res.json()) as { url: string }).url;
}

export default function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Greenleaf (example app)</Text>
      <Text style={styles.body}>Your orders, deliveries and returns.</Text>
      <Pressable style={styles.button} onPress={() => void MadeEasyChat.open({ getLink })}>
        <Text style={styles.buttonText}>Chat with support</Text>
      </Pressable>
      <MadeEasyChatHost />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  body: { fontSize: 15, color: "#555" },
  button: { marginTop: 16, backgroundColor: "#0f8a5f", borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
