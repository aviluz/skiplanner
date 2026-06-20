const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BookLock, PlusCircle, Save, Trash2, Edit, Loader2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";

const documentTypes = [
  { value: 'terms_of_use', label: 'תנאי שימוש' },
  { value: 'privacy_policy', label: 'הצהרת פרטיות' },
  { value: 'accessibility_statement', label: 'הצהרת נגישות' },
  { value: 'vip_service_terms', label: 'תנאי הזמנת שירות VIP' },
  { value: 'other', label: 'אחר' }
];

export default function LegalDocumentsTab() {
  const [legalDocuments, setLegalDocuments] = useState([]);
  const [editingDocument, setEditingDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aboutContent, setAboutContent] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const [docs, siteSettings] = await Promise.all([
        db.entities.LegalDocument.list('-created_date'),
        db.entities.SiteSettings.list()
      ]);

      const allDocs = docs || [];

      const termsOfUse = siteSettings.find(s => s.setting_name === 'terms_of_use');
      const accessibilityStatement = siteSettings.find(s => s.setting_name === 'accessibility_statement');
      const aboutSetting = siteSettings.find(s => s.setting_name === 'about_page_content');

      if (aboutSetting?.value) setAboutContent(aboutSetting.value);

      if (termsOfUse?.value && !allDocs.find(d => d.document_type === 'terms_of_use')) {
        allDocs.push({
          id: 'legacy_terms',
          document_name: 'תנאי שימוש',
          content: termsOfUse.value,
          document_type: 'terms_of_use',
          is_active: true, show_in_footer: true, language: 'he', sort_order: -2, isLegacy: true
        });
      }

      if (accessibilityStatement?.value && !allDocs.find(d => d.document_type === 'accessibility_statement')) {
        allDocs.push({
          id: 'legacy_accessibility',
          document_name: 'הצהרת נגישות',
          content: accessibilityStatement.value,
          document_type: 'accessibility_statement',
          is_active: true, show_in_footer: true, language: 'he', sort_order: -1, isLegacy: true
        });
      }

      setLegalDocuments(allDocs);
    } catch (error) {
      console.error('Error loading legal documents:', error);
      sonnerToast.error('שגיאה בטעינת המסמכים');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!editingDocument?.document_name || !editingDocument?.content) {
      sonnerToast.error('נא למלא שם ותוכן המסמך');
      return;
    }
    setSaving(true);
    try {
      if (editingDocument.isLegacy) {
        const newDoc = { ...editingDocument };
        delete newDoc.id;
        delete newDoc.isLegacy;
        await db.entities.LegalDocument.create(newDoc);
        sonnerToast.success('המסמך נוצר בהצלחה במערכת החדשה');
      } else if (editingDocument.id) {
        await db.entities.LegalDocument.update(editingDocument.id, editingDocument);
        sonnerToast.success('המסמך עודכן בהצלחה');
      } else {
        await db.entities.LegalDocument.create(editingDocument);
        sonnerToast.success('המסמך נוצר בהצלחה');
      }
      setEditingDocument(null);
      await loadDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      sonnerToast.error('שגיאה בשמירת המסמך');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (docId === 'legacy_terms' || docId === 'legacy_accessibility') {
      sonnerToast.error('מסמך זה נשמר ב-SiteSettings ולא ניתן למחוק אותו מכאן.');
      return;
    }
    try {
      await db.entities.LegalDocument.delete(docId);
      sonnerToast.success('המסמך נמחק בהצלחה');
      await loadDocuments();
    } catch (error) {
      sonnerToast.error('שגיאה במחיקת המסמך');
    }
  };

  const handleSaveAbout = async () => {
    setSavingAbout(true);
    try {
      const existing = await db.entities.SiteSettings.filter({ setting_name: 'about_page_content' });
      if (existing.length > 0) {
        await db.entities.SiteSettings.update(existing[0].id, { value: aboutContent });
      } else {
        await db.entities.SiteSettings.create({ setting_name: 'about_page_content', value: aboutContent });
      }
      sonnerToast.success('תוכן דף אודות נשמר בהצלחה');
    } catch (error) {
      sonnerToast.error('שגיאה בשמירת תוכן אודות');
    } finally {
      setSavingAbout(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* About Page Content */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookLock className="w-5 h-5" />
            תוכן דף אודות
          </CardTitle>
          <p className="text-sm text-slate-500">הטקסט שיוצג בדף "אודות SkiPlanner" הנגיש לציבור</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={aboutContent}
            onChange={(e) => setAboutContent(e.target.value)}
            placeholder="הכנס כאן את תוכן דף האודות..."
            className="min-h-[200px] text-sm"
            dir="rtl"
          />
          <Button onClick={handleSaveAbout} disabled={savingAbout}>
            {savingAbout ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />שומר...</> : <><Save className="w-4 h-4 ml-2" />שמור תוכן אודות</>}
          </Button>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookLock className="w-5 h-5" />
                {editingDocument?.id ? 'עריכת מסמך משפטי' : 'הוספת מסמך משפטי חדש'}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-2">ניהול מסמכים משפטיים דינמי - תנאי שימוש, הצהרות ועוד</p>
            </div>
            {!editingDocument && (
              <Button onClick={() => setEditingDocument({
                document_name: '', content: '', language: 'he',
                is_active: false, show_in_footer: false, document_type: 'other',
                require_acceptance_in_vip_form: false, sort_order: 0
              })}>
                <PlusCircle className="w-4 h-4 ml-2" />
                הוסף מסמך חדש
              </Button>
            )}
          </div>
        </CardHeader>

        {editingDocument && (
          <CardContent className="space-y-4 pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>שם המסמך <span className="text-red-500">*</span></Label>
                <Input
                  value={editingDocument.document_name || ''}
                  onChange={(e) => setEditingDocument({ ...editingDocument, document_name: e.target.value })}
                  placeholder="למשל: הצהרת פרטיות"
                />
              </div>
              <div>
                <Label>סוג המסמך</Label>
                <Select value={editingDocument.document_type || 'other'} onValueChange={(val) => setEditingDocument({ ...editingDocument, document_type: val })}>
                  <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value} className="text-right">{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>תוכן המסמך (Markdown) <span className="text-red-500">*</span></Label>
              <Textarea
                value={editingDocument.content || ''}
                onChange={(e) => setEditingDocument({ ...editingDocument, content: e.target.value })}
                placeholder="הכנס את תוכן המסמך כאן..."
                className="min-h-[300px] font-mono text-sm"
                dir="rtl"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>שפה</Label>
                <Select value={editingDocument.language || 'he'} onValueChange={(val) => setEditingDocument({ ...editingDocument, language: val })}>
                  <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he" className="text-right">עברית</SelectItem>
                    <SelectItem value="en" className="text-right">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>סדר הצגה בפוטר</Label>
                <Input type="number" value={editingDocument.sort_order || 0} onChange={(e) => setEditingDocument({ ...editingDocument, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="doc_is_active" checked={editingDocument.is_active || false} onCheckedChange={(checked) => setEditingDocument({ ...editingDocument, is_active: checked })} />
                <Label htmlFor="doc_is_active" className="cursor-pointer font-medium">המסמך פעיל</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="doc_show_footer" checked={editingDocument.show_in_footer || false} onCheckedChange={(checked) => setEditingDocument({ ...editingDocument, show_in_footer: checked })} />
                <Label htmlFor="doc_show_footer" className="cursor-pointer font-medium">הצג קישור בפוטר</Label>
              </div>
              {editingDocument.document_type === 'vip_service_terms' && (
                <div className="flex items-center space-x-2 space-x-reverse bg-purple-50 p-3 rounded border border-purple-200">
                  <Checkbox id="doc_require_vip" checked={editingDocument.require_acceptance_in_vip_form || false} onCheckedChange={(checked) => setEditingDocument({ ...editingDocument, require_acceptance_in_vip_form: checked })} />
                  <Label htmlFor="doc_require_vip" className="cursor-pointer font-medium text-purple-900">דרוש אישור בטופס VIP</Label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingDocument(null)}>ביטול</Button>
              <Button onClick={handleSaveDocument} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />שומר...</> : <><Save className="w-4 h-4 ml-2" />{editingDocument.id ? 'עדכן מסמך' : 'צור מסמך'}</>}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>מסמכים משפטיים קיימים ({legalDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {legalDocuments.length > 0 ? (
            <div className="space-y-4">
              {legalDocuments.map(doc => (
                <div key={doc.id} className="p-4 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 text-lg">{doc.document_name}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={doc.is_active ? "default" : "secondary"} className={doc.is_active ? "bg-green-600" : ""}>
                          {doc.is_active ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                        {doc.show_in_footer && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">מוצג בפוטר</Badge>}
                        {doc.require_acceptance_in_vip_form && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">נדרש אישור בטופס VIP</Badge>}
                        <Badge variant="outline" className="text-slate-600">
                          {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingDocument(doc)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!doc.isLegacy && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {doc.isLegacy && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">מסמך ישן</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{doc.content?.substring(0, 150)}...</p>
                  <p className="text-xs text-slate-500 mt-2">עדכון אחרון: {new Date(doc.updated_date).toLocaleDateString('he-IL')}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookLock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">אין מסמכים משפטיים במערכת</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}