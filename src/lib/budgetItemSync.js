// סנכרון עלויות שלבי התכנון אל מערך budget_items של הטיול (מחשבון התקציב).
// מאפשר הזנת "כמה עלה בפועל" בכל שלב והזרמתו אוטומטית לסיכום עלויות הטיול.

// מיפוי שלב תכנון → קטגוריית תקציב (ערכים כפי שמוגדרים ב-BudgetCalculator)
export const STEP_BUDGET_CATEGORY = {
  flights: "flights",
  car: "transport",
  transfer: "transfers",
  accommodation: "accommodation",
  insurance: "insurance",
  lessons: "lessons",
  equipment: "equipment",
};

const STEP_LABELS = {
  flights: "טיסות",
  car: "השכרת רכב",
  transfer: "הסעות",
  accommodation: "לינה",
  insurance: "ביטוח",
  lessons: "שיעורי סקי",
  equipment: "ציוד סקי",
};

// הדדיות רכב/העברות: בשמירת שלב רכב נסיר פריטי העברות שמקורם בשלב, ולהיפך —
// כך שבכל רגע מוצגת רק אחת משתי קטגוריות התחבורה עבור הטיול.
const TRANSPORT_RECIPROCAL = {
  car: "transfers",
  transfer: "transport",
};

/**
 * מושך שער המרה בין מטבעות (ברירת מחדל 1 אם זהים או בכישלון).
 */
export async function fetchExchangeRate(fromCurrency, toCurrency) {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return 1;
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    if (!res.ok) return 1;
    const data = await res.json();
    const rate = data?.rates?.[toCurrency];
    return rate || 1;
  } catch (e) {
    return 1;
  }
}

/**
 * עדכון/יצירה (upsert) של פריט תקציב משלב תכנון.
 * - אם קיים פריט באותה קטגוריה — מעדכן אותו (ללא כפילויות).
 * - אחרת — יוצר פריט חדש עם source = "step:<stepKey>".
 * - לשלבי רכב/העברות — מסיר פריטים שמקורם בשלב מהקטגוריה ההפוכה (הדדיות).
 * מחזיר מערך budget_items חדש.
 */
export function upsertStepBudgetItem(trip, stepKey, { amount, currency, exchange_rate }) {
  const category = STEP_BUDGET_CATEGORY[stepKey];
  if (!category) return Array.isArray(trip?.budget_items) ? [...trip.budget_items] : [];

  const items = Array.isArray(trip?.budget_items) ? [...trip.budget_items] : [];
  const source = `step:${stepKey}`;
  const label = STEP_LABELS[stepKey] || category;

  // הדדיות: הסרת פריטים שמקורם בשלב מהקטגוריה ההפוכה
  const reciprocal = TRANSPORT_RECIPROCAL[stepKey];
  let filtered = items;
  if (reciprocal) {
    filtered = items.filter(
      (it) => !(it.category === reciprocal && typeof it.source === "string" && it.source.startsWith("step:"))
    );
  }

  const amt = Number(amount) || 0;
  const rate = Number(exchange_rate) || 1;
  const amountInBase = Math.round(amt * rate * 100) / 100;

  const idx = filtered.findIndex((it) => it.category === category);
  if (idx >= 0) {
    filtered[idx] = {
      ...filtered[idx],
      label,
      amount: amt,
      currency,
      exchange_rate: rate,
      amount_in_base: amountInBase,
      source,
    };
  } else {
    filtered.push({
      id: Date.now().toString(),
      category,
      label,
      amount: amt,
      currency,
      exchange_rate: rate,
      amount_in_base: amountInBase,
      source,
    });
  }
  return filtered;
}

/**
 * קריאת עלות בפועל שמורה מתוך אובייקט פרטי השלב של הטיול.
 */
export function readActualCost(trip, detailsField) {
  const details = trip?.[detailsField];
  if (!details) return { amount: "", currency: "" };
  return {
    amount: details.actual_cost != null ? String(details.actual_cost) : "",
    currency: details.actual_currency || "",
  };
}