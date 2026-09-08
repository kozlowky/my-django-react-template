/**
 * Single WebSocket connection for the feed.
 * Handles real-time like updates via Django Channels.
 */
import { useEffect, useRef, useCallback } from "react";
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

export function usePostsWS({ onLikesUpdate, enabled = true }: UsePostsWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onUpdateRef = useRef(onLikesUpdate);
  onUpdateRef.current = onLikesUpdate;

  // Track which post ids are currently subscribed so we can re-subscribe
  // after reconnect or when WS opens after CONNECTING state.
  const subsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    const url = `${proto}://${window.location.host}/ws/feed/${qs}`;

    let active = true;         // flipped to false on cleanup
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;

    function connect() {
      if (!active) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryDelay = 1000; // reset backoff on success
        // Re-subscribe to every post that was subscribed when WS was down.
        // This covers: initial CONNECTING→OPEN transition, StrictMode remount,
        // and any subsequent reconnect after disconnect.
        subsRef.current.forEach((postId) => {
          ws.send(JSON.stringify({ action: "subscribe", post_id: postId }));
        });
      };

      ws.onmessage = (e) => {
        try {
          const msg: WSMessage = JSON.parse(e.data);
          if (msg.type === "likes_update") onUpdateRef.current(msg);
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        // onerror is followed by onclose — handle reconnect there
      };

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
      if (ws) {
        wsRef.current = null;
        // Only close if not already closing/closed
        if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    };
  }, [enabled]);

  const send = useCallback((data: object) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback((postId: string) => {
    subsRef.current.add(postId);
    send({ action: "subscribe", post_id: postId });
  }, [send]);

  const unsubscribe = useCallback((postId: string) => {
    subsRef.current.delete(postId);
    send({ action: "unsubscribe", post_id: postId });
  }, [send]);

  const likeViaWS   = useCallback((postId: string) => send({ action: "like",   post_id: postId }), [send]);
  const unlikeViaWS = useCallback((postId: string) => send({ action: "unlike", post_id: postId }), [send]);

  return { subscribe, unsubscribe, likeViaWS, unlikeViaWS };
}
