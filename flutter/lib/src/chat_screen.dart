/// The MadeEasy chat, full screen, inside a Flutter app.
library;

import 'dart:async';

import 'package:file_selector/file_selector.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

import 'policy.dart';

/// Asks the app's own server for a fresh single-use chat link.
typedef GetChatLink = Future<String> Function();

/// Opens the MadeEasy chat.
///
/// ```dart
/// await MadeEasyChat.open(context, getLink: () => myServer.madeEasyChatLink());
/// ```
///
/// [GetChatLink] is the app's own code: it asks the app's server, which asks
/// MadeEasy with its API key. The app never holds a key or a lasting token.
abstract final class MadeEasyChat {
  /// The shortest gap between two link requests, so a failing page can't flood the app's server.
  static const minRelink = Duration(seconds: 3);

  /// Opens the chat full screen; completes when the user closes it.
  static Future<void> open(BuildContext context, {required GetChatLink getLink}) {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(fullscreenDialog: true, builder: (_) => MadeEasyChatScreen(getLink: getLink)),
    );
  }
}

/// The chat's full-screen view: a locked-down web view showing only the chat.
///
/// Only the link's own address is shown (any other link opens in the phone's
/// browser), nothing is kept once it closes, the page can't reach the phone's
/// files except those the user picks, and it is debuggable only in development.
class MadeEasyChatScreen extends StatefulWidget {
  /// Creates the screen.
  const MadeEasyChatScreen({super.key, required this.getLink});

  /// Asks the app's server for a link.
  final GetChatLink getLink;

  @override
  State<MadeEasyChatScreen> createState() => _MadeEasyChatScreenState();
}

class _MadeEasyChatScreenState extends State<MadeEasyChatScreen> {
  WebViewController? _controller;
  CheckedLink? _link;
  String? _failure;
  DateTime? _lastRequest;

  @override
  void initState() {
    super.initState();
    unawaited(_load());
  }

  Future<void> _load() async {
    final now = DateTime.now();
    if (_lastRequest != null && now.difference(_lastRequest!) < MadeEasyChat.minRelink) return;
    _lastRequest = now;
    try {
      final link = checkLink(await widget.getLink(), developing: kDebugMode);
      final controller = _newController(link);
      await controller.loadRequest(Uri.parse(link.url));
      if (!mounted) return;
      setState(() {
        _link = link;
        _controller = controller;
        _failure = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _failure = error is FormatException ? error.message : 'The chat could not be opened.');
    }
  }

  WebViewController _newController(CheckedLink link) {
    final params = WebViewPlatform.instance is WebKitWebViewPlatform
        ? WebKitWebViewControllerCreationParams(allowsInlineMediaPlayback: true)
        : const PlatformWebViewControllerCreationParams();
    final controller = WebViewController.fromPlatformCreationParams(params)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('MadeEasyChat', onMessageReceived: (message) => _onNotice(readNotice(message.message)))
      ..setNavigationDelegate(NavigationDelegate(onNavigationRequest: (request) => _onNavigate(request.url, link)));
    final platform = controller.platform;
    if (platform is AndroidWebViewController) {
      unawaited(AndroidWebViewController.enableDebugging(kDebugMode));
      unawaited(platform.setAllowFileAccess(false));
      unawaited(platform.setMediaPlaybackRequiresUserGesture(true));
      unawaited(platform.setOnShowFileSelector(_pickFiles));
    } else if (platform is WebKitWebViewController) {
      unawaited(platform.setInspectable(kDebugMode));
    }
    return controller;
  }

  NavigationDecision _onNavigate(String url, CheckedLink link) {
    if (staysInChat(url, link.origin)) return NavigationDecision.navigate;
    if (mayOpenOutside(url)) unawaited(launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication));
    return NavigationDecision.prevent;
  }

  void _onNotice(ChatNotice? notice) {
    switch (notice) {
      case ChatNotice.closed:
        if (mounted) Navigator.of(context).maybePop();
      case ChatNotice.linkExpired:
        unawaited(_load());
      case ChatNotice.unread:
      case null:
        break;
    }
  }

  /// Android asks the app to pick files for the page's attach button: only what the user picks.
  Future<List<String>> _pickFiles(FileSelectorParams params) async {
    final files = params.mode == FileSelectorMode.openMultiple ? await openFiles() : [await openFile()];
    return [
      for (final file in files)
        if (file != null) Uri.file(file.path).toString(),
    ];
  }

  @override
  void dispose() {
    // Nothing of the chat stays on the phone once it closes.
    final controller = _controller;
    if (controller != null) {
      unawaited(controller.clearCache());
      unawaited(controller.clearLocalStorage());
    }
    unawaited(WebViewCookieManager().clearCookies());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    return Scaffold(
      body: SafeArea(
        child: controller != null && _link != null
            ? WebViewWidget(controller: controller)
            : Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: _failure == null
                      ? const CircularProgressIndicator()
                      : Text(_failure!, textAlign: TextAlign.center),
                ),
              ),
      ),
    );
  }
}
