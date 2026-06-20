const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, HelpCircle } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const empty = { question: "", answer: "", display_on: [], sort_order: 0, is_active: true };

export default function FaqManager() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.entities.FAQ.list("sort_order");
      setFaqs(data || []);
    } catch { sonnerToast.error("שגיאה בטעינת השאלות"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const togglePage = (page) => {
    setEditing((prev) => {
      const current = prev.display_on || [];
      return {
        ...prev,
        display_on: current.includes(page)
          ? current.filter((p) => p !== page)
          : [...current, page],
      };
    });
  };

  const handleSave = async () => {
    if (!editing?.question?.trim() || !editing?.answer?.trim()) {
      sonnerToast.error("נא למלא שאלה ותשובה");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing, sort_order: Number(editing.sort_order) || 0 };
      if (editing.id) {
        await db.entities.FAQ.update(editing.id, payload);
        sonnerToast.success("השאלה עודכנה");
      } else {
        await db.entities.FAQ.create(payload);
        sonnerToast.success("השאלה נוספה");
      }
      setEditing(null);
      await load();
    } catch { sonnerToast.error("שגיאה בשמירה"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await db.entities.FAQ.delete(deleteId);
      sonnerToast.success("השאלה נמחקה");
      setDeleteId(null);
      await load();
    } catch { sonnerToast.error("שגיאה במחיקה"); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את השאלה?</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editing !== null ? (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{editing.id ? "עריכת שאלה" : "שאלה חדשה"}</CardTitle>
              <Button variant="outline" onClick={() => setEditing(null)}>ביטול</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>שאלה <span className="text-red-500">*</span></Label>
              <Input value={editing.question} onChange={(e) => setEditing((p) => ({ ...p, question: e.target.value }))} placeholder="מה השאלה?" />
            </div>
            <div>
              <Label>תשובה <span className="text-red-500">*</span></Label>
              <Textarea value={editing.answer} onChange={(e) => setEditing((p) => ({ ...p, answer: e.target.value }))} rows={4} placeholder="התשובה..." />
            </div>
            <div>
              <Label className="mb-2 block">הצג בדפים</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={(editing.display_on || []).includes("home")} onCheckedChange={() => togglePage("home")} />
                  <span>דף הבית</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={(editing.display_on || []).includes("guides")} onCheckedChange={() => togglePage("guides")} />
                  <span>דף מדריכים</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>סדר הצגה</Label>
                <Input type="number" value={editing.sort_order || 0} onChange={(e) => setEditing((p) => ({ ...p, sort_order: e.target.value }))} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={editing.is_active !== false} onCheckedChange={(v) => setEditing((p) => ({ ...p, is_active: v }))} />
                  <span>פעיל (מוצג באתר)</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>ביטול</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "שומר..." : editing.id ? "עדכן" : "הוסף"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                ניהול שאלות נפוצות ({faqs.length})
              </CardTitle>
              <Button onClick={() => setEditing({ ...empty })}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף שאלה
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
            ) : faqs.length === 0 ? (
              <p className="text-center text-slate-500 py-8">אין שאלות עדיין. לחץ "הוסף שאלה" כדי להתחיל.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div key={faq.id} className="flex items-start gap-3 p-4 border rounded-xl bg-slate-50 hover:bg-white transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 mb-1">{faq.question}</p>
                      <p className="text-sm text-slate-500 line-clamp-2">{faq.answer}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(faq.display_on || []).includes("home") && <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">דף הבית</Badge>}
                        {(faq.display_on || []).includes("guides") && <Badge variant="outline" className="text-xs text-green-700 border-green-300">מדריכים</Badge>}
                        {!faq.is_active && <Badge variant="secondary" className="text-xs">מוסתר</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ ...faq })}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(faq.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}