
import { createPageUrl } from "@/utils";

export const DRAFT_TRIP_KEY = 'draftTripPlan';

// ממיר ערך תאריך (ISO / Date) למחרוזת yyyy-MM-dd בזמן מקומי, תואם ל-PlanTrip
const toDateOnly = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DEFAULT_STEPS = {
  flights: false,
  transport: false,
  accommodation: false,
  insurance: false,
  equipment: false,