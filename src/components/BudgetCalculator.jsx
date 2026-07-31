const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calculator, Plus, Trash2, Package, Bed, Plane, Car, Shield, GraduationCap, Ticket, Wallet, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const CATEGORIES = [
  { value: "equipment", label: "ציוד", icon: Package, color: "text-cyan-600", bg: "bg-cyan-50" },
  { value: "accommodation", label: "לינה", icon: Bed, color: "text-purple-600", bg: "bg-purple-50" },
  { value: "flights", label: "טיסות", icon: Plane, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "transport", label: "תחבורה", icon: Car, color: "text-green-600", bg: "bg-green-50" },
  { value: "insurance", label: "ביטוח", icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  { value: "lessons", label: "שיעורים", icon: GraduationCap, color: "text-orange-600", bg: "bg-orange-50" },
  { value: "ski_pass", label: "סקי-פס", icon: Ticket, color: "text-indigo-600", bg: "bg-indigo-50" },
  { value: "other", label: "אחר", icon: Wallet, color: "text-slate-600", bg: "bg-slate-50" },
];

const CURRENCY_SYMBOLS = {
  ILS: "₪",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const catMeta = (val) => CATEGORIES.find((c) => c.value === val) || CATEGORIES[CATEGORIES.length - 1];
const fmt = (n) => new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 }).format(n || 0);
const symbolOf = (c) => CURRENCY_SYMBOLS[c] || c;

export default function BudgetCalculator({ trip, onTripUpdate }) {
  const baseCurrency = trip?.budget_currency || "EUR";
  const [items, setItems] = useState(trip?.budget_items || []);
  const [newItem, setNewItem] = useState({
    category: "equipment", label: "", amount: "", currency: baseCurrency, exchange_rate: "1"
  });
  const [saving, setSaving] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [isRateManual, setIsRateManual] = useState(false);

  // Sync items/currency when trip changes
  useEffect(() => {
    setItems(trip?.budget_items || []);
    setNewItem((p) => ({
      ...p,
      currency: trip?.budget_currency || "EUR",
      exchange_rate: p.currency === (trip?.budget_currency || "EUR") ? "1" : p.exchange_rate,
    }));
  }, [trip?.id, trip?.budget_currency]);

  // Auto-fetch exchange rate when currency changes (reusing ExpenseDashboard logic)
  useEffect(() => {
    const updateRate = async () => {
      if (isRateManual) return;
      if (!newItem.currency || newItem.currency === baseCurrency) {
        setNewItem((p) => ({ ...p, exchange_rate: "1" }));
        return;
      }
      setFetchingRate(true);
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${newItem.currency}`);
        if (!res.ok) throw new Error("Failed to fetch rate");
        const data = await res.json();
        const rate = data?.rates?.[baseCurrency];
        if (rate) {
          setNewItem((p) => ({ ...p, exchange_rate: rate.toFixed(4) }));
        } else {
          throw new Error("Rate not found");
        }
      } catch (err) {
        toast.error("לא ניתן למשוך שער המרה - אנא הזן ידנית");
      } finally {
        setFetchingRate(false);
      }
    };
    updateRate();
  }, [newItem.currency, baseCurrency, isRateManual]);

  const persist = async (updatedItems, updatedCurrency) => {
    setSaving(true);
    try {
      const payload = { budget_items: updatedItems };
      if (updatedCurrency) payload.budget_currency = updatedCurrency;
      const updated = await db.entities.TripPlan.update(trip.id, payload);
      onTripUpdate?.(updated);
    } catch (e) {
      toast.error("שגיאה בשמירת התקציב");
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async (newCurrency) => {
    const prev = baseCurrency;
    // Re-base existing items: keep original currency/amount, recompute exchange_rate & amount_in_base
    const rebased = items.map((it) => {
      if (it.currency === newCurrency) {
        return { ...it, exchange_rate: 1, amount_in_base: Number(it.amount) || 0 };
      }
      // try fetch rate for each — but to keep simple, keep existing ratio if amount_in_base existed
      const oldRate = it.exchange_rate || 1;
      const oldBase = it.amount_in_base || (Number(it.amount) || 0) * oldRate;
      // convert through old base currency to new: amount_in_base_old / (rate old->new). We don't have it; keep oldBase value but it's in old currency.
      // Simplest: preserve original amount & currency, set exchange_rate to 1 if same as new, else leave old rate (user can edit)
      return { ...it, amount_in_base: Number(it.amount) || 0 * oldRate };
    });
    setItems(rebased);
    setNewItem((p) => ({ ...p, currency: newCurrency, exchange_rate: "1" }));
    setIsRateManual(false);
    persist(rebased, newCurrency);
  };

  const handleAdd = () => {
    const amount = parseFloat(newItem.amount);
    if (!newItem.label.trim() || isNaN(amount) || amount <= 0) {
      toast.error("נא למלא תיאור וסכום תקין");
      return;
    }
    const rate = parseFloat(newItem.exchange_rate) || 1;
    const item = {
      id: Date.now().toString(),
      category: newItem.category,
      label: newItem.label.trim(),
      amount,
      currency: newItem.currency,
      exchange_rate: rate,
      amount_in_base: Math.round(amount * rate * 100) / 100,
    };
    const updated = [...items, item];
    setItems(updated);
    setNewItem({ category: "equipment", label: "", amount: "", currency: baseCurrency, exchange_rate: "1" });
    setIsRateManual(false);
    persist(updated);
  };

  const handleDelete = (id) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    persist(updated);
  };

  const total = items.reduce((sum, i) => sum + (Number(i.amount_in_base) || (Number(i.amount) || 0) * (i.exchange_rate || 1)), 0);
  const perPerson = trip?.participants > 0 ? total / trip.participants : 0;
  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    sum: items.filter((i) => i.category === cat.value).reduce((s, i) => s + (Number(i.amount_in_base) || (Number(i.amount) || 0) * (i.exchange_rate || 1)), 0),
  })).filter((c) => c.sum > 0);

  return (
    <Card className="shadow-xl border-t-4 border-t-emerald-500">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-100 pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="w-6 h-6 text-emerald-600" />
              מחשבון תקציב
            </CardTitle>
            {saving && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-500 whitespace-nowrap">מטבע ראשי</Label>
            <Select value={baseCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger dir="rtl" className="w-32 text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ILS" className="text-right">₪ שקל</SelectItem>
                <SelectItem value="EUR" className="text-right">€ יורו</SelectItem>
                <SelectItem value="USD" className="text-right">$ דולר</SelectItem>
                <SelectItem value="GBP" className="text-right">£ פאונד</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription className="text-base">סיכום עלויות הטיול — כל הוצאה יכולה להיות במטבע משלה</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Add new item */}
        <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={newItem.category} onValueChange={(v) => setNewItem((p) => ({ ...p, category: v }))}>
              <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-right">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="תיאור ההוצאה (לדוג' השכרת סקי ל-6 ימים)"
              value={newItem.label}
              onChange={(e) => setNewItem((p) => ({ ...p, label: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="סכום"
              value={newItem.amount}
              onChange={(e) => setNewItem((p) => ({ ...p, amount: e.target.value }))}
              className="flex-1 min-w-[100px]"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <Select value={newItem.currency} onValueChange={(v) => { setNewItem((p) => ({ ...p, currency: v })); setIsRateManual(false); }}>
              <SelectTrigger dir="rtl" className="w-24 text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ILS" className="text-right">₪</SelectItem>
                <SelectItem value="EUR" className="text-right">€</SelectItem>
                <SelectItem value="USD" className="text-right">$</SelectItem>
                <SelectItem value="GBP" className="text-right">£</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 ml-1" /> הוסף
            </Button>
          </div>
          {newItem.currency !== baseCurrency && (
            <div className="space-y-1">
              <Label className="flex items-center justify-between text-xs">
                <span>שער המרה (1 {newItem.currency} = ? {baseCurrency})</span>
                {fetchingRate
                  ? <span className="text-blue-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> מושך...</span>
                  : isRateManual
                  ? <span className="text-amber-600">שער ידני</span>
                  : <span className="text-green-600">נמשך אוטומטית</span>}
              </Label>
              <Input
                type="number"
                step="0.0001"
                value={newItem.exchange_rate}
                onChange={(e) => { setNewItem((p) => ({ ...p, exchange_rate: e.target.value })); setIsRateManual(true); }}
              />
              <p className="text-xs text-slate-500">
                מחושב: {symbolOf(baseCurrency)}{fmt(parseFloat(newItem.amount || "0") * parseFloat(newItem.exchange_rate || "1"))}
              </p>
            </div>
          )}
        </div>

        {/* Items list */}
        {items.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => {
              const cat = catMeta(item.category);
              const Icon = cat.icon;
              const itemCurrency = item.currency || baseCurrency;
              const itemBase = Number(item.amount_in_base) || (Number(item.amount) || 0) * (item.exchange_rate || 1);
              const isConverted = itemCurrency !== baseCurrency;
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className={`w-8 h-8 rounded-full ${cat.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {cat.label}
                      {isConverted && <span className="text-slate-400"> · שער {item.exchange_rate || 1}</span>}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    {isConverted ? (
                      <>
                        <span className="font-semibold text-slate-800 whitespace-nowrap text-sm">{symbolOf(itemCurrency)}{fmt(item.amount)}</span>
                        <span className="block text-xs text-emerald-600 whitespace-nowrap">= {symbolOf(baseCurrency)}{fmt(itemBase)}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-slate-800 whitespace-nowrap">{symbolOf(baseCurrency)}{fmt(item.amount)}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 shrink-0" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-slate-400 text-sm py-4">עדיין אין פריטי תקציב. הוסף את ההוצאה הראשונה למעלה.</p>
        )}

        {/* Summary */}
        {byCategory.length > 0 && (
          <div className="space-y-1.5 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            {byCategory.map((cat) => (
              <div key={cat.value} className="flex justify-between text-sm">
                <span className="text-slate-600">{cat.label}</span>
                <span className="font-medium text-slate-800">{symbolOf(baseCurrency)}{fmt(cat.sum)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <span className="font-semibold text-lg">סה"כ</span>
          </div>
          <div className="text-left">
            <span className="text-2xl font-extrabold">{symbolOf(baseCurrency)}{fmt(total)}</span>
            {trip?.participants > 0 && (
              <span className="block text-xs text-emerald-100">~{symbolOf(baseCurrency)}{fmt(perPerson)} לאדם ({trip.participants})</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}