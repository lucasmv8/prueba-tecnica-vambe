export interface AnalysisResult {
  industria: string;
  volumenMensajes: string;
  canalDescubrimiento: string;
  painPoint: string;
  integraciones: string;
  potencial: string;
  conclusionEjecutiva: string;
  proximaAccion: string;
}

export interface AnalysisProgress {
  total: number;
  processed: number;
  status: "idle" | "running" | "completed" | "error";
  currentName?: string;
  error?: string;
}
