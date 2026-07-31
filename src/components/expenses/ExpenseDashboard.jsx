const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger } from
"@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Users,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Wallet,
  Receipt,
  Utensils,
  Bed,
  Bus,
  Ticket,
  ShoppingBag,
  Plane,
  CheckCircle2,
  Edit,
  X,
  UserPlus,
  AlertTriangle,
  Loader2,
  Download,
  Share2,
  Mail,
  ShieldCheck } from
"lucide-react";
import { format } from "date-fns";
import ExportDialog from "./ExportDialog";
import ExpensePieChart from "./ExpensePieChart";

const CATEGORY_ICONS = {
  "כללי": Wallet,
  "אוכל": Utensils,
  "לינה": Bed,
  "תחבורה": Bus,
  "אטרקציות": Ticket,
  "ציוד": ShoppingBag,
  "טיסות": Plane
};

// רשימת מטבעות רחבה — הנפוצים בראש, לאחר מכן שאר המטבעות המקובלים בעולם
const CURRENCIES = [
{ code: "ILS", name: "שקל", symbol: "₪" },
{ code: "EUR", name: "יורו", symbol: "€" },
{ code: "USD", name: "דולר אמריקאי", symbol: "$" },
{ code: "GBP", name: "לירה שטרלינג", symbol: "£" },
{ code: "CHF", name: "פרנק שוויצרי", symbol: "₣" },
{ code: "JPY", name: "ין יפני", symbol: "¥" },
{ code: "CNY", name: "יואן סיני", symbol: "¥" },
{ code: "AUD", name: "דולר אוסטרלי", symbol: "A$" },
{ code: "CAD", name: "דולר קנדי", symbol: "C$" },
{ code: "NZD", name: "דולר ניו זילנדי", symbol: "NZ$" },
{ code: "SEK", name: "כתר שוודי", symbol: "kr" },
{ code: "NOK", name: "כתר נורווגי", symbol: "kr" },
{ code: "DKK", name: "כתר דני", symbol: "kr" },
{ code: "AED", name: "דירהם אמירתי", symbol: "د.إ" },
{ code: "SAR", name: "ריאל סעודי", symbol: "﷼" },
{ code: "TRY", name: "לירה טורקית", symbol: "₺" },
{ code: "RUB", name: "רובל רוסי", symbol: "₽" },
{ code: "INR", name: "רופי הודי", symbol: "₹" },
{ code: "HKD", name: "דולר הונג קונגי", symbol: "HK$" },
{ code: "SGD", name: "דולר סינגפורי", symbol: "S$" },
{ code: "THB", name: "באט תאילנדי", symbol: "฿" },
{ code: "ZAR", name: "ראנד דרום אפריקאי", symbol: "R" },
{ code: "BRL", name: "ריאל ברזילאי", symbol: "R$" },
{ code: "MXN", name: "פזו מקסיקני", symbol: "Mex$" },
{ code: "PLN", name: "זלוטי פולני", symbol: "zł" },
{ code: "CZK", name: "קורונה צ'כית", symbol: "Kč" },
{ code: "HUF", name: "פורינט הונגרי", symbol: "Ft" },
{ code: "RON", name: "ליי רומני", symbol: "lei" },
{ code: "BGN", name: "לב בולגרי", symbol: "лв" },
{ code: "ISK", name: "כתר איסלנדי", symbol: "kr" },
{ code: "UAH", name: "ריבנה אוקראיני", symbol: "₴" },
{ code: "KRW", name: "וון דרום קוריאני", symbol: "₩" },
{ code: "IDR", name: "רופיה אינדונזית", symbol: "Rp" },
{ code: "MYR", name: "רינגיט מלזי", symbol: "RM" },
{ code: "PHP", name: "פזו פיליפיני", symbol: "₱" },
{ code: "GEL", name: "לארי גיאורגי", symbol: "₾" },
{ code: "AMD", name: "דראם ארמני", symbol: "֏" },
{ code: "RSD", name: "דינר סרבי", symbol: "din" },
{ code: "ALL", name: "לק אלבני", symbol: "L" },
{ code: "BAM", name: "מארק בוסני", symbol: "KM" },
{ code: "MKD", name: "דנר מקדוני", symbol: "ден" },
{ code: "KZT", name: "טנגה קזחית", symbol: "₸" },
{ code: "EGP", name: "לירה מצרית", symbol: "E£" },
{ code: "JOD", name: "דינר ירדני", symbol: "JD" },
{ code: "ARS", name: "פסו ארגנטינאי", symbol: "AR$" },
{ code: "CLP", name: "פסו צ'יליאני", symbol: "CLP$" },
{ code: "COP", name: "פסו קולומביאני", symbol: "CO$" },
{ code: "PEN", name: "סול פרואני", symbol: "S/" },
{ code: "VND", name: "דונג וייטנאמי", symbol: "₫" },
{ code: "PKR", name: "רופי פקיסטני", symbol: "Rs" },
{ code: "BDT", name: "טקה בנגלדשית", symbol: "৳" },
{ code: "NGN", name: "נאירה ניגרית", symbol: "₦" },
{ code: "KES", name: "שילינג קנייתי", symbol: "KSh" },
{ code: "MAD", name: "דירהם מרוקאי", symbol: "DH" }];

const CURRENCY_SYMBOLS = CURRENCIES.reduce((acc, c) => {
  acc[c.code] = c.symbol;
  return acc;
}, {});

// נרמול שם קטגוריה להשוואה ללא כפילויות: trim + רווחים כפולים → יחיד + אותיות קטנות
const normalizeCategory = (c) =>
  (c || "").trim().replace(/\s+/g, " ").toLowerCase();

export default function ExpenseDashboard({ group, onGroupDeleted, onGroupUpdated, user }) {
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [participants, setParticipants] = useState(group.participants || []);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");

  // Sharing state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharedEmails, setSharedEmails] = useState(group.shared_with_emails || []);

  // Add/Edit Expense Form
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    currency: group.base_currency,
    exchange_rate: "1",
    payer_name: group.participants && group.participants[0] || "",
    beneficiaries: group.participants || [],
    category: "כללי",
    date: new Date().toISOString().split("T")[0]
  });
  const [isRateManual, setIsRateManual] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  // Settle Debt Form
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleData, setSettleData] = useState({
    from: "",
    to: "",
    amount: ""
  });

  // Edit Settlement Form
  const [editingSettlement, setEditingSettlement] = useState(null);
  const [isEditSettlementOpen, setIsEditSettlementOpen] = useState(false);
  const [editSettlementData, setEditSettlementData] = useState({
    from_person: "",
    to_person: "",
    amount: "",
    date: ""
  });

  // Export Dialog
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [group.id]);

  // שער המרה - למשוך לפי תאריך ההוצאה (snapshot פר הוצאה)
  useEffect(() => {
    const updateRate = async () => {
      // אם המשתמש ערך ידנית - לא לדרוס
      if (isRateManual) return;

      // אם המטבע הוא המטבע הבסיסי של הקבוצה - השער תמיד 1
      if (!newExpense.currency || newExpense.currency === group.base_currency) {
        setNewExpense((prev) => ({ ...prev, exchange_rate: "1" }));
        setIsRateManual(false);
        return;
      }

      // משוך שער לפי תאריך ההוצאה (היסטורי או נוכחי)
      setFetchingRate(true);
      try {
        const expenseDate = newExpense.date || new Date().toISOString().split("T")[0];

        // API שתומך בשערים היסטוריים
        const res = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${newExpense.currency}`
        );

        if (!res.ok) throw new Error("Failed to fetch rate");
        const data = await res.json();
        const rate = data?.rates?.[group.base_currency];

        if (rate) {
          setNewExpense((prev) => ({
            ...prev,
            exchange_rate: rate.toFixed(4)
          }));
        } else {
          throw new Error("Rate not found");
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate", err);
        toast.error("לא ניתן למשוך שער המרה - אנא הזן ידנית");
      } finally {
        setFetchingRate(false);
      }
    };

    updateRate();
  }, [newExpense.currency, newExpense.date, group.base_currency, isRateManual]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const [expensesData, settlementsData] = await Promise.all([
      db.entities.GroupExpense.filter({ group_id: group.id }, "-date", 100),
      db.entities.ExpenseSettlement.filter({ group_id: group.id }, "-date", 100)]
      );
      setExpenses(expensesData);
      setSettlements(settlementsData);
    } catch (error) {
      console.error("Error loading group data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic & Calculations ---

  // שם המשתמש הנוכחי לחישוב "ההוצאה שלי"
  const currentUserName = useMemo(() => {
    if (!user) return participants[0] || "";
    const possible = [user.full_name, user.name, user.email].filter(Boolean);
    const match = participants.find((p) => possible.includes(p));
    return match || participants[0] || "";
  }, [user, participants]);

  // רשימת הקטגוריות הזמינות: ברירות מחדל + קטגוריות שכבר נוצלו בהוצאות הקבוצה,
  // ללא כפילויות (התעלמות מרווחים/אותיות גדולות-קטנות). מאפשר שימוש חוזר בקטגוריות חופשיות.
  const availableCategories = useMemo(() => {
    const ordered = [...Object.keys(CATEGORY_ICONS)];
    expenses.forEach((e) => {
      if (e.category && !ordered.includes(e.category)) ordered.push(e.category);
    });
    const seen = new Map();
    ordered.forEach((c) => {
      const key = normalizeCategory(c);
      if (!seen.has(key)) seen.set(key, c);
    });
    return Array.from(seen.values());
  }, [expenses]);

  const balances = useMemo(() => {
    const bals = {};
    participants.forEach((p) => bals[p] = 0);

    // הוצאות
    expenses.forEach((exp) => {
      const amount =
      exp.amount_in_base || exp.amount * (exp.exchange_rate || 1);
      const payer = exp.payer_name;
      const beneficiaries = exp.beneficiaries || [];

      if (beneficiaries.length > 0) {
        // המשלם מקבל פלוס
        bals[payer] = (bals[payer] || 0) + amount;

        // המשתתפים מקבלים מינוס חלקי
        const splitAmount = amount / beneficiaries.length;
        beneficiaries.forEach((ben) => {
          bals[ben] = (bals[ben] || 0) - splitAmount;
        });
      }
    });

    // סגירות חוב
    settlements.forEach((set) => {
      const amount = set.amount;
      // from שילם ל to, אז from מקבל פלוס, to מקבל מינוס
      bals[set.from_person] = (bals[set.from_person] || 0) + amount;
      bals[set.to_person] = (bals[set.to_person] || 0) - amount;
    });

    return bals;
  }, [expenses, settlements, participants]);

  const optimizedDebts = useMemo(() => {
    let curBalances = { ...balances };
    const debts = [];

    Object.keys(curBalances).forEach((p) => {
      curBalances[p] = Math.round(curBalances[p] * 100) / 100;
    });

    let debtors = Object.keys(curBalances).
    filter((p) => curBalances[p] < -0.01).
    map((p) => ({ name: p, amount: curBalances[p] })).
    sort((a, b) => a.amount - b.amount);

    let creditors = Object.keys(curBalances).
    filter((p) => curBalances[p] > 0.01).
    map((p) => ({ name: p, amount: curBalances[p] })).
    sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

      if (amount > 0) {
        debts.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        });
      }

      debtor.amount += amount;
      creditor.amount -= amount;

      debtor.amount = Math.round(debtor.amount * 100) / 100;
      creditor.amount = Math.round(creditor.amount * 100) / 100;

      if (Math.abs(debtor.amount) < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return debts;
  }, [balances]);

  // סהכ הוצאות הקבוצה - כל ההוצאות שכבר נטענו לפי group_id
  const totalSpent = useMemo(() => {
    return expenses.reduce(
      (sum, exp) =>
      sum + (
      exp.amount_in_base ||
      exp.amount * (exp.exchange_rate || 1)),
      0
    );
  }, [expenses]);

  // ההוצאה של המשתמש הנוכחי
  const myTotalSpent = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      const amountBase =
      exp.amount_in_base ||
      exp.amount * (exp.exchange_rate || 1);
      return exp.payer_name === currentUserName ? sum + amountBase : sum;
    }, 0);
  }, [expenses, currentUserName]);

  // --- Actions ---

  const handleSaveExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      toast.error("נא למלא כותרת וסכום");
      return;
    }

    if (!newExpense.beneficiaries || newExpense.beneficiaries.length === 0) {
      toast.error("נא לבחור לפחות מוטב אחד");
      return;
    }

    const amountVal = parseFloat(newExpense.amount);
    const rateVal = parseFloat(newExpense.exchange_rate || "1");

    if (isNaN(amountVal) || isNaN(rateVal)) {
      toast.error("סכום או שער המרה לא תקינים");
      return;
    }

    try {
      // נרמול הקטגוריה ואיחוד עם קטגוריה קיימת זהה (למניעת כפילויות כמו "מסעדות" / " מסעדות ")
      const matchedCategory = availableCategories.find(
        (c) => normalizeCategory(c) === normalizeCategory(newExpense.category)
      );
      const finalCategory =
        matchedCategory ||
        newExpense.category.trim().replace(/\s+/g, " ");

      const expenseData = {
        group_id: group.id,
        title: newExpense.title,
        amount: amountVal,
        currency: newExpense.currency,
        exchange_rate: rateVal,
        amount_in_base: Math.round(amountVal * rateVal * 100) / 100, // עיגול ל-2 ספרות
        payer_name: newExpense.payer_name,
        beneficiaries: newExpense.beneficiaries,
        category: finalCategory,
        date: new Date(newExpense.date).toISOString(),
        owner_email: group.owner_email || user?.email || "",
        shared_with_emails: group.shared_with_emails || [],
        added_by_name: user?.full_name || user?.email || "",
        added_by_email: user?.email || ""
      };

      if (editingExpense) {
        await db.entities.GroupExpense.update(
          editingExpense.id,
          expenseData
        );
        setExpenses(
          expenses.map((e) =>
          e.id === editingExpense.id ?
          { ...e, ...expenseData, id: editingExpense.id } :
          e
          )
        );
        toast.success("ההוצאה עודכנה בהצלחה");
      } else {
        const created = await db.entities.GroupExpense.create(expenseData);
        setExpenses([created, ...expenses]);
        toast.success("ההוצאה נוספה בהצלחה");
      }

      setIsAddExpenseOpen(false);
      setEditingExpense(null);
      setIsRateManual(false);
      setShowCustomCategoryInput(false);
      setNewExpense({
        title: "",
        amount: "",
        currency: group.base_currency,
        exchange_rate: "1",
        payer_name: participants[0] || "",
        beneficiaries: participants,
        category: "כללי",
        date: new Date().toISOString().split("T")[0]
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "לא ניתן לשמור את ההוצאה");
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      currency: expense.currency,
      exchange_rate: expense.exchange_rate.toString(),
      payer_name: expense.payer_name,
      beneficiaries: expense.beneficiaries,
      category: expense.category,
      date: expense.date.split("T")[0]
    });
    setIsRateManual(true);
    // אם הקטגוריה כבר קיימת ברשימה (כולל קטגוריות חופשיות שנשמרו) — הצג אותה ברשימה; אחרת פתח קלט חופשי
    const inList = availableCategories.some(
      (c) => normalizeCategory(c) === normalizeCategory(expense.category)
    );
    setShowCustomCategoryInput(!inList);
    setIsAddExpenseOpen(true);
  };

  const handleSettleDebt = async () => {
    if (!settleData.from || !settleData.to || !settleData.amount) return;

    try {
      // שמירה בדיוק לפי מה שהוזן - from חייב ל-to זכאי
      const created = await db.entities.ExpenseSettlement.create({
        group_id: group.id,
        from_person: settleData.from,
        to_person: settleData.to,
        amount: parseFloat(settleData.amount),
        date: new Date().toISOString(),
        owner_email: group.owner_email || user?.email || "",
        shared_with_emails: group.shared_with_emails || []
      });

      setSettlements([created, ...settlements]);
      setIsSettleOpen(false);
      setSettleData({ from: "", to: "", amount: "" });
      toast.success("התשלום נרשם בהצלחה");
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בשמירת התשלום");
    }
  };

  const handleEditSettlement = (settlement) => {
    setEditingSettlement(settlement);
    setEditSettlementData({
      from_person: settlement.from_person,
      to_person: settlement.to_person,
      amount: settlement.amount.toString(),
      date: settlement.date ? new Date(settlement.date).toISOString().split("T")[0] : ""
    });
    setIsEditSettlementOpen(true);
  };

  const handleSaveEditedSettlement = async () => {
    if (!editSettlementData.from_person || !editSettlementData.to_person || !editSettlementData.amount) {
      toast.error("נא למלא את כל השדות");
      return;
    }

    const amountVal = parseFloat(editSettlementData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("סכום חייב להיות מספר חיובי גדול מאפס");
      return;
    }

    try {
      const updatedData = {
        from_person: editSettlementData.from_person,
        to_person: editSettlementData.to_person,
        amount: amountVal,
        date: editSettlementData.date ? new Date(editSettlementData.date).toISOString() : editingSettlement.date
      };

      await db.entities.ExpenseSettlement.update(editingSettlement.id, updatedData);

      setSettlements(
        settlements.map((s) =>
        s.id === editingSettlement.id ?
        { ...s, ...updatedData } :
        s
        )
      );

      setIsEditSettlementOpen(false);
      setEditingSettlement(null);
      toast.success("ההעברה עודכנה בהצלחה");
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בעדכון ההעברה");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק הוצאה זו?")) return;
    try {
      await db.entities.GroupExpense.delete(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      toast.success("ההוצאה נמחקה");
    } catch (error) {
      toast.error("שגיאה במחיקת ההוצאה");
    }
  };

  const handleDeleteGroup = async () => {
    if (
    !confirm(
      "האם אתה בטוח שברצונך למחוק את הקבוצה? פעולה זו תמחק את כל ההוצאות והמשתתפים ולא ניתן לשחזר."
    ))

    return;

    try {
      await Promise.all(
        expenses.map((exp) =>
        db.entities.GroupExpense.delete(exp.id)
        )
      );
      await Promise.all(
        settlements.map((set) =>
        db.entities.ExpenseSettlement.delete(set.id)
        )
      );
      await db.entities.ExpenseGroup.delete(group.id);

      toast.success("הקבוצה נמחקה בהצלחה");
      if (onGroupDeleted) onGroupDeleted();
    } catch (error) {
      console.error(error);
      toast.error("שגיאה במחיקת הקבוצה");
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) {
      toast.error("נא להזין שם משתתף");
      return;
    }

    if (participants.includes(newParticipantName.trim())) {
      toast.error("משתתף זה כבר קיים");
      return;
    }

    try {
      const updatedParticipants = [
      ...participants,
      newParticipantName.trim()];

      await db.entities.ExpenseGroup.update(group.id, {
        participants: updatedParticipants
      });
      setParticipants(updatedParticipants);
      setNewParticipantName("");
      setIsAddParticipantOpen(false);
      toast.success("המשתתף נוסף בהצלחה");
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בהוספת משתתף");
    }
  };

  const handleRemoveParticipant = async (participantName) => {
    if (participants.length === 1) {
      toast.error("חייבת להיות לפחות משתתף אחד בקבוצה");
      return;
    }

    if (
    !confirm(
      `האם אתה בטוח שברצונך להסיר את ${participantName}? פעולה זו תמחק גם את כל ההוצאות שלו.`
    ))

    return;

    try {
      const updatedParticipants = participants.filter(
        (p) => p !== participantName
      );

      const expensesToDelete = expenses.filter(
        (e) => e.payer_name === participantName
      );
      await Promise.all(
        expensesToDelete.map((exp) =>
        db.entities.GroupExpense.delete(exp.id)
        )
      );

      const expensesToUpdate = expenses.filter(
        (e) =>
        e.payer_name !== participantName &&
        e.beneficiaries.includes(participantName)
      );
      await Promise.all(
        expensesToUpdate.map((exp) =>
        db.entities.GroupExpense.update(exp.id, {
          beneficiaries: exp.beneficiaries.filter(
            (b) => b !== participantName
          )
        })
        )
      );

      await db.entities.ExpenseGroup.update(group.id, {
        participants: updatedParticipants
      });

      setParticipants(updatedParticipants);
      setExpenses(
        expenses.
        filter((e) => e.payer_name !== participantName).
        map((e) => ({
          ...e,
          beneficiaries: e.beneficiaries.filter(
            (b) => b !== participantName
          )
        }))
      );

      toast.success("המשתתף הוסר בהצלחה");
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בהסרת משתתף");
    }
  };

  // --- Render Helpers ---

  const getCategoryIcon = (cat) => {
    const Icon = CATEGORY_ICONS[cat] || Wallet;
    return <Icon className="w-5 h-5" />;
  };

  const formatMoney = (amount, currency = group.base_currency) => {
    return `${CURRENCY_SYMBOLS[currency] || currency} ${amount.toLocaleString(
      undefined,
      { minimumFractionDigits: 0, maximumFractionDigits: 2 }
    )}`;
  };

  const isOwner = user && (group.owner_email === user.email || !group.owner_email && group.created_by_id === user.id);

  const refreshSharedEmails = (updated) => {
    const emails = updated.shared_with_emails || [];
    setSharedEmails(emails);
    onGroupUpdated?.(updated);
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) {
      toast.error("אנא הכנס כתובת מייל תקינה");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = shareEmail.trim();
    if (!emailRegex.test(email)) {
      toast.error("כתובת המייל שהוכנסה אינה תקינה");
      return;
    }
    if (sharedEmails.includes(email)) {
      toast.error("ניהול ההוצאות כבר משותף עם כתובת מייל זו");
      return;
    }
    if (group.owner_email === email) {
      toast.error("לא ניתן לשתף עם עצמך");
      return;
    }
    try {
      const updatedEmails = [...sharedEmails, email];
      const updated = await db.entities.ExpenseGroup.update(group.id, {
        shared_with_emails: updatedEmails
      });
      // הפצת רשימת השיתוף המעודכנת לכל רשומות ההוצאות והסגירות הקיימות,
      // כך שמשתמש שזה עתה שותף יוכל לראות גם הוצאות שנוצרו לפני השיתוף
      await Promise.all([
        db.entities.GroupExpense.updateMany(
          { group_id: group.id },
          { $set: { shared_with_emails: updatedEmails } }
        ),
        db.entities.ExpenseSettlement.updateMany(
          { group_id: group.id },
          { $set: { shared_with_emails: updatedEmails } }
        )
      ]);
      refreshSharedEmails({ ...group, ...updated });
      setShareEmail("");
      toast.success(`ניהול ההוצאות שותף עם ${email}`);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בשיתוף ניהול ההוצאות");
    }
  };

  const handleRemoveShared = async (emailToRemove) => {
    try {
      const updatedEmails = sharedEmails.filter((e) => e !== emailToRemove);
      const updated = await db.entities.ExpenseGroup.update(group.id, {
        shared_with_emails: updatedEmails
      });
      // הפצת רשימת השיתוף המעודכנת לכל רשומות ההוצאות והסגירות הקיימות,
      // כך שהסרת שיתוף תחסום גם הוצאות ישנות מהמשתמש שהוסר
      await Promise.all([
        db.entities.GroupExpense.updateMany(
          { group_id: group.id },
          { $set: { shared_with_emails: updatedEmails } }
        ),
        db.entities.ExpenseSettlement.updateMany(
          { group_id: group.id },
          { $set: { shared_with_emails: updatedEmails } }
        )
      ]);
      refreshSharedEmails({ ...group, ...updated });
      toast.success(`השיתוף עם ${emailToRemove} הוסר`);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בהסרת השיתוף");
    }
  };

  return (
    <div
      className="space-y-6"
      dir="rtl"
      style={{ direction: "rtl", textAlign: "right" }}>
      
      {/* Owner / participant banner */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isOwner ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
        {isOwner ? <ShieldCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
        <span>{isOwner ? "אתה המנהל של ניהול הוצאות זה — שליטה מלאה" : "אתה משתתף בניהול הוצאות משותף — ניתן להוסיף ולערוך הוצאות, אך לא למחוק"}</span>
      </div>

      {/* Participants List */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              משתתפים בקבוצה
            </CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExportDialogOpen(true)}
                className="flex items-center gap-1 flex-1 sm:flex-none">
                
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline">ייצא נתונים</span>
                <span className="xs:hidden">ייצוא</span>
              </Button>
              {isOwner &&
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1 flex-1 sm:flex-none border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                
                  <Share2 className="w-4 h-4" />
                  <span className="hidden xs:inline">שתף ניהול הוצאות</span>
                  <span className="xs:hidden">שתף</span>
                </Button>
              }
              {isOwner &&
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddParticipantOpen(true)}
                className="flex items-center gap-1 flex-1 sm:flex-none">
                
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden xs:inline">הוסף משתתף</span>
                  <span className="xs:hidden">הוסף</span>
                </Button>
              }
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {participants.map((p, i) =>
            <div
              key={i}
              className="px-3 py-1.5 bg-white rounded-full border border-blue-200 text-sm font-medium text-slate-700 shadow-sm flex items-center gap-2 group">
              
                {p}
                {participants.length > 1 && isOwner &&
              <button
                onClick={() => handleRemoveParticipant(p)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700">
                
                    <X className="w-3 h-3" />
                  </button>
              }
              </div>
            )}
          </div>

          {sharedEmails.length > 0 &&
          <div className="mt-4 pt-4 border-t border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                משתתפים משותפים (ניהול הוצאות):
              </p>
              <div className="flex flex-wrap gap-2">
                {sharedEmails.map((email, i) =>
              <div
                key={i}
                className="px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-200 text-sm font-medium text-indigo-700 shadow-sm flex items-center gap-2 group">
                
                    <Mail className="w-3.5 h-3.5" />
                    {email}
                    {isOwner &&
                <button
                  onClick={() => handleRemoveShared(email)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700">
                  
                        <X className="w-3 h-3" />
                      </button>
                }
                  </div>
              )}
              </div>
            </div>
          }
        </CardContent>
      </Card>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* סהכ הוצאות הקבוצה */}
        <Card className="bg-blue-600 text-white border-none shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">סהכ הוצאות הקבוצה</p>
              <h3 className="text-3xl font-bold">
                {formatMoney(totalSpent)}
              </h3>
            </div>
            <Wallet className="w-10 h-10 text-blue-300 opacity-50" />
          </CardContent>
        </Card>

        {/* ההוצאה שלי */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm mb-1">ההוצאה שלי</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {formatMoney(myTotalSpent)}
              </h3>
            </div>
            <Receipt className="w-10 h-10 text-slate-200" />
          </CardContent>
        </Card>

        {/* כרטיס הוסף הוצאה */}
        <Card
          className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsAddExpenseOpen(true)}>
          
          <CardContent className="p-6 flex items-center justify-center gap-3 h-full">
            <Plus className="w-8 h-8 bg-white/20 rounded-full p-1" />
            <span className="text-xl font-semibold">הוסף הוצאה חדשה</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
        dir="rtl">
        
        <TabsList className="w-full grid grid-cols-3 bg-white p-1 shadow-sm border h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs sm:text-sm px-2 py-2">
            
            <span className="hidden sm:inline">תמונת מצב</span>
            <span className="sm:hidden">סקירה</span>
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs sm:text-sm px-2 py-2">
            
            <span className="hidden sm:inline">רשימת הוצאות</span>
            <span className="sm:hidden">הוצאות</span>
          </TabsTrigger>
          <TabsTrigger
            value="balances"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs sm:text-sm px-2 py-2">
            
            <span className="hidden xs:inline">חובות והתחשבנות</span>
            <span className="xs:hidden">חובות</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* גרף פאי - פילוח הוצאות */}
          {expenses.length > 0 &&
          <Card>
              <CardContent className="p-6">
                <ExpensePieChart
                expenses={expenses}
                baseCurrency={group.base_currency}
                currencySymbol={CURRENCY_SYMBOLS[group.base_currency]} />
              
              </CardContent>
            </Card>
          }

          {/* קיזוז חובות מומלץ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">קיזוז חובות מומלץ</CardTitle>
            </CardHeader>
            <CardContent>
              {optimizedDebts.length === 0 ?
              <div className="text-center py-8 text-slate-500 flex flex-col items-center px-1">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                  <p>הכל מאוזן! אין חובות פתוחים.</p>
                </div> :

              <div className="space-y-3">
                  {optimizedDebts.map((debt, i) =>
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  
                      <div className="flex items-center gap-2">
                        {/* החייב מימין באדום */}
                        <div className="font-semibold text-red-600">
                          {debt.from}
                        </div>
                        {/* חץ מימין לשמאל */}
                        <ArrowLeft className="w-4 h-4 text-slate-400" />
                        {/* מי שחייבים לו משמאל בירוק */}
                        <div className="font-semibold text-green-600">
                          {debt.to}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">
                          {formatMoney(debt.amount)}
                        </span>
                        <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSettleData({
                          from: debt.from,
                          to: debt.to,
                          amount: debt.amount.toString()
                        });
                        setIsSettleOpen(true);
                      }}>
                      
                          פרע חוב
                        </Button>
                      </div>
                    </div>
                )}
                </div>
              }
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הוצאות אחרונות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.slice(0, 5).map((exp) =>
                <div
                  key={exp.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  
                    {/* צד ימין - קטגוריה ופרטים */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        {getCategoryIcon(exp.category)}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">
                          {exp.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {exp.payer_name} שילם עבור{" "}
                          {exp.beneficiaries.length === participants.length ?
                        "כולם" :
                        `${exp.beneficiaries.length} חברים`}
                        </p>
                      </div>
                    </div>
                    {/* צד שמאל - סכום ותאריך */}
                    <div className="text-left">
                      <p className="font-bold text-slate-800">
                        {formatMoney(exp.amount, exp.currency)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(exp.date).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                )}
                {expenses.length === 0 &&
                <p className="text-center text-slate-500 py-4">
                    אין פעילות אחרונה
                  </p>
                }
              </div>
              <Button
                variant="link"
                className="w-full mt-2"
                onClick={() => setActiveTab("expenses")}>
                
                הצג את כל ההוצאות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses List Tab */}
        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardContent className="p-0 overflow-x-auto" dir="rtl">
              <Table dir="rtl" style={{ direction: "rtl" }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">תאריך</TableHead>
                    <TableHead className="text-right">תיאור</TableHead>
                    <TableHead className="text-right">קטגוריה</TableHead>
                    <TableHead className="text-right">שולם עי</TableHead>
                    <TableHead className="text-right">נוסף על ידי</TableHead>
                    <TableHead className="text-right">סכום</TableHead>
                    <TableHead className="text-right w-20">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => {
                    const canEdit = isOwner || exp.added_by_email && exp.added_by_email === user?.email;
                    const canDelete = isOwner;
                    return (
                      <TableRow key={exp.id}>
                      <TableCell className="text-slate-500 text-xs text-right">
                        {format(new Date(exp.date), "dd/MM/yy")}
                      </TableCell>
                      <TableCell className="font-medium text-right">
                        {exp.title}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-xs">
                          {getCategoryIcon(exp.category)} {exp.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {exp.payer_name}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">
                        {exp.added_by_name || "—"}
                        {exp.added_by_name && <div className="text-[10px] text-slate-400">{format(new Date(exp.created_date || exp.date), "dd/MM/yy HH:mm")}</div>}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatMoney(exp.amount, exp.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {canEdit &&
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-700"
                              onClick={() => handleEditExpense(exp)}>
                              
                              <Edit className="w-4 h-4" />
                            </Button>
                            }
                          {canDelete &&
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600"
                              onClick={() => handleDeleteExpense(exp.id)}>
                              
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            }
                        </div>
                      </TableCell>
                    </TableRow>);

                  })}
                  {expenses.length === 0 &&
                  <TableRow>
                      <TableCell
                      colSpan={7}
                      className="text-center py-8 text-slate-500">
                      
                        לא נמצאו הוצאות
                      </TableCell>
                    </TableRow>
                  }
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>מאזן כולל</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {participants.map((p) => {
                  const balance = balances[p] || 0;
                  const isBalanced = Math.abs(balance) < 0.01;
                  const isPositive = balance > 0.01;
                  const maxBalance =
                  Math.max(
                    ...Object.values(balances).map(Math.abs)
                  ) || 1;
                  const percent =
                  Math.abs(balance) / maxBalance * 100;

                  return (
                    <div key={p} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{p}</span>
                        <span
                          className={`font-bold ${
                          isBalanced ?
                          "text-slate-500" :
                          isPositive ?
                          "text-green-600" :
                          "text-red-600"}`
                          }
                          dir="ltr">
                          
                          {isBalanced ? "" : isPositive ? "+" : ""}
                          {formatMoney(balance)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full ${
                          isBalanced ?
                          "bg-slate-300" :
                          isPositive ?
                          "bg-green-500" :
                          "bg-red-500"}`
                          }
                          style={{
                            width: `${Math.min(percent, 100)}%`
                          }} />
                        
                      </div>
                      <p className="text-xs text-slate-400">
                        {isBalanced ?
                        "מאוזן" :
                        isPositive ?
                        "זכאי לקבל כסף" :
                        "חייב כסף לקבוצה"}
                      </p>
                    </div>);

                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>היסטוריית העברות</CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ?
              <p className="text-slate-500 text-center">
                  טרם בוצעו העברות כספים
                </p> :

              <div className="space-y-3">
                  {settlements.map((s) =>
                <div
                  key={s.id}
                  className="flex items-center gap-2 text-sm p-2 hover:bg-slate-50 rounded transition-colors">
                  
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="flex-1">
                        <span className="font-bold">
                          {s.from_person}
                        </span>{" "}
                        העביר ל{" "}
                        <span className="font-bold">{s.to_person}</span>
                      </span>
                      <span className="font-bold text-slate-700 shrink-0">
                        {formatMoney(s.amount)}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {format(new Date(s.date), "dd/MM")}
                      </span>
                      {isOwner &&
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-500 hover:text-blue-700 shrink-0"
                    onClick={() => handleEditSettlement(s)}>
                    
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                  }
                    </div>
                )}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* מחיקת קבוצה - למטה בסוף הדף */}
      {isOwner &&
      <Card className="bg-red-50 border-red-200 mt-8">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">
                מחיקת הקבוצה תמחק את כל ההוצאות והנתונים של הקבוצה
                הזו. לא ניתן לשחזר.
              </span>
            </div>
            <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteGroup}
            className="bg-red-600 hover:bg-red-700">
            
              <Trash2 className="w-4 h-4 ml-2" />
              מחק קבוצה
            </Button>
          </CardContent>
        </Card>
      }

      {/* Add/Edit Expense Dialog */}
      <Dialog
        open={isAddExpenseOpen}
        onOpenChange={(open) => {
          setIsAddExpenseOpen(open);
          if (!open) {
            setEditingExpense(null);
            setIsRateManual(false);
            setShowCustomCategoryInput(false);
            setNewExpense({
              title: "",
              amount: "",
              currency: group.base_currency,
              exchange_rate: "1",
              payer_name: participants[0] || "",
              beneficiaries: participants,
              category: "כללי",
              date: new Date().toISOString().split("T")[0]
            });
          }
        }}>
        
        <DialogContent
          dir="rtl"
          className="max-w-lg max-h-[85vh] overflow-y-auto"
          style={{ marginTop: "80px" }}>
          
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "עריכת הוצאה" : "הוספת הוצאה חדשה"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>תיאור ההוצאה</Label>
              <Input
                placeholder="לדוגמה: ארוחת ערב במסעדה"
                value={newExpense.title}
                onChange={(e) =>
                setNewExpense({
                  ...newExpense,
                  title: e.target.value
                })
                } />
              
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label>סכום</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) =>
                  setNewExpense({
                    ...newExpense,
                    amount: e.target.value
                  })
                  } />
                
              </div>
              <div className="w-36">
                <Label>מטבע</Label>
                <Select
                  value={newExpense.currency}
                  onValueChange={(v) =>
                  setNewExpense({ ...newExpense, currency: v })
                  }>
                  
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CURRENCIES.map((c) =>
                    <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.name} ({c.code})
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newExpense.currency !== group.base_currency &&
            <div>
                <Label className="flex items-center justify-between">
                  <span>שער המרה (1 {newExpense.currency} = ? {group.base_currency})</span>
                  {fetchingRate &&
                <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      מושך שער...
                    </span>
                }
                  {!fetchingRate && !isRateManual &&
                <span className="text-xs text-green-600">נמשך אוטומטית</span>
                }
                  {isRateManual &&
                <span className="text-xs text-amber-600">שער ידני</span>
                }
                </Label>
                <Input
                type="number"
                step="0.0001"
                value={newExpense.exchange_rate}
                onChange={(e) => {
                  setNewExpense({
                    ...newExpense,
                    exchange_rate: e.target.value
                  });
                  setIsRateManual(true);
                }} />
              
                <p className="text-xs text-slate-500 mt-1">
                  מחושב:{" "}
                  {formatMoney(
                  parseFloat(newExpense.amount || "0") *
                  parseFloat(newExpense.exchange_rate || "1")
                )}
                </p>
              </div>
            }

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מי שילם?</Label>
                <Select
                  value={newExpense.payer_name}
                  onValueChange={(v) =>
                  setNewExpense({ ...newExpense, payer_name: v })
                  }>
                  
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) =>
                    <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>קטגוריה</Label>
                {showCustomCategoryInput ?
                <div className="flex gap-2">
                    <Input
                    placeholder="הקלד קטגוריה חופשית"
                    value={newExpense.category}
                    onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                    } />
                  
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setShowCustomCategoryInput(false);
                      setNewExpense({ ...newExpense, category: "כללי" });
                    }}>
                    
                      רשימה
                    </Button>
                  </div> :

                <Select
                  value={availableCategories.some((c) =>
                    normalizeCategory(c) === normalizeCategory(newExpense.category)
                  ) ?
                  newExpense.category :
                  "__custom__"}
                  onValueChange={(v) => {
                    if (v === "__custom__") {
                      setShowCustomCategoryInput(true);
                      setNewExpense({ ...newExpense, category: "" });
                    } else {
                      setNewExpense({ ...newExpense, category: v });
                    }
                  }}>

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((c) =>
                    <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                    )}
                      <SelectItem value="__custom__">➕ הוסף קטגוריה חדשה…</SelectItem>
                    </SelectContent>
                  </Select>
                }
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                עבור מי? (מי משתתף בהוצאה)
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border">
                {participants.map((p) =>
                <div
                  key={p}
                  className="flex items-center space-x-2 space-x-reverse">
                  
                    <Checkbox
                    id={`ben-${p}`}
                    checked={newExpense.beneficiaries.includes(p)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewExpense((prev) => ({
                          ...prev,
                          beneficiaries: [...prev.beneficiaries, p]
                        }));
                      } else {
                        setNewExpense((prev) => ({
                          ...prev,
                          beneficiaries: prev.beneficiaries.filter(
                            (b) => b !== p
                          )
                        }));
                      }
                    }} />
                  
                    <label
                    htmlFor={`ben-${p}`}
                    className="text-sm cursor-pointer select-none">
                    
                      {p}
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>תאריך</Label>
              <Input
                type="date"
                value={newExpense.date}
                onChange={(e) =>
                setNewExpense({
                  ...newExpense,
                  date: e.target.value
                })
                } />
              
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveExpense}>
              {editingExpense ? "עדכן הוצאה" : "שמור הוצאה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle Debt Dialog */}
      <Dialog open={isSettleOpen} onOpenChange={setIsSettleOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>סגירת חוב (העברת כספים)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* תצוגת החייב והזוכה */}
            <div className="flex items-center justify-center gap-4 text-lg font-medium">
              {/* החייב מימין באדום */}
              <span className="text-red-600">{settleData.from}</span>
              {/* חץ מימין לשמאל */}
              <ArrowLeft className="text-slate-400 w-6 h-6" />
              {/* הזוכה משמאל בירוק */}
              <span className="text-green-600">{settleData.to}</span>
            </div>
            
            {/* שדה סכום */}
            <div>
              <Label>סכום להעברה ({group.base_currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={settleData.amount}
                onChange={(e) =>
                setSettleData({
                  ...settleData,
                  amount: e.target.value
                })
                }
                placeholder="0.00" />
              
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSettleDebt}>אשר העברה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog
        open={isAddParticipantOpen}
        onOpenChange={setIsAddParticipantOpen}>
        
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת משתתף חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>שם המשתתף</Label>
              <Input
                placeholder="לדוגמה: דני, יוסי..."
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)} />
              
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddParticipantOpen(false)}>
              
              ביטול
            </Button>
            <Button onClick={handleAddParticipant}>הוסף</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        expenses={expenses}
        settlements={settlements}
        participants={participants}
        groupName={group.name}
        baseCurrency={group.base_currency} />
      

      {/* Share Expense Management Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>שיתוף ניהול הוצאות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              שתף את ניהול ההוצאות עם חברים נוספים. הזן את כתובת המייל שבה נרשמו לאתר.
              המשתתפים יוכלו לצפות בהוצאות ולהוסיף הוצאות חדשות, אך רק אתה (המנהל) תוכל למחוק הוצאות.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="הכנס כתובת מייל"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {if (e.key === "Enter") handleShare();}} />
              
              <Button onClick={handleShare} className="bg-indigo-600 hover:bg-indigo-700">
                <Share2 className="w-4 h-4 ml-1" />
                שתף
              </Button>
            </div>
            {sharedEmails.length > 0 &&
            <div className="space-y-2 pt-2 border-t">
                <Label className="flex items-center gap-1 text-sm">
                  <Users className="w-4 h-4 text-indigo-600" />
                  משותף עם ({sharedEmails.length}):
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sharedEmails.map((email) =>
                <div key={email} className="flex justify-between items-center p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <span className="flex items-center gap-2 text-sm text-indigo-800">
                        <Mail className="w-3.5 h-3.5" />
                        {email}
                      </span>
                      <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-red-50"
                    onClick={() => handleRemoveShared(email)}>
                    
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                )}
                </div>
              </div>
            }
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareOpen(false)}>סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Settlement Dialog */}
      <Dialog
        open={isEditSettlementOpen}
        onOpenChange={(open) => {
          setIsEditSettlementOpen(open);
          if (!open) {
            setEditingSettlement(null);
          }
        }}>
        
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת העברה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מעביר (חייב)</Label>
                <Select
                  value={editSettlementData.from_person}
                  onValueChange={(v) =>
                  setEditSettlementData({
                    ...editSettlementData,
                    from_person: v
                  })
                  }>
                  
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) =>
                    <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>מקבל (זכאי)</Label>
                <Select
                  value={editSettlementData.to_person}
                  onValueChange={(v) =>
                  setEditSettlementData({
                    ...editSettlementData,
                    to_person: v
                  })
                  }>
                  
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) =>
                    <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>סכום ({group.base_currency})</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={editSettlementData.amount}
                onChange={(e) =>
                setEditSettlementData({
                  ...editSettlementData,
                  amount: e.target.value
                })
                }
                placeholder="0.00" />
              
            </div>

            <div>
              <Label>תאריך</Label>
              <Input
                type="date"
                value={editSettlementData.date}
                onChange={(e) =>
                setEditSettlementData({
                  ...editSettlementData,
                  date: e.target.value
                })
                } />
              
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSettlementOpen(false);
                setEditingSettlement(null);
              }}>
              
              ביטול
            </Button>
            <Button onClick={handleSaveEditedSettlement}>שמור שינויים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}