import { useCallback, useEffect, useRef } from "react";
import { getAccessToken } from "./auth";

export type LikesUpdateEvent = {
  type: "likes_update";
  post_id: string;
  likes_count: number;
  is_liked: boolean;
};

type WSMessage = LikesUpdateEvent | { type: "error"; message: string };

interface UsePostsWSOptions {
  onLikesUpdate: (e: LikesUpdateEvent) => void;
  enabled?: boolean;
}

export function usePostsWS({
  onLikesUpdate,
  enabled = true,
}: UsePostsWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onUpdateRef = useRef(onLikesUpdate);
  onUpdateRef.current = onLikesUpdate;
  const subsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://31.130.132.222";
    const proto = apiUrl.startsWith("https") ? "wss" : "ws";
    const host = apiUrl.replace(/^https?:\/\//, "");
    const token = getAccessToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    const url = `${proto}://${host}/ws/feed/${qs}`;

    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;

    function connect() {
      if (!active) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryDelay = 1000;
        subsRef.current.forEach((postId) => {
          ws.send(JSON.stringify({ action: "subscribe", post_id: postId }));
        });
      };
      ws.onmessage = (e) => {
        try {
          const msg: WSMessage = JSON.parse(e.data);
          if (msg.type === "likes_update") onUpdateRef.current(msg);
        } catch {
          /* ignore */
        }
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        wsRef.current = null;
        if (active) {
          retryTimer = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, 30_000);
            connect();
          }, retryDelay);
        }
      };
    }

    connect();
    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      const ws = wsRef.current;
      if (
        ws &&
        (ws.readyState === WebSocket.CONNECTING ||
          ws.readyState === WebSocket.OPEN)
      ) {
        wsRef.current = null;
        ws.close();
      }
    };
  }, [enabled]);

  const send = useCallback((data: object) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  }, []);

  const subscribe = useCallback(
    (id: string) => {
      subsRef.current.add(id);
      send({ action: "subscribe", post_id: id });
    },
    [send],
  );
  const unsubscribe = useCallback(
    (id: string) => {
      subsRef.current.delete(id);
      send({ action: "unsubscribe", post_id: id });
    },
    [send],
  );
  const likeViaWS = useCallback(
    (id: string) => send({ action: "like", post_id: id }),
    [send],
  );
  const unlikeViaWS = useCallback(
    (id: string) => send({ action: "unlike", post_id: id }),
    [send],
  );

  return { subscribe, unsubscribe, likeViaWS, unlikeViaWS };
}
