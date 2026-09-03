import { useState, useEffect } from "react";
import {
  fetchExchangeRate,
  upsertStepBudgetItem,
  readActualCost,
} from "@/lib/budgetItemSync";

/**
 * ניהול מצב שדה "כמה עלה בפועל" עבור שלב תכנון.
 * מאתחל את הערך מתוך פרטי השלב של הטיול בטעינה.
 *
 * @param {object} trip - אובייקט הטיול (עשוי להיות null בזמן טעינה)
 * @param {string} detailsField - שם שדה הפרטים בטיול (למשל "flight_details")
 */
export function useActualCost(trip, detailsField) {
  const [actualCost, setActualCost] = useState({ amount: "", currency: "EUR" });

  useEffect(() => {
    if (trip) {
      const ac = readActualCost(trip, detailsField);
      setActualCost({
        amount: ac.amount,
        currency: ac.currency || trip.budget_currency || "EUR",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, detailsField]);

  return { actualCost, setActualCost };
}

/**
 * בונה תוספות payload לעדכון הטיול בשרת (מצב מחובר): עדכון budget_items + פרטי השלב.
 * מחזיר אובייקט למיזוג בתוך קריאת העדכון של השלב.
 */
export async function buildActualCostPayload(trip, stepKey, detailsField, actualCost) {
  const payload = {};
  if (actualCost.amount && parseFloat(actualCost.amount) > 0) {
    const baseCur = trip.budget_currency || "EUR";
    const cur = actualCost.currency || baseCur;
    const rate = await fetchExchangeRate(cur, baseCur);
    payload.budget_items = upsertStepBudgetItem(trip, stepKey, {
      amount: actualCost.amount,
      currency: cur,
      exchange_rate: rate,
    });
    payload[detailsField] = {
      ...(trip[detailsField] || {}),
      actual_cost: parseFloat(actualCost.amount),
      actual_currency: cur,
    };
  }
  return payload;
}

/**
 * מחיל את העלות שהוזנה על טיוטת האורח ב-localStorage (מצב אורח).
 * משנה את draftData במקום ומחזיר אותו.
 */
export function applyActualCostToDraft(draftData, detailsField, actualCost) {
  if (actualCost.amount && parseFloat(actualCost.amount) > 0) {
    draftData[detailsField] = {
      ...(draftData[detailsField] || {}),
      actual_cost: parseFloat(actualCost.amount),
      actual_currency: actualCost.currency || "EUR",
    };
  }
  return draftData;
}