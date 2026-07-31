import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const PALETTE = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
  "#a855f7",
  "#f97316",
];

const formatMoney = (amount) =>
  `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export default function ExpensePieChart({ expenses, baseCurrency, currencySymbol }) {
  const [view, setView] = useState("category"); // "category" | "payer"

  const symbol = currencySymbol || baseCurrency || "";

  const data = useMemo(() => {
    const map = {};
    expenses.forEach((exp) => {
      const amount =
        exp.amount_in_base || exp.amount * (exp.exchange_rate || 1);
      const key = view === "category" ? exp.category || "כללי" : exp.payer_name || "—";
      map[key] = (map[key] || 0) + amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, view]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800">פילוח הוצאות</h3>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 self-start">
          <button
            type="button"
            onClick={() => setView("category")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              view === "category"
                ? "bg-white text-blue-700 shadow-sm font-medium"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            לפי קטגוריה
          </button>
          <button
            type="button"
            onClick={() => setView("payer")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              view === "payer"
                ? "bg-white text-blue-700 shadow-sm font-medium"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            לפי משלם
          </button>
        </div>
      </div>

      {data.length === 0 || total === 0 ? (
        <div className="text-center py-10 text-slate-400">
          אין נתוני הוצאות להצגה בגרף.
        </div>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={PALETTE[index % PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                  return [`${symbol} ${formatMoney(value)} (${pct}%)`, name];
                }}
                contentStyle={{ direction: "rtl", textAlign: "right", borderRadius: "8px" }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ direction: "rtl", fontSize: 12, maxHeight: "260px", overflow: "auto" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}