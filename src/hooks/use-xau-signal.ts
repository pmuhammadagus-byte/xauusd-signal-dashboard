"use client";

import { useEffect, useRef, useState } from "react";
import type { SignalState } from "@/lib/signal-engine";

interface UseXauSignalOptions {
  /** Polling interval in ms when SSE fails (default 10000) */
  pollIntervalMs?: number;
  /** Whether to use SSE stream (default true) */
  useStream?: boolean;
}

interface UseXauSignalResult {
  state: SignalState | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  /** Reconnect / refetch manually */
  reconnect: () => void;
}

/**
 * Hook that subscribes to live XAU/USD signal updates.
 * Strategy:
 *   1. Try SSE stream (/api/signal/stream) — true real-time push
 *   2. Fall back to REST polling (/api/signal) every 10s if SSE fails
 *   3. Auto-reconnect on disconnect with exponential backoff
 */
export function useXauSignal(options: UseXauSignalOptions = {}): UseXauSignalResult {
  const { pollIntervalMs = 10000, useStream = true } = options;
  const [state, setState] = useState<SignalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isStreamingRef = useRef(false);

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const fetchOnce = async () => {
    try {
      const res = await fetch("/api/signal", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SignalState;
      setState(data);
      setError(null);
      setConnected(true);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
      setConnected(false);
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    fetchOnce();
    pollRef.current = setInterval(fetchOnce, pollIntervalMs);
  };

  const startStream = () => {
    if (!useStream || isStreamingRef.current) return;
    isStreamingRef.current = true;

    try {
      const es = new EventSource("/api/signal/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        setError(null);
        // Stop polling if we were
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as SignalState;
          setState(data);
          setLoading(false);
          setError(null);
        } catch (e) {
          console.warn("[signal] parse error:", e);
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        eventSourceRef.current = null;
        isStreamingRef.current = false;

        // Fall back to polling immediately
        startPolling();

        // Try to reconnect SSE with exponential backoff
        const attempts = reconnectAttemptsRef.current;
        reconnectAttemptsRef.current += 1;
        const backoffMs = Math.min(1000 * 2 ** attempts, 60000);
        reconnectTimeoutRef.current = setTimeout(() => {
          startStream();
        }, backoffMs);
      };
    } catch (e) {
      console.warn("[signal] SSE not supported, falling back to polling:", e);
      isStreamingRef.current = false;
      startPolling();
    }
  };

  useEffect(() => {
    // Initial fetch to get immediate data
    fetchOnce();

    // Start SSE stream (will fall back to polling on error)
    startStream();

    return () => {
      cleanup();
    };
  }, [reloadKey]);

  const reconnect = () => {
    cleanup();
    isStreamingRef.current = false;
    reconnectAttemptsRef.current = 0;
    setReloadKey((k) => k + 1);
  };

  return { state, loading, error, connected, reconnect };
}
