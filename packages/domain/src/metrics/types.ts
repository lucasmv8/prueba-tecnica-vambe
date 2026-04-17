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

export interface DuplicateEmailGroup {
  correo: string;
  clientes: string[];
}

export interface AlertEntry {
  clientId: string;
  nombre: string;
  correo: string;
  vendedor: string;
  tipo: "potencial_no_cerrado" | "cierre_bajo_potencial";
  etiqueta: string;
  severidad: "warning" | "info";
  industria?: string;
  painPoint?: string;
  conclusionEjecutiva?: string;
  proximaAccion?: string;
}

export interface MetricsData {
  kpis: KPIData;
  byIndustria: BarChartEntry[];
  byVendedor: BarChartEntry[];
  byMonth: LineChartEntry[];
  duplicateEmails: DuplicateEmailGroup[];
  topPainPoints: PainPointEntry[];
  alertas: AlertEntry[];
}
