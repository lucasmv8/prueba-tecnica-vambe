import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const URGENCY_COLORS: Record<string, string> = {
  alta: "#ef4444",
  media: "#f59e0b",
  baja: "#22c55e",
};

export const POTENTIAL_COLORS: Record<string, string> = {
  alta: "#10B981",
  media: "#F59E0B",
  baja: "#EF4444",
};

export const CHART_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#DC2626",
  "#0891B2",
  "#65A30D",
  "#DB2777",
];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}
