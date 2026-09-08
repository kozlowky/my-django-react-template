import { GraphQLClient } from "graphql-request";
import { clearAccessToken, getAccessToken, setAccessToken } from "./auth";

// В v7 headers можно передать как функцию — вызывается перед каждым запросом
const client = new GraphQLClient(`${window.location.origin}/graphql/`, {
  credentials: "include",
  headers: () => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

// Один промис на весь рефреш
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const data = await client.request<{
        refreshToken: { __typename: string; accessToken?: string };
      }>(REFRESH_MUTATION);
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
    return await client.request<T>(document, variables);
  } catch (e: unknown) {
    // Strawberry возвращает PermissionDenied при IsAuthenticated
    const errors = (e as { response?: { errors?: { extensions?: { code?: string } }[] } })
      ?.response?.errors;
    const isUnauth = errors?.some((err) => err.extensions?.code === "PermissionDenied");
    if (isUnauth) {
      const ok = await tryRefresh();
      if (ok) return client.request<T>(document, variables);
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
