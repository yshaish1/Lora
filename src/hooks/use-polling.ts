"use client";

import { useEffect, useRef, useState } from "react";

export function usePolling<T>(
  url: string | null,
  intervalMs: number,
  shouldStop: (data: T) => boolean
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!url) return;

    const poll = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();
        setData(result);
        if (shouldStop(result)) {
          setIsPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    setIsPolling(true);
    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [url, intervalMs]);

  return { data, error, isPolling };
}
