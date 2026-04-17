"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { ClientsResponse, FilterState } from "@vambe/domain";

const EMPTY_CLIENTS: ClientsResponse = {
  clients: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
};

const DEFAULT_FILTERS: FilterState = {
  vendedor: "", industria: "", closed: "", potencial: "", q: "", page: 1,
};

export function useClients() {
  const [clients, setClients] = useState<ClientsResponse>(EMPTY_CLIENTS);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const debouncedQ = useDebounce(filters.q, 350);

  const fetchClients = useCallback(async (f: FilterState) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.vendedor) params.set("vendedor", f.vendedor);
    if (f.industria) params.set("industria", f.industria);
    if (f.closed) params.set("closed", f.closed);
    if (f.potencial) params.set("potencial", f.potencial);
    if (f.q) params.set("q", f.q);
    params.set("page", String(f.page));
    const res = await fetch(`/api/clients?${params}`);
    const data: ClientsResponse = await res.json();
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients({ ...filters, q: debouncedQ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.vendedor, filters.industria, filters.closed, filters.potencial, filters.page, debouncedQ]);

  const refetch = useCallback(
    () => fetchClients({ ...filters, q: debouncedQ }),
    [fetchClients, filters, debouncedQ]
  );

  return { clients, loading, filters, setFilters, fetchClients, refetch };
}
