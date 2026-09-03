const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Upload, FileText, Link2, Star, Settings2, Tag } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { isValidSlug, articleUrl } from "@/lib/articleUtils";

const DEFAULT_CATEGORIES = [
  { name: "הכנה לחופשה", slug: "preparation", sort_order: 0, is_active: true, description: "", meta_title: "", meta_description: "" },
  { name: "טיפים", slug: "tips", sort_order: 1, is_active: true, description: "", meta_title: "", meta_description: "" },
  { name: "בטיחות", slug: "safety", sort_order: 2, is_active: true, description: "", meta_title: "", meta_description: "" },
  { name: "ציוד", slug: "equipment", sort_order: 3, is_active: true, description: "", meta_title: "", meta_description: "" },
  { name: "יעדים", slug: "destinations", sort_order: 4, is_active: true, description: "", meta_title: "", meta_description: "" },
  { name: "כללי", slug: "general", sort_order: 5, is_active: true, description: "", meta_title: "", meta_description: "" },
];

const ARTICLE_STATUS_OPTIONS = [
  { value: "draft", label: "טיוטה" },
  { value: "review", label: "בבדיקה" },
  { value: "published", label: "פורסם" },
  { value: "scheduled", label: "מתוזמן" },
  { value: "archived", label: "בארכיון" },
];

const emptyArticle = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image_url: "",
  featured_image_alt: "",
  category: "",
  author_name: "",
  status: "draft",
  is_featured: false,
  is_visible_on_articles: true,
  sort_order: 0,
  show_in_menu: false,
  menu_order: 0,
  meta_title: "",
  meta_description: "",
  og_title: "",
  og_description: "",
  og_image: "",
  canonical_url: "",
};

const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .substring(0, 80);

export default function ArticlesManager({ onFileUpload }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("articles");
  const [categories, setCategories] = useState([]);
  const [pageSettings, setPageSettings] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [articlesData, settingsData] = await Promise.all([
        db.entities.BlogArticle.list("-created_date"),
        db.entities.SiteSettings.list().catch(() => []),
      ]);
      setArticles(articlesData || []);

      const map = (settingsData || []).reduce((acc, s) => ({ ...acc, [s.setting_name]: s.value }), {});
      let cats = [];
      try {
        cats = JSON.parse(map.article_categories || "[]");
        if (!Array.isArray(cats)) cats = [];
      } catch { cats = []; }
      if (!cats.length) cats = DEFAULT_CATEGORIES;
      setCategories(cats);
      setPageSettings(map);
    } catch (e) {
      sonnerToast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  // ── Menu sync: rebuild articles_menu_items SiteSettings JSON from show_in_menu articles ──
  const syncMenuItems = async (allArticles) => {
    const menuItems = allArticles
      .filter((a) => a.show_in_menu && a.status === "published")
      .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0))
      .slice(0, 4)
      .map((a) => ({ id: a.id, title: a.title, url: articleUrl(a), order: a.menu_order || 0 }));
    const json = JSON.stringify(menuItems);
    try {
      const existing = await db.entities.SiteSettings.filter({ setting_name: "articles_menu_items" });
      if (existing.length > 0) {
        await db.entities.SiteSettings.update(existing[0].id, { value: json });
      } else {
        await db.entities.SiteSettings.create({ setting_name: "articles_menu_items", value: json });
      }
    } catch (e) {
      console.error("Failed to sync menu items:", e);
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
    setSlugError("");
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

    // ── Slug validation ──
    const slug = (editing.slug || "").trim();
    if (!slug) {
      setSlugError("חובה להזין Slug (כתובת URL באנגלית)");
      sonnerToast.error("חובה להזין Slug");
      return;
    }
    if (!isValidSlug(slug)) {
      setSlugError("Slug לא תקין: רק אותיות אנגליות קטנות, מספרים ומקפים. אסור רווחים, תווים מיוחדים, מקפים כפולים, או מקף בהתחלה/סוף.");
      sonnerToast.error("Slug לא תקין");
      return;
    }
    // uniqueness check
    try {
      const existing = await db.entities.BlogArticle.filter({ slug });
      const duplicate = existing.find((a) => a.id !== editing.id);
      if (duplicate) {
        setSlugError(`Slug "${slug}" כבר בשימוש במאמר אחר (${duplicate.title}). אנא בחר Slug אחר.`);
        sonnerToast.error("Slug כבר קיים — אנא בחר Slug אחר");
        return;
      }
    } catch (e) {
      // ignore filter errors — proceed
    }

    setSaving(true);
    const isNew = !editing.id;
    const payload = { ...editing };
    delete payload._slugEdited;
    if (payload.status === "published" && !payload.published_at) {
      payload.published_at = new Date().toISOString();
    }
    // scheduled: don't set published_at to now; only when it becomes published
    if (payload.status === "scheduled" && !payload.published_at && payload.scheduled_at) {
      payload.published_at = payload.scheduled_at;
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
      setSlugError("");
      await loadAll();
      // sync menu items after reload
      const refreshed = await db.entities.BlogArticle.list("-created_date");
      await syncMenuItems(refreshed);
    } catch (e) {
      sonnerToast.error("שגיאה בשמירת המאמר: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await db.entities.BlogArticle.delete(deleteConfirm);
      sonnerToast.success("המאמר נמחק");
      setDeleteConfirm(null);
      await loadAll();
      const refreshed = await db.entities.BlogArticle.list("-created_date");
      await syncMenuItems(refreshed);
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
      await loadAll();
      if (newStatus === "published" || article.show_in_menu) {
        const refreshed = await db.entities.BlogArticle.list("-created_date");
        await syncMenuItems(refreshed);
      }
    } catch (e) {
      sonnerToast.error("שגיאה בעדכון הסטטוס");
    }
  };

  // ── Categories management ──
  const saveCategories = async (newCats) => {
    const json = JSON.stringify(newCats);
    try {
      const existing = await db.entities.SiteSettings.filter({ setting_name: "article_categories" });
      if (existing.length > 0) {
        await db.entities.SiteSettings.update(existing[0].id, { value: json });
      } else {
        await db.entities.SiteSettings.create({ setting_name: "article_categories", value: json });
      }
      setCategories(newCats);
      sonnerToast.success("הקטגוריות נשמרו");
    } catch (e) {
      sonnerToast.error("שגיאה בשמירת הקטגוריות");
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory?.name?.trim()) {
      sonnerToast.error("נא להזין שם קטגוריה");
      return;
    }
    const slug = editingCategory.slug || generateSlug(editingCategory.name);
    if (!isValidSlug(slug)) {
      sonnerToast.error("Slug של הקטגוריה אינו תקין");
      return;
    }
    const exists = categories.find((c) => c.slug === slug && c.name !== editingCategory.name);
    if (exists) {
      sonnerToast.error("קטגוריה עם Slug זה כבר קיימת");
      return;
    }
    const newCat = {
      name: editingCategory.name.trim(),
      slug,
      sort_order: Number(editingCategory.sort_order) || 0,
      is_active: editingCategory.is_active !== false,
      description: editingCategory.description || "",
      meta_title: editingCategory.meta_title || "",
      meta_description: editingCategory.meta_description || "",
    };
    let newCats;
    if (editingCategory._oldName) {
      newCats = categories.map((c) => (c.name === editingCategory._oldName ? newCat : c));
    } else {
      newCats = [...categories, newCat];
    }
    await saveCategories(newCats);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async () => {
    const catName = categoryDeleteConfirm;
    // check if articles use this category
    const usedBy = articles.filter((a) => a.category === catName);
    if (usedBy.length > 0) {
      sonnerToast.error(`לא ניתן למחוק — ${usedBy.length} מאמרים משויכים לקטגוריה זו. אנא שייך אותם לקטגוריה אחרת תחילה.`);
      setCategoryDeleteConfirm(null);
      return;
    }
    const newCats = categories.filter((c) => c.name !== catName);
    await saveCategories(newCats);
    setCategoryDeleteConfirm(null);
  };

  // ── Page settings management ──
  const savePageSetting = async (key, value) => {
    setSaving(true);
    try {
      const existing = await db.entities.SiteSettings.filter({ setting_name: key });
      const isDefaultOrEmpty = !value;
      if (existing.length > 0) {
        if (isDefaultOrEmpty) {
          await db.entities.SiteSettings.delete(existing[0].id);
        } else {
          await db.entities.SiteSettings.update(existing[0].id, { value });
        }
      } else if (!isDefaultOrEmpty) {
        await db.entities.SiteSettings.create({ setting_name: key, value });
      }
      setPageSettings((prev) => ({ ...prev, [key]: value }));
      sonnerToast.success("ההגדרה נשמרה");
    } catch (e) {
      sonnerToast.error("שגיאה בשמירת ההגדרה");
    } finally {
      setSaving(false);
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
          <Button variant="outline" onClick={() => { setEditing(null); setSlugError(""); }}>חזרה לרשימה</Button>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader><CardTitle>פרטי מאמר</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>כותרת המאמר <span className="text-red-500">*</span></Label>
              <Input value={editing.title || ""} onChange={(e) => handleTitleChange(e.target.value)} placeholder="כותרת המאמר" />
            </div>

            <div>
              <Label>URL Slug (באנגלית) <span className="text-red-500">*</span></Label>
              <Input
                value={editing.slug || ""}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="how-to-choose-ski-gear"
                dir="ltr"
                className="text-left"
              />
              {slugError ? (
                <p className="text-xs text-red-500 mt-1">{slugError}</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">אותיות אנגליות קטנות, מספרים ומקפים בלבד. לא ניתן לשנות אוטומטית לאחר עריכה ידנית.</p>
              )}
            </div>

            <div>
              <Label>תקציר</Label>
              <Textarea value={editing.excerpt || ""} onChange={(e) => setEditing((p) => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="משפט קצר שיופיע בכרטיס המאמר" />
            </div>

            <div>
              <Label>שם מחבר</Label>
              <Input value={editing.author_name || ""} onChange={(e) => setEditing((p) => ({ ...p, author_name: e.target.value }))} placeholder="שם הכותב" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>קטגוריה</Label>
                <Select value={editing.category || ""} onValueChange={(v) => setEditing((p) => ({ ...p, category: v }))}>
                  <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.is_active !== false).map((c) => (
                      <SelectItem key={c.slug || c.name} value={c.name} className="text-right">{c.name}</SelectItem>
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
                    {ARTICLE_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-right">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editing.status === "scheduled" && (
              <div>
                <Label>תאריך פרסום מתוכנן</Label>
                <Input
                  type="datetime-local"
                  value={editing.scheduled_at ? editing.scheduled_at.slice(0, 16) : ""}
                  onChange={(e) => setEditing((p) => ({ ...p, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                />
                <p className="text-xs text-slate-500 mt-1">המאמר לא יוצג לפני מועד זה (בזמן המערכת).</p>
              </div>
            )}

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

            {/* Display & menu options */}
            <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="art_featured" checked={!!editing.is_featured} onCheckedChange={(v) => setEditing((p) => ({ ...p, is_featured: v }))} />
                <Label htmlFor="art_featured" className="cursor-pointer flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" /> מאמר מוביל (יופיע בראש עמוד המאמרים)
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="art_visible" checked={editing.is_visible_on_articles !== false} onCheckedChange={(v) => setEditing((p) => ({ ...p, is_visible_on_articles: v }))} />
                <Label htmlFor="art_visible" className="cursor-pointer">הצג בעמוד המאמרים</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="art_menu" checked={!!editing.show_in_menu} onCheckedChange={(v) => setEditing((p) => ({ ...p, show_in_menu: v }))} />
                <Label htmlFor="art_menu" className="cursor-pointer">הצג בתפריט העליון (מאמר נבחר)</Label>
              </div>
              <div>
                <Label>סדר הצגה ידני</Label>
                <Input type="number" value={editing.sort_order || 0} onChange={(e) => setEditing((p) => ({ ...p, sort_order: Number(e.target.value) }))} />
              </div>
              {editing.show_in_menu && (
                <div>
                  <Label>סדר בתפריט</Label>
                  <Input type="number" value={editing.menu_order || 0} onChange={(e) => setEditing((p) => ({ ...p, menu_order: Number(e.target.value) }))} />
                </div>
              )}
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
            <div>
              <Label>Open Graph Title</Label>
              <Input value={editing.og_title || ""} onChange={(e) => setEditing((p) => ({ ...p, og_title: e.target.value }))} placeholder="כותרת לשיתוף ברשתות חברתיות" />
            </div>
            <div>
              <Label>Open Graph Description</Label>
              <Textarea value={editing.og_description || ""} onChange={(e) => setEditing((p) => ({ ...p, og_description: e.target.value }))} rows={2} placeholder="תיאור לשיתוף ברשתות חברתיות" />
            </div>
            <div>
              <Label>Open Graph Image URL</Label>
              <Input value={editing.og_image || ""} onChange={(e) => setEditing((p) => ({ ...p, og_image: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Canonical URL (אופציונלי)</Label>
              <Input value={editing.canonical_url || ""} onChange={(e) => setEditing((p) => ({ ...p, canonical_url: e.target.value }))} placeholder="https://..." dir="ltr" className="text-left" />
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
              בחר מאמרים שיופיעו בתחתית המאמר. אם לא נבחרו, יוצגו אוטומטית מאמרים מאותה קטגוריה.
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
                      <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
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
                          {a.category && <span className="text-xs text-slate-400">{a.category}</span>}
                        </span>
                        <Badge variant={a.status === "published" ? "default" : "secondary"} className={a.status === "published" ? "bg-green-600 text-xs" : "text-xs"}>
                          {a.status === "published" ? "פורסם" : a.status === "draft" ? "טיוטה" : a.status}
                        </Badge>
                      </label>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setEditing(null); setSlugError(""); }}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "שומר..." : editing.id ? "עדכן מאמר" : "צור מאמר"}
          </Button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW with sub-tabs ──
  return (
    <div className="space-y-6" dir="rtl">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b pb-3">
        <button onClick={() => setActiveSubTab("articles")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSubTab === "articles" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          <FileText className="w-4 h-4 inline ml-1" /> מאמרים ({articles.length})
        </button>
        <button onClick={() => setActiveSubTab("categories")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSubTab === "categories" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          <Tag className="w-4 h-4 inline ml-1" /> קטגוריות ({categories.length})
        </button>
        <button onClick={() => setActiveSubTab("settings")} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSubTab === "settings" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
          <Settings2 className="w-4 h-4 inline ml-1" /> הגדרות עמוד Articles
        </button>
      </div>

      {/* Delete article dialog */}
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

      {/* Delete category dialog */}
      <AlertDialog open={!!categoryDeleteConfirm} onOpenChange={() => setCategoryDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת קטגוריה "{categoryDeleteConfirm}"?</AlertDialogTitle>
            <AlertDialogDescription>אם מאמרים משויכים לקטגוריה זו, המחיקה תיחסם. אנא שייך אותם לקטגוריה אחרת תחילה.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ARTICLES SUB-TAB */}
      {activeSubTab === "articles" && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ניהול מאמרים ({articles.length})
              </CardTitle>
              <Button onClick={() => { setEditing({ ...emptyArticle, category: categories[0]?.name || "" }); setSlugError(""); }}>
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
                  {categories.map((c) => (
                    <SelectItem key={c.slug || c.name} value={c.name} className="text-right">{c.name}</SelectItem>
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
                <p className="text-slate-500">אין מאמרים. לחץ על "הוסף מאמר חדש" כדי להתחיל.</p>
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
                          {ARTICLE_STATUS_OPTIONS.find((s) => s.value === article.status)?.label || article.status}
                        </Badge>
                        {article.is_featured && <Badge className="bg-amber-500 text-white"><Star className="w-3 h-3 ml-1" />מוביל</Badge>}
                        {article.show_in_menu && <Badge variant="outline" className="text-blue-700 border-blue-300">בתפריט</Badge>}
                        {article.category && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">{article.category}</Badge>
                        )}
                      </div>
                      {article.excerpt && <p className="text-sm text-slate-500 line-clamp-1">{article.excerpt}</p>}
                      {article.slug && <p className="text-xs text-slate-400 mt-1" dir="ltr">/{article.slug}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(article)} title={article.status === "published" ? "הסתר" : "פרסם"}>
                        {article.status === "published" ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4 text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...article }); setSlugError(""); }}>
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
      )}

      {/* CATEGORIES SUB-TAB */}
      {activeSubTab === "categories" && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>ניהול קטגוריות מאמרים</CardTitle>
              <Button onClick={() => setEditingCategory({ name: "", slug: "", sort_order: 0, is_active: true, description: "", meta_title: "", meta_description: "" })}>
                <Plus className="w-4 h-4 ml-2" /> הוסף קטגוריה
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingCategory && (
              <div className="border-2 border-blue-300 rounded-xl p-4 bg-blue-50/50 space-y-3">
                <h4 className="font-semibold">{editingCategory._oldName ? "עריכת קטגוריה" : "קטגוריה חדשה"}</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>שם הקטגוריה <span className="text-red-500">*</span></Label><Input value={editingCategory.name || ""} onChange={(e) => setEditingCategory((p) => ({ ...p, name: e.target.value, slug: p._slugEdited ? p.slug : generateSlug(e.target.value) }))} /></div>
                  <div><Label>Slug <span className="text-red-500">*</span></Label><Input value={editingCategory.slug || ""} onChange={(e) => setEditingCategory((p) => ({ ...p, slug: e.target.value, _slugEdited: true }))} dir="ltr" className="text-left" placeholder="category-slug" /></div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>סדר הצגה</Label><Input type="number" value={editingCategory.sort_order || 0} onChange={(e) => setEditingCategory((p) => ({ ...p, sort_order: Number(e.target.value) }))} /></div>
                  <div className="flex items-center space-x-2 space-x-reverse pt-6">
                    <Checkbox id="cat_active" checked={editingCategory.is_active !== false} onCheckedChange={(v) => setEditingCategory((p) => ({ ...p, is_active: v }))} />
                    <Label htmlFor="cat_active" className="cursor-pointer">פעילה</Label>
                  </div>
                </div>
                <div><Label>תיאור קצר</Label><Input value={editingCategory.description || ""} onChange={(e) => setEditingCategory((p) => ({ ...p, description: e.target.value }))} /></div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>Meta Title</Label><Input value={editingCategory.meta_title || ""} onChange={(e) => setEditingCategory((p) => ({ ...p, meta_title: e.target.value }))} /></div>
                  <div><Label>Meta Description</Label><Input value={editingCategory.meta_description || ""} onChange={(e) => setEditingCategory((p) => ({ ...p, meta_description: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCategory}>שמור קטגוריה</Button>
                  <Button variant="outline" onClick={() => setEditingCategory(null)}>ביטול</Button>
                </div>
              </div>
            )}
            {categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div>
                  <span className="font-medium text-slate-800">{cat.name}</span>
                  <span className="text-xs text-slate-400 mr-2" dir="ltr">/{cat.slug}</span>
                  <Badge variant={cat.is_active !== false ? "default" : "secondary"} className="mr-2 text-xs">{cat.is_active !== false ? "פעילה" : "מוסתרת"}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingCategory({ ...cat, _oldName: cat.name })}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setCategoryDeleteConfirm(cat.name)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PAGE SETTINGS SUB-TAB */}
      {activeSubTab === "settings" && (
        <ArticlesPageSettings settings={pageSettings} articles={articles} onSave={savePageSetting} onFileUpload={onFileUpload} saving={saving} />
      )}
    </div>
  );
}

// ── Articles page settings sub-component ──
function ArticlesPageSettings({ settings, articles, onSave, onFileUpload, saving }) {
  const publishedArticles = articles.filter((a) => a.status === "published");
  const [local, setLocal] = useState({});
  useEffect(() => { setLocal({ ...settings }); }, [settings]);

  const set = (key, val) => setLocal((prev) => ({ ...prev, [key]: val }));

  const fields = [
    { key: "articles_page_title", label: "כותרת העמוד", type: "text", default: "מאמרים וסקירות על חופשות סקי" },
    { key: "articles_page_description", label: "תיאור העמוד", type: "textarea", default: "מדריכים, סקירות יעדים, טיפים ומידע מקצועי שיעזרו לכם לתכנן חופשת סקי טובה יותר." },
    { key: "articles_search_placeholder", label: "טקסט שדה החיפוש", type: "text", default: "חיפוש מאמרים..." },
    { key: "articles_empty_text", label: "טקסט מצב ריק (ללא תוצאות)", type: "text", default: "לא נמצאו מאמרים תואמים." },
    { key: "articles_meta_title", label: "Meta Title (SEO)", type: "text" },
    { key: "articles_meta_description", label: "Meta Description (SEO)", type: "textarea" },
    { key: "articles_og_image", label: "Open Graph Image URL", type: "text" },
    { key: "articles_canonical_url", label: "Canonical URL (אופציונלי)", type: "text" },
  ];

  return (
    <div className="space-y-6">
      {/* Featured article selection */}
      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> מאמר מוביל</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Label>בחר מאמר מוביל שיופיע בראש עמוד המאמרים</Label>
          <Select
            value={settings.articles_featured_id || ""}
            onValueChange={(v) => onSave("articles_featured_id", v === "__none" ? "" : v)}
          >
            <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
              <SelectValue placeholder="בחר מאמר מוביל..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none" className="text-right">— ללא מאמר מוביל —</SelectItem>
              {publishedArticles.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-right">{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Hero image */}
      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle>תמונת Hero</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input value={local.articles_hero_image || ""} onChange={(e) => set("articles_hero_image", e.target.value)} placeholder="https://..." />
            <Input id="articles-hero-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0] && onFileUpload) onFileUpload(e.target.files[0], (url) => { set("articles_hero_image", url); onSave("articles_hero_image", url); }); }} />
            <Label htmlFor="articles-hero-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4" /></span></Button></Label>
          </div>
          {local.articles_hero_image && <img src={local.articles_hero_image} alt="Hero" className="h-24 rounded-lg object-cover" />}
          <div>
            <Label>Alt לתמונת Hero</Label>
            <div className="flex items-center gap-2">
              <Input value={local.articles_hero_alt || ""} onChange={(e) => set("articles_hero_alt", e.target.value)} placeholder="תיאור התמונה" />
              <Button size="sm" onClick={() => onSave("articles_hero_alt", local.articles_hero_alt || "")} disabled={saving}>שמור</Button>
            </div>
          </div>
          <Button size="sm" onClick={() => onSave("articles_hero_image", local.articles_hero_image || "")} disabled={saving}>שמור תמונת Hero</Button>
        </CardContent>
      </Card>

      {/* Display toggles */}
      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle>הגדרות תצוגה</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "articles_show_dates", label: "הצג תאריכי פרסום" },
            { key: "articles_show_authors", label: "הצג שמות מחברים" },
            { key: "articles_show_excerpts", label: "הצג תקצירים" },
          ].map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
              <Label className="cursor-pointer">{toggle.label}</Label>
              <Select
                value={settings[toggle.key] === "false" ? "false" : "true"}
                onValueChange={(v) => onSave(toggle.key, v)}
              >
                <SelectTrigger className="w-32" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="text-right">הצג</SelectItem>
                  <SelectItem value="false" className="text-right">הסתר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Text fields */}
      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle>תוכן ו-SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <Label>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={local[field.key] || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.default || ""}
                  rows={field.key === "articles_page_description" ? 3 : 2}
                />
              ) : (
                <Input
                  value={local[field.key] || ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.default || ""}
                  dir={field.key.includes("canonical") || field.key.includes("url") ? "ltr" : "rtl"}
                  className={field.key.includes("canonical") || field.key.includes("url") ? "text-left" : ""}
                />
              )}
              <Button size="sm" className="mt-2" onClick={() => onSave(field.key, local[field.key] || "")} disabled={saving}>שמור</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}