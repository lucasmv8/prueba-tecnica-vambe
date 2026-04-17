"use client";

import { useState, useCallback, useEffect } from "react";
import type { MetricsData } from "@vambe/domain";

const EMPTY_METRICS: MetricsData = {
  kpis: { totalClients: 0, closeRate: 0, topVendedor: "-", topVendedorCloseRate: 0, topIndustria: "-", topIndustriaCloseRate: 0, leadsCalificados: 0, pendingAnalysis: 0 },
  byIndustria: [],
  byVendedor: [],
  byMonth: [],
  duplicateEmails: [],
  topPainPoints: [],
  alertas: [],
};

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    const res = await fetch("/api/metrics");
    const data: MetricsData = await res.json();
    setMetrics(data);
    return data;
  }, []);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data: MetricsData) => setMetrics(data))
      .finally(() => setLoading(false));
  }, []);

  return { metrics, loading, fetchMetrics };
}
