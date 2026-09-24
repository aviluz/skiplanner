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