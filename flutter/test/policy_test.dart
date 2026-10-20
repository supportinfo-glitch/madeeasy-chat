import 'package:flutter_test/flutter_test.dart';
import 'package:madeeasy_chat/src/policy.dart';

const good = 'https://madeeasy.example.com/chat/SUPPORT#code=abc123';

void main() {
  test('a good link gives its origin', () {
    expect(checkLink(good).origin, 'https://madeeasy.example.com');
  });

  test('http is refused, except to this computer while developing', () {
    expect(() => checkLink('http://madeeasy.example.com/chat/SUPPORT#code=abc'), throwsFormatException);
    expect(() => checkLink('http://localhost:8000/chat/SUPPORT#code=abc'), throwsFormatException);
    expect(checkLink('http://10.0.2.2:8000/chat/SUPPORT#code=abc', developing: true).origin, 'http://10.0.2.2:8000');
  });

  test('a link to another page, or without its code, is refused', () {
    expect(() => checkLink('https://madeeasy.example.com/login#code=abc'), throwsFormatException);
    expect(() => checkLink('https://madeeasy.example.com/chat/SUPPORT'), throwsFormatException);
    expect(() => checkLink('not a link'), throwsFormatException);
  });

  test('the web view stays on the chat\'s own address', () {
    const origin = 'https://madeeasy.example.com';
    expect(staysInChat('https://madeeasy.example.com/chat/SUPPORT', origin), isTrue);
    expect(staysInChat('about:blank', origin), isTrue);
    expect(staysInChat('https://evil.example/login', origin), isFalse);
    expect(staysInChat('https://madeeasy.example.com.evil.example/', origin), isFalse);
  });

  test('only web and email links leave for the phone\'s browser', () {
    expect(mayOpenOutside('https://docs.example.com/guide'), isTrue);
    expect(mayOpenOutside('mailto:help@example.com'), isTrue);
    expect(mayOpenOutside('file:///etc/passwd'), isFalse);
    expect(mayOpenOutside('intent://scan/#Intent;scheme=zxing;end'), isFalse);
    expect(mayOpenOutside('javascript:alert(1)'), isFalse);
  });

  test('the page can say three things only', () {
    expect(readNotice('{"type":"closed"}'), ChatNotice.closed);
    expect(readNotice('{"type":"link_expired"}'), ChatNotice.linkExpired);
    expect(readNotice('{"type":"run_code"}'), isNull);
    expect(readNotice('not json'), isNull);
  });
}
