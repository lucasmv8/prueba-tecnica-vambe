export interface KPIData {
  totalClients: number;
  closeRate: number;
  topVendedor: string;
  topVendedorCloseRate: number;
  topIndustria: string;
  topIndustriaCloseRate: number;
  leadsCalificados: number;
  pendingAnalysis: number;
}

export interface BarChartEntry {
  name: string;
  total: number;
  cerrados: number;
  closeRate: number;
}

export interface PieChartEntry {
  name: string;
  value: number;
}

export interface LineChartEntry {
  month: string;
  reuniones: number;
  cerrados: number;
  closeRate: number;
}

export interface PainPointEntry {
  text: string;
  count: number;
  cerrados: number;
  closeRate: number;
}

export interface FunnelEntry {
  stage: string;
  label: string;
  total: number;
  cerrados: number;
  closeRate: number;
}

export interface DuplicateEmailGroup {
  correo: string;
  clientes: string[];
}

export interface MetricsData {
  kpis: KPIData;
  byIndustria: BarChartEntry[];
  byVendedor: BarChartEntry[];
  byMonth: LineChartEntry[];
  byEtapaDecision: FunnelEntry[];
  duplicateEmails: DuplicateEmailGroup[];
  topPainPoints: PainPointEntry[];
}
