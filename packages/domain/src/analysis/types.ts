export interface AnalysisResult {
  industria: string;
  tamanioEmpresa: string;
  volumenMensajes: string;
  canalDescubrimiento: string;
  painPoint: string;
  integraciones: string;
  objeciones: string;
  urgencia: string;
  etapaDecision: string;
  resumenLLM: string;
}

export interface AnalysisProgress {
  total: number;
  processed: number;
  status: "idle" | "running" | "completed" | "error";
  currentName?: string;
  error?: string;
}
