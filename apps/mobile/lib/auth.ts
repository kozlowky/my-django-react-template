// Token lives in memory only.
// On app restart, SplashScreen calls refreshSession() which uses the
// HttpOnly refresh cookie — React Native's fetch preserves cookies
// across sessions on both iOS and Android automatically.

let _token: string | null = null;

export function getAccessToken(): string | null {
  return _token;
}

export function setAccessToken(token: string): void {
  _token = token;
}

export function clearAccessToken(): void {
  _token = null;
}
