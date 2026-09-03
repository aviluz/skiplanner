import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet } from "lucide-react";

const CURRENCIES = [
  { code: "EUR", symbol: "€" },
  { code: "ILS", symbol: "₪" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
];

/**
 * שדה אופציונלי "כמה עלה בפועל" (סכום + מטבע) לשיבוץ בכל שלבי התכנון.
 * הערך מוזרם אוטומטית למחשבון התקציב דרך budgetItemSync.
 *
 * props:
 * - value: { amount: string, currency: string }
 * - onChange: (next) => void
 * - baseCurrency: string (ברירת מחדל "EUR")
 */
export default function ActualCostField({ value, onChange, baseCurrency = "EUR" }) {
  const amount = value?.amount ?? "";
  const currency = value?.currency || baseCurrency;

  const setAmount = (v) => onChange({ amount: v, currency });
  const setCurrency = (v) => onChange({ amount, currency: v });

  return (
    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
      <Label className="flex items-center gap-2 text-sm font-medium text-emerald-800 mb-3">
        <Wallet className="w-4 h-4" />
        כמה עלה בפועל? (אופציונלי — יתווסף למחשבון התקציב)
      </Label>
      <div className="flex gap-2 flex-wrap">
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="סכום"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 min-w-[120px]"
        />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger dir="rtl" className="w-28 text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-right">
                {c.symbol} {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {currency !== baseCurrency && (
        <p className="text-xs text-emerald-700 mt-2">
          שער ההמרה יחושב אוטומטית בשמירה (ניתן לערוך ידנית במחשבון התקציב).
        </p>
      )}
    </div>
  );
}