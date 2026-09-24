import * as XLSX from "xlsx";

// ── Normalization helpers ──

export function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value == null || value === "") return undefined;
  const str = String(value).trim().toLowerCase();
  if (["true", "כן", "yes", "1", "✓"].includes(str)) return true;
  if (["false", "לא", "no", "0"].includes(str)) return false;
  return undefined;
}

export function normalizeNumber(value) {
  if (typeof value === "number") return value;
  if (value == null || value === "") return undefined;
  const num = Number(String(value).replace(/[,\s]/g, ""));
  return isNaN(num) ? undefined : num;
}

export function normalizeDate(value) {
  if (!value && value !== 0) return undefined;