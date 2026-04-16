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
  industria: string | null;
  tamanioEmpresa: string | null;
  volumenMensajes: string | null;
  canalDescubrimiento: string | null;
  painPoint: string | null;
  integraciones: string | null;
  objeciones: string | null;
  urgencia: string | null;
  etapaDecision: string | null;
  resumenLLM: string | null;
  analyzedAt: string | null;
  leadScore: number | null;
}

export interface ClientFilters {
  vendedor?: string;
  industria?: string;
  closed?: string;
  urgencia?: string;
  etapaDecision?: string;
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
