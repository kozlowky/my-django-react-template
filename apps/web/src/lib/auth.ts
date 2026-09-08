// Access token живёт только в памяти.
// При перезагрузке страницы сбрасывается —
// SplashScreen восстанавливает его через /api/auth/token/refresh/ (HttpOnly cookie).

let _accessToken: string | null = null;

export function setAccessToken(token: string) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function clearAccessToken() {
  _accessToken = null;
}
