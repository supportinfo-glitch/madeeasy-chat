/// The package's security rules, kept apart from the view so they are tested on their own.
///
/// - A link must be https (plain http only to this computer, while developing),
///   to a MadeEasy chat page, carrying its single-use code after `#code=`.
/// - The web view stays on the link's own address: anything else opens in the
///   phone's browser, outside the app.
/// - The page can tell the app only that it closed or that its link expired.
library;

import 'dart:convert';

/// What the chat page may tell the app.
enum ChatNotice { closed, linkExpired, unread }

const _localHosts = {'localhost', '127.0.0.1', '10.0.2.2'};

/// A checked chat link: the link and the only address the web view may show.
class CheckedLink {
  /// Creates a checked link.
  const CheckedLink(this.url, this.origin);

  /// The link as given.
  final String url;

  /// Its scheme, host and port.
  final String origin;
}

/// Checks a link before it is opened.
///
/// Throws a [FormatException] naming what is wrong: not a web address, not
/// https, not a chat page, or no code.
CheckedLink checkLink(String url, {bool developing = false}) {
  final Uri parsed;
  try {
    parsed = Uri.parse(url);
  } on FormatException {
    throw const FormatException('MadeEasy chat: the link is not a web address.');
  }
  if (!parsed.hasScheme || parsed.host.isEmpty) {
    throw const FormatException('MadeEasy chat: the link is not a web address.');
  }
  final local = parsed.scheme == 'http' && _localHosts.contains(parsed.host);
  if (parsed.scheme != 'https' && !(developing && local)) {
    throw const FormatException('MadeEasy chat: the link must start with https://.');
  }
  if (!RegExp(r'^/chat/[A-Za-z0-9_-]+/?$').hasMatch(parsed.path)) {
    throw const FormatException('MadeEasy chat: the link is not a MadeEasy chat page.');
  }
  final code = Uri.splitQueryString(parsed.fragment)['code'];
  if (code == null || code.isEmpty) {
    throw const FormatException('MadeEasy chat: the link has no code. Ask your server for a new link.');
  }
  return CheckedLink(url, parsed.origin);
}

/// Whether the web view may show [url] (otherwise it opens in the phone's browser).
bool staysInChat(String url, String origin) {
  if (url == 'about:blank') return true;
  final parsed = Uri.tryParse(url);
  if (parsed == null || !parsed.hasScheme || parsed.host.isEmpty) return false;
  return parsed.origin == origin;
}

/// Whether [url] may be handed to the phone's browser: https and mailto only.
bool mayOpenOutside(String url) {
  final scheme = Uri.tryParse(url)?.scheme;
  return scheme == 'https' || scheme == 'mailto';
}

/// Reads a message from the chat page: the notice, or null for anything else.
ChatNotice? readNotice(String data) {
  Object? decoded;
  try {
    decoded = jsonDecode(data);
  } on FormatException {
    return null;
  }
  final type = decoded is Map ? decoded['type'] : null;
  return switch (type) {
    'closed' => ChatNotice.closed,
    'link_expired' => ChatNotice.linkExpired,
    'unread' => ChatNotice.unread,
    _ => null,
  };
}
