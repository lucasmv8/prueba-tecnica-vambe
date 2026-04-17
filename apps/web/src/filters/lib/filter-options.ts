export const VENDOR_OPTIONS = ["Toro", "Puma", "Zorro", "Boa", "Tiburón"] as const;

export const INDUSTRY_OPTIONS = [
  "finanzas",
  "salud",
  "retail",
  "educacion",
  "logistica",
  "turismo",
  "tecnologia",
  "moda",
  "restaurante",
  "consultoria",
] as const;

export const ESTADO_OPTIONS = [
  { value: "true", label: "Cerrado" },
  { value: "false", label: "Abierto" },
] as const;

export const POTENCIAL_OPTIONS = ["alta", "media", "baja"] as const;
