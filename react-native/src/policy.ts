/**
 * The package's security rules, kept apart from the view so they are tested on their own.
 *
 * - A link must be https (plain http only to this computer, while developing),
 *   to a MadeEasy chat page, carrying its single-use code after `#code=`.
 * - The web view stays on the link's own address: anything else opens in the
 *   phone's browser, outside the app.
 * - The page can tell the app three things only: closed, link_expired, unread.
 */

/** What the chat page may tell the app. */
export type ChatNotice = "closed" | "link_expired" | "unread";

const NOTICES: ReadonlySet<string> = new Set(["closed", "link_expired", "unread"]);
const LOCAL_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "10.0.2.2"]);

/** A checked chat link. */
export interface CheckedLink {
  /** The link as given. */
  url: string;
  /** Its address (scheme, host and port): the only one the web view may show. */
  origin: string;
}

/**
 * Check a link before it is opened.
 *
 * @param url - The link the app's server returned.
 * @param developing - Whether the app is a development build (allows http to this computer).
 * @returns The link and its origin.
 * @throws Error naming what is wrong (not https, not a chat page, no code).
 */
export function checkLink(url: string, developing = false): CheckedLink {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("MadeEasy chat: the link is not a web address.");
  }
  const local = parsed.protocol === "http:" && LOCAL_HOSTS.has(parsed.hostname);
  if (parsed.protocol !== "https:" && !(developing && local)) {
    throw new Error("MadeEasy chat: the link must start with https://.");
  }
  if (!/^\/chat\/[A-Za-z0-9_-]+\/?$/.test(parsed.pathname)) {
    throw new Error("MadeEasy chat: the link is not a MadeEasy chat page.");
  }
  if (!new URLSearchParams(parsed.hash.slice(1)).get("code")) {
    throw new Error("MadeEasy chat: the link has no code. Ask your server for a new link.");
  }
  return { url, origin: parsed.origin };
}

/**
 * Whether the web view may show an address (otherwise it opens in the phone's browser).
 *
 * @param url - The address the page wants to go to.
 * @param origin - The chat link's origin.
 * @returns True for the chat's own address (and the blank page web views start on).
 */
export function staysInChat(url: string, origin: string): boolean {
  if (url === "about:blank") return true;
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

/**
 * Whether an address may be handed to the phone's browser.
 *
 * @param url - The address.
 * @returns True for https and mailto links only (never app links or files).
 */
export function mayOpenOutside(url: string): boolean {
  try {
    return ["https:", "mailto:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * Read a message from the chat page.
 *
 * @param data - The message's text.
 * @returns The notice, or null for anything else.
 */
export function readNotice(data: string): ChatNotice | null {
  try {
    const type = (JSON.parse(data) as { type?: unknown }).type;
    return typeof type === "string" && NOTICES.has(type) ? (type as ChatNotice) : null;
  } catch {
    return null;
  }
}
