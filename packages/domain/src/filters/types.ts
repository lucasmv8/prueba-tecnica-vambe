export interface FilterState {
  vendedor: string;
  industria: string;
  closed: string;
  potencial: string;
  q: string;
  page: number;
}

export const DEFAULT_FILTERS: FilterState = {
  vendedor: "",
  industria: "",
  closed: "",
  potencial: "",
  q: "",
  page: 1,
};
