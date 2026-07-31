const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


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
  lessons: false,
  ski_pass: false,
};

/**
 * ממיר טיוטת אורח לטיול אמיתי (TripPlan) ברגע שהמשתמש מחובר.
 * מונע כפילויות באמצעות `createdTripId` הנשמר על הטיוטה (שורד רענון/מעבר שלבים).
 * מחזיר את מזהה הטיול (קיים או חדש), או null אם אין צורך בהמרה.
 */
export async function migrateGuestTripToUser(user) {
  if (!user) return null;

  const raw = localStorage.getItem(DRAFT_TRIP_KEY);
  if (!raw) return null;

  let draft;
  try {
    draft = JSON.parse(raw);
  } catch {
    return null;
  }

  // הומר כבר בשלב קודם / רענון — נשתמש באותו מזהה (מניעת כפילויות)
  if (draft.createdTripId) return draft.createdTripId;

  if (!draft.pendingCreation) return null;
  if (!draft.destination_id) return null;

  const tripPayload = {
    trip_name: draft.trip_name || "טיול סקי",
    destination_id: draft.destination_id,
    destination_name: draft.destination_name || "",
    departure_date: draft.flexible_dates ? null : toDateOnly(draft.departure_date),
    return_date: draft.flexible_dates ? null : toDateOnly(draft.return_date),
    departure_month: draft.flexible_dates ? draft.departure_month : null,
    return_month: draft.flexible_dates ? draft.return_month : null,
    departure_airport: draft.departure_airport || "",
    arrival_airport: draft.arrival_airport || "",
    participants: Number(draft.participants) || 1,
    budget_range: draft.budget_range,
    skiing_level: draft.skiing_level,
    is_first_trip: draft.is_first_trip || false,
    flexible_dates: draft.flexible_dates || false,
    has_kosher_food: draft.has_kosher_food || false,
    status: "planning",
    steps_completed: draft.steps_completed || { ...DEFAULT_STEPS },
    shared_with: [],
    created_by_group: [user.email],
  };

  // שמירת פרטי שלבים שנאספו במצב אורח (אם קיימים)
  if (draft.transport_type) tripPayload.transport_type = draft.transport_type;
  if (draft.car_rental_details) tripPayload.car_rental_details = draft.car_rental_details;
  if (draft.transfer_details) tripPayload.transfer_details = draft.transfer_details;
  if (draft.lessons_details) tripPayload.lessons_details = draft.lessons_details;
  if (draft.ski_pass_details) tripPayload.ski_pass_details = draft.ski_pass_details;

  const newTrip = await db.entities.TripPlan.create(tripPayload);

  draft.createdTripId = newTrip.id;
  draft.pendingCreation = false;
  localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draft));

  return newTrip.id;
}

/**
 * מטפל במעבר ממצב אורח למשתמש מחובר בדף שלב.
 * אם המשתמש מחובר ויש טיוטת אורח ממתינה — יוצר את הטיול ומנווט לאותו שלב
 * עם `tripId` במקום `guest=1`, כך שהדף ייטען במצב מחובר.
 * מחזיר true אם בוצע ניווט (הקורא צריך להפסיק טעינה).
 */
export async function transitionGuestToUser(navigate, pageName) {
  let user = null;
  try {
    user = await db.auth.me();
  } catch {
    user = null;
  }
  if (!user) return false;

  let tripId = null;
  try {
    tripId = await migrateGuestTripToUser(user);
  } catch (e) {
    console.error("Error migrating guest trip:", e);
    return false;
  }
  if (!tripId) return false;

  navigate(createPageUrl(`${pageName}?tripId=${tripId}`));
  return true;
}