// Analysis
export { analyzeAll, analyzeOne, getPendingCount } from "./analysis/analysis.service";
export type { BatchProgress } from "./analysis/analysis.service";
export type { AnalysisResult, AnalysisProgress } from "./analysis/types";

// Clients
export { getClients } from "./clients/clients.service";
export type { Client, ClientFilters, ClientsResponse } from "./clients/types";

// Filters
export { DEFAULT_FILTERS } from "./filters/types";
export type { FilterState } from "./filters/types";

// Metrics
export { getMetrics } from "./metrics/metrics.service";
export type {
  MetricsData,
  KPIData,
  BarChartEntry,
  PieChartEntry,
  LineChartEntry,
  PainPointEntry,
  FunnelEntry,
  DuplicateEmailGroup,
} from "./metrics/types";

// Note: UI utilities (capitalizeFirst, formatDate, URGENCY_COLORS, CHART_COLORS) are
// exported from @vambe/ui-system to keep client bundles free of Node.js dependencies.
