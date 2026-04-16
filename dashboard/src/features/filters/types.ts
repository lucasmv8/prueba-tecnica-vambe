export interface FilterState {
  vendedor: string;
  industria: string;
  closed: string;
  urgencia: string;
  etapaDecision: string;
  q: string;
  page: number;
}

export const DEFAULT_FILTERS: FilterState = {
  vendedor: "",
  industria: "",
  closed: "",
  urgencia: "",
  etapaDecision: "",
  q: "",
  page: 1,
};
