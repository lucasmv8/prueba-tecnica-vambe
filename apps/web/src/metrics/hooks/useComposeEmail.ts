"use client";

import { useState, useCallback } from "react";
import type { ComposeInput } from "@vambe/domain";

export function useComposeEmail() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (payload: ComposeInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error del servidor");
      setResult(await res.json());
    } catch {
      setError("No se pudo generar el mensaje. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => setResult(null), []);

  return { loading, result, error, generate, clearResult };
}
