import assert from "node:assert/strict";
import { test } from "node:test";

import { checkLink, mayOpenOutside, readNotice, staysInChat } from "../src/policy";

const GOOD = "https://madeeasy.example.com/chat/SUPPORT#code=abc123";

test("a good link gives its origin", () => {
  assert.deepEqual(checkLink(GOOD), { url: GOOD, origin: "https://madeeasy.example.com" });
});

test("http is refused, except to this computer while developing", () => {
  assert.throws(() => checkLink("http://madeeasy.example.com/chat/SUPPORT#code=abc"), /https/);
  assert.throws(() => checkLink("http://localhost:8000/chat/SUPPORT#code=abc"), /https/);
  assert.equal(checkLink("http://10.0.2.2:8000/chat/SUPPORT#code=abc", true).origin, "http://10.0.2.2:8000");
});

test("a link to another page, or without its code, is refused", () => {
  assert.throws(() => checkLink("https://madeeasy.example.com/login#code=abc"), /chat page/);
  assert.throws(() => checkLink("https://madeeasy.example.com/chat/SUPPORT"), /no code/);
  assert.throws(() => checkLink("not a link"), /web address/);
});

test("the web view stays on the chat's own address", () => {
  const origin = "https://madeeasy.example.com";
  assert.ok(staysInChat("https://madeeasy.example.com/chat/SUPPORT", origin));
  assert.ok(staysInChat("about:blank", origin));
  assert.ok(!staysInChat("https://evil.example/login", origin));
  assert.ok(!staysInChat("https://madeeasy.example.com.evil.example/", origin));
});

test("only web and email links leave for the phone's browser", () => {
  assert.ok(mayOpenOutside("https://docs.example.com/guide"));
  assert.ok(mayOpenOutside("mailto:help@example.com"));
  assert.ok(!mayOpenOutside("file:///etc/passwd"));
  assert.ok(!mayOpenOutside("intent://scan/#Intent;scheme=zxing;end"));
  assert.ok(!mayOpenOutside("javascript:alert(1)"));
});

test("the page can say three things only", () => {
  assert.equal(readNotice('{"type":"closed"}'), "closed");
  assert.equal(readNotice('{"type":"link_expired"}'), "link_expired");
  assert.equal(readNotice('{"type":"run_code"}'), null);
  assert.equal(readNotice("not json"), null);
});
