import { clearAccessToken, getAccessToken, setAccessToken } from "./auth";

// Set EXPO_PUBLIC_API_URL in .env.local to point at your backend
const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://31.130.132.222";
console.log("🌐 API BASE:", BASE);
const ENDPOINT = `${BASE}/graphql/`;

async function fetchGql<T>(
  document: string,
  variables?: Record<string, unknown>,
  authToken?: string | null,
): Promise<T> {
  const token = authToken !== undefined ? authToken : getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ query: document, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    const err: any = new Error(json.errors[0]?.message ?? "GraphQL error");
    err.response = { errors: json.errors };
    throw err;
  }
  return json.data as T;
}

// Single-flight refresh
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const data = await fetchGql<{
        refreshToken: { __typename: string; accessToken?: string };
      }>(REFRESH_MUTATION, undefined, null);
      if (data.refreshToken.__typename === "RefreshTokenSuccess") {
        setAccessToken(data.refreshToken.accessToken!);
        return true;
      }
      clearAccessToken();
      return false;
    } catch {
      clearAccessToken();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function gql<T>(
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  try {
    return await fetchGql<T>(document, variables);
  } catch (e: any) {
    const errors = e?.response?.errors as
      | { message?: string; extensions?: { code?: string } }[]
      | undefined;

    const isUnauth = errors?.some(
      (err) =>
        err.extensions?.code === "PermissionDenied" ||
        err.message === "Authentication required.",
    );

    if (isUnauth) {
      const ok = await tryRefresh();
      if (ok) {
        try {
          return await fetchGql<T>(document, variables);
        } catch (retryErr: any) {
          clearAccessToken();
          throw retryErr;
        }
      }
      clearAccessToken();
    }
    throw e;
  }
}

const REFRESH_MUTATION = /* GraphQL */ `
  mutation RefreshToken {
    refreshToken {
      __typename
      ... on RefreshTokenSuccess { accessToken }
      ... on RefreshTokenError   { message }
    }
  }
`;
