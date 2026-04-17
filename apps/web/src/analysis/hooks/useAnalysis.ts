"use client";

import { useState, useRef, useCallback } from "react";
import type { AnalysisProgress } from "@vambe/domain";

export function useAnalysis() {
  const [progress, setProgress] = useState<AnalysisProgress>({ status: "idle", processed: 0, total: 0 });
  const running = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback(async (force: boolean, onCompleted?: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;

    const abort = new AbortController();
    abortRef.current = abort;
    setProgress({ status: "running", processed: 0, total: 0 });

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
        signal: abort.signal,
      });

      const reader = res.body!.getReader();
      abort.signal.addEventListener("abort", () => reader.cancel());
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done || abort.signal.aborted) break;

        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status === "completed") {
              setProgress((p) => ({ status: "completed", processed: p.total, total: p.total }));
              await onCompleted?.();
            } else if (data.status === "error") {
              setProgress({ status: "error", processed: 0, total: 0, error: data.error });
            } else {
              setProgress({ status: "running", processed: data.processed, total: data.total, currentName: data.currentName });
            }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        setProgress({ status: "error", processed: 0, total: 0, error: String(e) });
      }
    } finally {
      running.current = false;
      abortRef.current = null;
      setProgress((p) => (p.status === "running" ? { ...p, status: "idle" } : p));
      setTimeout(() => {
        setProgress((p) => (p.status === "completed" ? { ...p, status: "idle" } : p));
      }, 4000);
    }
  }, []);

  const stopAnalysis = useCallback(() => { abortRef.current?.abort(); }, []);

  return { progress, startAnalysis, stopAnalysis };
}
