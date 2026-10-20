// The example's "client server": it holds the API key and asks MadeEasy for a chat link.
//
//   MADEEASY_URL=https://staging.example.com MADEEASY_PROCESS=SUPPORT \
//   MADEEASY_KEY_FILE=/path/to/key LINK_SECRET=random node server.mjs
//
// Serves GET /link/<LINK_SECRET> → { url }. The secret in the path stands in for
// a real app's signed-in user check; never run this without one.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const { MADEEASY_URL, MADEEASY_PROCESS, MADEEASY_KEY_FILE, LINK_SECRET, PORT = "8787" } = process.env;
if (!MADEEASY_URL || !MADEEASY_PROCESS || !MADEEASY_KEY_FILE || !LINK_SECRET || LINK_SECRET.length < 24) {
  throw new Error("Set MADEEASY_URL, MADEEASY_PROCESS, MADEEASY_KEY_FILE and a LINK_SECRET of 24+ characters.");
}
const key = readFileSync(MADEEASY_KEY_FILE, "utf8").trim();

createServer(async (req, res) => {
  if (req.method !== "GET" || req.url !== `/link/${LINK_SECRET}`) {
    res.writeHead(404).end();
    return;
  }
  const answer = await fetch(`${MADEEASY_URL}/api/processes/${MADEEASY_PROCESS}/chat-links`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: "expo-example-user", user_name: "Ada", reference: "expo-example-user" }),
  });
  const body = await answer.json();
  console.log(new Date().toISOString(), "link requested:", answer.status);
  res.writeHead(answer.ok ? 200 : 502, { "Content-Type": "application/json" });
  res.end(JSON.stringify(answer.ok ? { url: body.url } : { error: body.detail ?? "refused" }));
}).listen(Number(PORT), () => console.log(`link server on :${PORT}`));
