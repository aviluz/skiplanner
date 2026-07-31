const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Upload, FileText, Link2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const ARTICLE_CATEGORIES = [
  "הכנה לחופשה",
  "טיפים",
  "בטיחות",
  "ציוד",
  "יעדים",
  "תזונה",
  "כלכלה",
  "כשרות",
  "כללי",
];

const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .substring(0, 80);

const emptyArticle = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image_url: "",
  featured_image_alt: "",
  category: "כללי",
  status: "draft",
  meta_title: "",
  meta_description: "",
};

export default function ArticlesManager({ onFileUpload }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list view, {} = new, {...} = edit
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await db.entities.BlogArticle.list("-created_date");
      setArticles(data || []);
    } catch (e) {
      sonnerToast.error("שגיאה בטעינת המאמרים");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title) => {
    setEditing((prev) => ({
      ...prev,
      title,
      slug: prev.slug && prev._slugEdited ? prev.slug : generateSlug(title),
    }));
  };

  const handleSlugChange = (slug) => {
    setEditing((prev) => ({ ...prev, slug, _slugEdited: true }));
  };

  const handleSave = async () => {
    const titleTrimmed = (editing?.title || "").trim();
    const contentStripped = (editing?.content || "").replace(/<[^>]*>/g, "").trim();
    if (!titleTrimmed) {
      sonnerToast.error("נא למלא כותרת למאמר");
      return;
    }
    if (!contentStripped) {
      sonnerToast.error("נא למלא תוכן למאמר");
      return;
    }
    setSaving(true);
    const isNew = !editing.id;
    const payload = { ...editing };
    delete payload._slugEdited;
    if (!payload.slug) payload.slug = generateSlug(payload.title);
    if (payload.status === "published" && !payload.published_at) {
      payload.published_at = new Date().toISOString();
    }
    try {
      if (isNew) {
        await db.entities.BlogArticle.create(payload);
        sonnerToast.success("המאמר נוצר בהצלחה");
      } else {
        await db.entities.BlogArticle.update(editing.id, payload);
        sonnerToast.success("המאמר עודכן בהצלחה");
      }
      setEditing(null);
      await loadArticles();
    } catch (e) {
      sonnerToast.error("שגיאה בשמירת המאמר");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await db.entities.BlogArticle.delete(deleteConfirm);
      sonnerToast.success("המאמר נמחק");
      setDeleteConfirm(null);
      await loadArticles();
    } catch (e) {
      sonnerToast.error("שגיאה במחיקה");
    }
  };

  const handleToggleStatus = async (article) => {
    const newStatus = article.status === "published" ? "draft" : "published";
    const payload = { status: newStatus };
    if (newStatus === "published" && !article.published_at) {
      payload.published_at = new Date().toISOString();
    }
    try {
      await db.entities.BlogArticle.update(article.id, payload);
      sonnerToast.success(newStatus === "published" ? "המאמר פורסם" : "המאמר הוחזר לטיוטה");
      await loadArticles();
    } catch (e) {
      sonnerToast.error("שגיאה בעדכון הסטטוס");
    }
  };

  const filtered = articles.filter((a) => {
    const matchSearch = !searchTerm || a.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === "all" || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  const quillModules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  // ── FORM VIEW ──
  if (editing !== null) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {editing.id ? "עריכת מאמר" : "מאמר חדש"}
          </h2>
          <Button variant="outline" onClick={() => setEditing(null)}>חזרה לרשימה</Button>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader><CardTitle>פרטי מאמר</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div>
              <Label>כותרת המאמר <span className="text-red-500">*</span></Label>
              <Input value={editing.title || ""} onChange={(e) => handleTitleChange(e.target.value)} placeholder="כותרת המאמר" />
            </div>

            {/* Slug */}
            <div>
              <Label>URL Slug (באנגלית)</Label>
              <Input
                value={editing.slug || ""}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="how-to-choose-ski-gear"
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-slate-500 mt-1">נוצר אוטומטית מהכותרת, ניתן לעריכה ידנית</p>
            </div>

            {/* Excerpt */}
            <div>
              <Label>תקציר</Label>
              <Textarea value={editing.excerpt || ""} onChange={(e) => setEditing((p) => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="משפט קצר שיופיע בכרטיס המאמר" />
            </div>

            {/* Category + Status */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>קטגוריה</Label>
                <Select value={editing.category || "כללי"} onValueChange={(v) => setEditing((p) => ({ ...p, category: v }))}>
                  <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-right">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>סטטוס</Label>
                <Select value={editing.status || "draft"} onValueChange={(v) => setEditing((p) => ({ ...p, status: v }))}>
                  <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft" className="text-right">טיוטה</SelectItem>
                    <SelectItem value="published" className="text-right">פורסם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <Label>תמונה ראשית</Label>
              <div className="flex items-center gap-2">
                <Input value={editing.featured_image_url || ""} onChange={(e) => setEditing((p) => ({ ...p, featured_image_url: e.target.value }))} placeholder="https://..." />
                <Input id="article-img-upload" type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files[0] && onFileUpload) onFileUpload(e.target.files[0], (url) => setEditing((p) => ({ ...p, featured_image_url: url }))); }}
                />
                <Label htmlFor="article-img-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer"><Upload className="w-4 h-4" /></span>
                  </Button>
                </Label>
              </div>
              <Input className="mt-2" value={editing.featured_image_alt || ""} onChange={(e) => setEditing((p) => ({ ...p, featured_image_alt: e.target.value }))} placeholder="טקסט אלט לתמונה (חשוב לנגישות ו-SEO)" />
              {editing.featured_image_url && (
                <img src={editing.featured_image_url} alt="תצוגה מקדימה" className="mt-2 h-36 w-auto rounded-lg object-cover" />
              )}
            </div>

            {/* Rich Text Editor */}
            <div>
              <Label>תוכן המאמר <span className="text-red-500">*</span></Label>
              <div className="mt-2 rounded-lg border overflow-hidden" dir="ltr">
                <ReactQuill
                  theme="snow"
                  value={editing.content || ""}
                  onChange={(v) => setEditing((p) => ({ ...p, content: v }))}
                  modules={quillModules}
                  style={{ minHeight: "300px" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Card */}
        <Card className="border-0 shadow-xl border-l-4 border-l-blue-500">
          <CardHeader><CardTitle className="flex items-center gap-2">🔍 הגדרות SEO</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between">
                <Label>Meta Title (לגוגל)</Label>
                <span className={`text-xs ${(editing.meta_title || "").length > 60 ? "text-red-500" : "text-slate-400"}`}>
                  {(editing.meta_title || "").length}/60
                </span>
              </div>
              <Input value={editing.meta_title || ""} onChange={(e) => setEditing((p) => ({ ...p, meta_title: e.target.value }))} maxLength={70} placeholder="כותרת לתוצאות החיפוש של גוגל" />
            </div>
            <div>
              <div className="flex justify-between">
                <Label>Meta Description</Label>
                <span className={`text-xs ${(editing.meta_description || "").length > 155 ? "text-red-500" : "text-slate-400"}`}>
                  {(editing.meta_description || "").length}/155
                </span>
              </div>
              <Textarea value={editing.meta_description || ""} onChange={(e) => setEditing((p) => ({ ...p, meta_description: e.target.value }))} maxLength={165} rows={2} placeholder="תיאור לתוצאות החיפוש של גוגל" />
            </div>
          </CardContent>
        </Card>

        {/* Related Articles */}
        <Card className="border-0 shadow-xl border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-purple-600" />
              כתבות נוספות לקישור
            </CardTitle>
            <p className="text-sm text-slate-500">
              בחר מאמרים שיופיעו בתחתית המאמר תחת "כתבות נוספות שעשויות לעניין אותך". אם לא נבחרו, יוצגו אוטומטית מאמרים מאותה קטגוריה.
            </p>
          </CardHeader>
          <CardContent>
            {articles.length <= 1 ? (
              <p className="text-sm text-slate-400 text-center py-4">אין עדיין מאמרים אחרים לקישור.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1 border rounded-lg p-3 bg-slate-50">
                {articles
                  .filter((a) => a.id !== editing.id)
                  .map((a) => {
                    const checked = (editing.related_article_ids || []).includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) =>
                            setEditing((prev) => ({
                              ...prev,
                              related_article_ids: val
                                ? [...(prev.related_article_ids || []), a.id]
                                : (prev.related_article_ids || []).filter((id) => id !== a.id),
                            }))
                          }
                        />
                        <span className="flex-1 min-w-0">
                          <span className="font-medium text-slate-800 text-sm block truncate">{a.title}</span>
                          {a.category && (
                            <span className="text-xs text-slate-400">{a.category}</span>
                          )}
                        </span>
                        <Badge variant={a.status === "published" ? "default" : "secondary"} className={a.status === "published" ? "bg-green-600 text-xs" : "text-xs"}>
                          {a.status === "published" ? "פורסם" : "טיוטה"}
                        </Badge>
                      </label>
                    );
                  })}
              </div>
            )}
            {(editing.related_article_ids || []).length > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                נבחרו {(editing.related_article_ids || []).length} מאמרים מקושרים
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEditing(null)}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "שומר..." : editing.id ? "עדכן מאמר" : "צור מאמר"}
          </Button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-6" dir="rtl">
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את המאמר?</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              ניהול מאמרים ומדריכים ({articles.length})
            </CardTitle>
            <Button onClick={() => setEditing({ ...emptyArticle })}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף מאמר חדש
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mt-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חיפוש מאמר..." className="pr-9" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-right">כל הקטגוריות</SelectItem>
                {ARTICLE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-right">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">אין מאמרים עדיין. לחץ על "הוסף מאמר חדש" כדי להתחיל.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((article) => (
                <div key={article.id} className="flex items-start gap-4 p-4 border rounded-xl bg-slate-50 hover:bg-white transition-colors">
                  {article.featured_image_url && (
                    <img src={article.featured_image_url} alt={article.title} className="w-20 h-16 object-cover rounded-lg flex-shrink-0 hidden sm:block" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">{article.title}</h4>
                      <Badge variant={article.status === "published" ? "default" : "secondary"} className={article.status === "published" ? "bg-green-600" : ""}>
                        {article.status === "published" ? "פורסם" : "טיוטה"}
                      </Badge>
                      {article.category && (
                        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">{article.category}</Badge>
                      )}
                    </div>
                    {article.excerpt && <p className="text-sm text-slate-500 line-clamp-1">{article.excerpt}</p>}
                    <p className="text-xs text-slate-400 mt-1">{new Date(article.created_date).toLocaleDateString("he-IL")}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(article)} title={article.status === "published" ? "הסתר" : "פרסם"}>
                      {article.status === "published" ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4 text-green-600" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ ...article })}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(article.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}