export interface ClientAnalysis {
  id: string;
  clientId: string;
  analyzedAt: string;
  industria: string;
  volumenMensajes: string;
  canalDescubrimiento: string;
  painPoint: string;
  integraciones: string;
  potencial: string;
  conclusionEjecutiva: string;
  proximaAccion: string;
}

export interface Client {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  fechaReunion: string;
  vendedor: string;
  closed: boolean;
  transcripcion: string;
  hasDuplicateEmail: boolean;
  analysis: ClientAnalysis | null;
  leadScore: number | null;
}

export interface ClientFilters {
  vendedor?: string;
  industria?: string;
  closed?: string;
  potencial?: string;
  q?: string;
  painPoint?: string;
  calificado?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
