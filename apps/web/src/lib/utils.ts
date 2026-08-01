import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date, pattern = "dd/MM/yyyy") {
  return format(new Date(value), pattern, { locale: es });
}

export function getApiErrorMessage(error: unknown, fallback = "Ocurrió un error"): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Stable palette for calendar blocks (ficha / instructor), derived from the
 * official SENA brand colors (verde, azul oscuro, violeta, amarillo, cian)
 * with text/border shades darkened for on-tint accessibility.
 */
const ENTITY_COLORS = [
  { bg: "#E2F3E6", border: "#007832", text: "#00591F" }, // verde SENA
  { bg: "#E1EAF0", border: "#00304D", text: "#00304D" }, // azul oscuro SENA
  { bg: "#F1E6F3", border: "#71277A", text: "#71277A" }, // violeta SENA
  { bg: "#FFF6D8", border: "#B38F00", text: "#7A5B00" }, // amarillo SENA
  { bg: "#E1F5F8", border: "#0E7490", text: "#0E7490" }, // cian SENA
  { bg: "#E9F0EA", border: "#39A900", text: "#2F7D00" }, // verde institucional
  { bg: "#FBE7E4", border: "#A3341E", text: "#A3341E" }, // terracota
  { bg: "#E9EEF1", border: "#33515F", text: "#33515F" }, // gris azulado
] as const;

export function colorFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return ENTITY_COLORS[hash % ENTITY_COLORS.length]!;
}
