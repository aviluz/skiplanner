const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, Plus, Edit, Trash2, FileText, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import VipRequestPdfExport from './VipRequestPdfExport';

export default function VipFormBuilder() {
  const [sections, setSections] = useState([]);
  const [fields, setFields] = useState([]);
  const [vipRequests, setVipRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  
  const [editingSection, setEditingSection] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sectionsData, fieldsData, requestsData] = await Promise.all([
        db.entities.VipFormSection.list(),
        db.entities.VipFormField.list(),
        db.entities.VipRequest.list('-created_date')
      ]);

      setSections(sectionsData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setFields(fieldsData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setVipRequests(requestsData);
    } catch (error) {
      console.error('Error loading VIP form data:', error);
      toast.error('שגיאה בטעינת נתוני טופס VIP');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromWord = async (file) => {
    if (!file) return;
    
    setImportLoading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });

      const prompt = `אתה מקבל קובץ טופס בפורמט Word.
המטרה היא להפיק ממנו מבנה טופס מלא ומדויק בפורמט JSON תקני בלבד.
אין להחזיר שום טקסט חופשי, הסברים, הארות או דוגמאות — JSON בלבד.

כללים לפענוח המסמך:

1. כל כותרת שמופיעה בגודל/עיצוב שמסמן "כותרת סעיף" — יש להפוך ל־Section.
   לדוגמה: פרטים אישיים, פרטי חופשה, העדפות גלישה, העדפות כשרות, פרטי הילדים, פרטי תקציב וכו'.

2. כל שורה בתוך Section שאינה כותרת — היא שדה (Field).
   שם השדה = הטקסט לאחר הסרת כוכבית אם יש.

3. זיהוי שדות חובה:
   אם השורה מתחילה בכוכבית (*) — זה שדה חובה.
   במקרה כזה: "is_required": true
   אחרת: "is_required": false

4. סוגי שדות (field_type):
   בחר את הסוג המתאים ביותר לפי תוכן השורה:
   - אם זה מידע קצר: "text"
   - שדה ארוך/פסקה: "textarea"
   - שדה עם אפשרויות ברורות (כמו כן/לא, רמת גלישה, העדפה): "select"
   - כמה אפשרויות סימון במקביל: "multi_select"
   - בחירה יחידה בין כמה ערכים: "radio"
   - מספרים בלבד: "number"
   - תאריכים: "date"

5. אפשרויות (options):
   אם השדה כולל רשימת בחירה (כגון "רמת גלישה: מתחיל / בינוני / מתקדם"), החזר אותן במערך:
   "options": ["מתחיל", "בינוני", "מתקדם"]

6. תיאורים:
   אם יש טקסט מסביר קטן מתחת לשדה — שים אותו בתוך: "description": "..."

7. סדר:
   הסדר שבו הסקשנים והשדות מופיעים במסמך — הוא הסדר שיש לשמור ב־JSON (sort_order).

8. פלט:
   הפלט חייב להיות JSON תקני לחלוטין, בפורמט הבא:

{
  "sections": [
    {
      "title": "שם הסקשן",
      "description": "תיאור (אופציונלי)",
      "sort_order": 0,
      "fields": [
        {
          "label": "שם השדה",
          "field_type": "text|textarea|select|radio|multi_select|number|date",
          "is_required": true או false,
          "options": ["אם יש"],
          "description": "אם יש",
          "sort_order": 0
        }
      ]
    }
  ]
}

שוב — אין להחזיר שום דבר מלבד JSON תקני. אין הסברים. אין טקסט. אין פרשנות מסביב.`;

      const result = await db.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  sort_order: { type: 'number' },
                  fields: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        field_type: { type: 'string' },
                        is_required: { type: 'boolean' },
                        options: { type: 'array', items: { type: 'string' } },
                        description: { type: 'string' },
                        sort_order: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!result?.sections || !Array.isArray(result.sections)) {
        throw new Error('פורמט JSON לא תקין');
      }

      // Create sections and fields
      for (const [sectionIndex, sectionData] of result.sections.entries()) {
        const newSection = await db.entities.VipFormSection.create({
          title: sectionData.title,
          description: sectionData.description || '',
          sort_order: sectionData.sort_order ?? sectionIndex,
          is_active: true
        });

        if (sectionData.fields && Array.isArray(sectionData.fields)) {
          for (const [fieldIndex, fieldData] of sectionData.fields.entries()) {
            await db.entities.VipFormField.create({
              section_id: newSection.id,
              label: fieldData.label,
              description: fieldData.description || '',
              field_type: fieldData.field_type || 'text',
              options: fieldData.options || [],
              is_required: fieldData.is_required || false,
              sort_order: fieldData.sort_order ?? fieldIndex,
              is_active: true
            });
          }
        }
      }

      toast.success('הטופס יובא בהצלחה מקובץ ה-Word!');
      await loadData();
    } catch (error) {
      console.error('Error importing from Word:', error);
      toast.error('שגיאה בייבוא הטופס: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveSection = async (data, isNew) => {
    try {
      if (!data.title) {
        toast.error('נא למלא כותרת לסקשן');
        return;
      }

      if (isNew) {
        await db.entities.VipFormSection.create(data);
        toast.success('הסקשן נוצר בהצלחה');
      } else {
        await db.entities.VipFormSection.update(data.id, data);
        toast.success('הסקשן עודכן בהצלחה');
      }
      
      setEditingSection(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('שגיאה בשמירת הסקשן');
    }
  };

  const handleSaveField = async (data, isNew) => {
    try {
      if (!data.label || !data.section_id) {
        toast.error('נא למלא שם שדה ולבחור סקשן');
        return;
      }

      if (isNew) {
        await db.entities.VipFormField.create(data);
        toast.success('השדה נוצר בהצלחה');
      } else {
        await db.entities.VipFormField.update(data.id, data);
        toast.success('השדה עודכן בהצלחה');
      }
      
      setEditingField(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('שגיאה בשמירת השדה');
    }
  };

  const handleDeleteSection = async (id) => {
    try {
      const relatedFields = fields.filter(f => f.section_id === id);
      for (const field of relatedFields) {
        await db.entities.VipFormField.delete(field.id);
      }
      await db.entities.VipFormSection.delete(id);
      toast.success('הסקשן נמחק בהצלחה');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('שגיאה במחיקת הסקשן');
    }
  };

  const handleDeleteField = async (id) => {
    try {
      await db.entities.VipFormField.delete(id);
      toast.success('השדה נמחק בהצלחה');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('שגיאה במחיקת השדה');
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await db.entities.VipRequest.update(requestId, { status: newStatus, is_read: true });
      toast.success('הסטטוס עודכן בהצלחה');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('שגיאה בעדכון הסטטוס');
    }
  };

  const handleMarkAsRead = async (requestId) => {
    try {
      await db.entities.VipRequest.update(requestId, { is_read: true });
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const moveSectionOrder = async (section, direction) => {
    const currentIndex = sections.findIndex(s => s.id === section.id);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === sections.length - 1)) {
      return;
    }

    const newSections = [...sections];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newSections[currentIndex], newSections[swapIndex]] = [newSections[swapIndex], newSections[currentIndex]];
    
    try {
      await Promise.all(
        newSections.map((s, idx) => 
          db.entities.VipFormSection.update(s.id, { sort_order: idx })
        )
      );
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('שגיאה בשינוי סדר');
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Import from PDF */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            ייבוא טופס מקובץ PDF
          </CardTitle>
          <CardDescription>
            העלה קובץ PDF והמערכת תיצור אוטומטית את כל הסקשנים והשדות בעזרת AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) {
                handleImportFromWord(e.target.files[0]);
              }
            }}
            disabled={importLoading}
          />
          <Label htmlFor="pdf-upload">
            <Button asChild disabled={importLoading} className="w-full">
              <span className="cursor-pointer">
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מייבא טופס...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    העלה קובץ PDF
                  </>
                )}
              </span>
            </Button>
          </Label>
          <p className="text-xs text-slate-600 mt-2">
            המערכת תזהה אוטומטית כותרות, שדות, שדות חובה (כוכבית) וסוגי שדות. 
            <br />
            <strong>טיפ:</strong> אם יש לך Word, שמור אותו כ-PDF לפני העלאה.
          </p>
        </CardContent>
      </Card>

      {/* VIP Requests */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            בקשות VIP שהתקבלו ({vipRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vipRequests.length > 0 ? (
            <div className="space-y-4">
              {vipRequests.map(request => (
                <div key={request.id} className="p-4 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                    <div>
                      <h4 className="font-semibold">{request.user_name || 'אורח'}</h4>
                      <p className="text-sm text-slate-600">{request.user_email}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(request.created_date).toLocaleString('he-IL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={request.status}
                        onValueChange={(val) => handleUpdateRequestStatus(request.id, val)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">חדש</SelectItem>
                          <SelectItem value="in_progress">בטיפול</SelectItem>
                          <SelectItem value="completed">הושלם</SelectItem>
                          <SelectItem value="cancelled">בוטל</SelectItem>
                        </SelectContent>
                      </Select>
                      <VipRequestPdfExport vipRequest={request} />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setViewingRequest(request);
                          if (!request.is_read) {
                            handleMarkAsRead(request.id);
                          }
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      {!request.is_read && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      request.status === 'new' ? 'default' :
                      request.status === 'completed' ? 'secondary' :
                      'outline'
                    }
                  >
                    {request.status === 'new' ? 'חדש' :
                     request.status === 'in_progress' ? 'בטיפול' :
                     request.status === 'completed' ? 'הושלם' :
                     'בוטל'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">אין בקשות VIP עדיין</p>
          )}
        </CardContent>
      </Card>

      {/* Sections Management */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>ניהול סקשנים</CardTitle>
            <Button onClick={() => setEditingSection({})}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף סקשן
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">כותרת</TableHead>
                <TableHead className="text-right">סדר</TableHead>
                <TableHead className="text-right">פעיל</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{section.sort_order}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSectionOrder(section, 'up')}
                        disabled={sections[0].id === section.id}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSectionOrder(section, 'down')}
                        disabled={sections[sections.length - 1].id === section.id}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={section.is_active ? 'default' : 'secondary'}>
                      {section.is_active ? 'פעיל' : 'מושבת'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingSection(section)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(section.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fields Management */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>ניהול שדות</CardTitle>
            <Button onClick={() => setEditingField({})}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף שדה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שדה</TableHead>
                <TableHead className="text-right">סקשן</TableHead>
                <TableHead className="text-right">סוג</TableHead>
                <TableHead className="text-right">חובה</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field) => {
                const section = sections.find(s => s.id === field.section_id);
                return (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>{section?.title || 'לא ידוע'}</TableCell>
                    <TableCell><Badge variant="outline">{field.field_type}</Badge></TableCell>
                    <TableCell>
                      {field.is_required ? (
                        <Badge className="bg-red-100 text-red-800">חובה</Badge>
                      ) : (
                        <Badge variant="secondary">אופציונלי</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingField(field)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteField(field.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingSection?.id ? 'עריכת סקשן' : 'הוספת סקשן חדש'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>כותרת הסקשן *</Label>
              <Input
                value={editingSection?.title || ''}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
              />
            </div>
            <div>
              <Label>תיאור (אופציונלי)</Label>
              <Textarea
                value={editingSection?.description || ''}
                onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
              />
            </div>
            <div>
              <Label>מספר סדר</Label>
              <Input
                type="number"
                value={editingSection?.sort_order || 0}
                onChange={(e) => setEditingSection({ ...editingSection, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                checked={editingSection?.is_active !== false}
                onCheckedChange={(checked) => setEditingSection({ ...editingSection, is_active: checked })}
              />
              <Label>פעיל</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>ביטול</Button>
            <Button onClick={() => handleSaveSection(editingSection, !editingSection?.id)}>
              {editingSection?.id ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Dialog */}
      <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingField?.id ? 'עריכת שדה' : 'הוספת שדה חדש'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>סקשן *</Label>
              <Select
                value={editingField?.section_id || ''}
                onValueChange={(val) => setEditingField({ ...editingField, section_id: val })}
              >
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="בחר סקשן..." />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>שם השדה *</Label>
              <Input
                value={editingField?.label || ''}
                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
              />
            </div>
            <div>
              <Label>תיאור (אופציונלי)</Label>
              <Textarea
                value={editingField?.description || ''}
                onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
              />
            </div>
            <div>
              <Label>סוג שדה</Label>
              <Select
                value={editingField?.field_type || 'text'}
                onValueChange={(val) => setEditingField({ ...editingField, field_type: val })}
              >
                <SelectTrigger dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">טקסט קצר</SelectItem>
                  <SelectItem value="email">כתובת מייל</SelectItem>
                  <SelectItem value="phone">מספר טלפון</SelectItem>
                  <SelectItem value="textarea">טקסט ארוך</SelectItem>
                  <SelectItem value="select">בחירה מרשימה</SelectItem>
                  <SelectItem value="multi_select">בחירה מרובה</SelectItem>
                  <SelectItem value="radio">כפתורי בחירה</SelectItem>
                  <SelectItem value="number">מספר</SelectItem>
                  <SelectItem value="date">תאריך</SelectItem>
                  <SelectItem value="date_range">טווח תאריכים</SelectItem>
                  <SelectItem value="range">טווח</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {['select', 'multi_select', 'radio'].includes(editingField?.field_type) && (
              <div>
                <Label>אפשרויות (מופרד בקו אנכי |)</Label>
                <Input
                  value={Array.isArray(editingField?.options) ? editingField.options.join(' | ') : ''}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    options: e.target.value.split('|').map(o => o.trim()).filter(o => o)
                  })}
                  placeholder="אופציה 1 | אופציה 2 | אופציה 3"
                />
                <p className="text-xs text-slate-500 mt-1">
                  הפרד בין אפשרויות עם קו אנכי (|) כדי לאפשר שימוש בפסיקים בתוך הטקסט
                </p>
              </div>
            )}
            <div>
              <Label>מספר סדר</Label>
              <Input
                type="number"
                value={editingField?.sort_order || 0}
                onChange={(e) => setEditingField({ ...editingField, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                checked={editingField?.is_required || false}
                onCheckedChange={(checked) => setEditingField({ ...editingField, is_required: checked })}
              />
              <Label>שדה חובה</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                checked={editingField?.is_active !== false}
                onCheckedChange={(checked) => setEditingField({ ...editingField, is_active: checked })}
              />
              <Label>פעיל</Label>
            </div>
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold">תנאי הצגה (אופציונלי)</Label>
              <p className="text-xs text-slate-500 mb-2">השדה יוצג רק אם שדה אחר מכיל ערך מסוים</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="שם שדה תנאי"
                  value={editingField?.visible_if?.field || ''}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    visible_if: { ...editingField?.visible_if, field: e.target.value }
                  })}
                  className="text-sm"
                />
                <Input
                  placeholder="ערך נדרש"
                  value={editingField?.visible_if?.value || ''}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    visible_if: { ...editingField?.visible_if, value: e.target.value }
                  })}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>ביטול</Button>
            <Button onClick={() => handleSaveField(editingField, !editingField?.id)}>
              {editingField?.id ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex justify-between items-start">
              <DialogTitle>פרטי בקשת VIP</DialogTitle>
              {viewingRequest && <VipRequestPdfExport vipRequest={viewingRequest} />}
            </div>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 py-4 px-1">
            <div className="bg-slate-100 p-4 rounded-lg">
              <p><strong>שם:</strong> {viewingRequest?.user_name}</p>
              <p><strong>מייל:</strong> {viewingRequest?.user_email}</p>
              <p><strong>תאריך:</strong> {viewingRequest?.created_date ? new Date(viewingRequest.created_date).toLocaleString('he-IL') : ''}</p>
            </div>
            
            {viewingRequest?.form_data?.sections?.map((section, idx) => (
              <div key={idx} className="border-t pt-4">
                <h3 className="font-bold text-lg mb-2">{section.title}</h3>
                <div className="space-y-2">
                  {section.fields?.map((field, fieldIdx) => {
                    let displayValue = field.value;
                    
                    // Handle different value types
                    if (typeof displayValue === 'object' && displayValue !== null) {
                      displayValue = JSON.stringify(displayValue);
                    } else if (displayValue === undefined || displayValue === null) {
                      displayValue = 'לא מולא';
                    }
                    
                    return (
                      <div key={fieldIdx} className="bg-slate-50 p-3 rounded">
                        <p className="text-sm font-semibold text-slate-700">{field.label}:</p>
                        <p className="text-slate-800">{displayValue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {viewingRequest?.form_data?.notes && (
              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-2">הערות נוספות</h3>
                <div className="bg-slate-50 p-4 rounded whitespace-pre-wrap">
                  {viewingRequest.form_data.notes}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewingRequest(null)}>סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}