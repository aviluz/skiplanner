const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Upload, CalendarClock } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const KNOWN_SITE_SETTINGS = [
  { name: 'logo_text', label: 'טקסט הלוגו', defaultValue: 'SkiPlan' },
  { name: 'logo_image_url', label: 'תמונת לוגו (PNG/SVG/JPG)', defaultValue: '' },
  { name: 'whatsapp_support', label: 'קישור וואטסאפ לתמיכה', defaultValue: '' },
  { name: 'vip_email', label: 'אימייל VIP', defaultValue: 'vip@skiplan.com' },
  { name: 'home_background_image', label: 'תמונת רקע דף הבית', defaultValue: '' },
  { name: 'vip_section_background', label: 'תמונת רקע לסקשן VIP בדף הבית', defaultValue: '' },
  { name: 'destinations_header_background', label: 'תמונת רקע כותרת יעדי סקי', defaultValue: '' },
  { name: 'featured_destinations_background', label: 'תמונת רקע יעדים מומלצים (קרוסלה)', defaultValue: '' },
  { name: 'booking_com_affiliate_link', label: 'קישור שותף Booking.com', defaultValue: '' },
  { name: 'accessibility_button_link', label: 'קישור כפתור נגישות', defaultValue: '' },
  { name: 'equipment_rental_link', label: 'קישור להשכרת ציוד', defaultValue: '' },
  { name: 'equipment_rental_coupon', label: 'קוד קופון להשכרת ציוד', defaultValue: '' },
  { name: 'transfer_service_link', label: 'קישור לשירות הסעות/מוניות', defaultValue: '' },
  { name: 'terms_of_use', label: 'תנאי שימוש (מסמכים משפטיים)', defaultValue: '' },
  { name: 'accessibility_statement', label: 'הצהרת נגישות (מסמכים משפטיים)', defaultValue: '' },
  // SEO Settings
  { name: 'seo_home_title', label: 'SEO | Meta Title — דף הבית', defaultValue: '' },
  { name: 'seo_home_description', label: 'SEO | Meta Description — דף הבית', defaultValue: '' },
  { name: 'seo_destinations_title', label: 'SEO | Meta Title — יעדי סקי', defaultValue: '' },
  { name: 'seo_destinations_description', label: 'SEO | Meta Description — יעדי סקי', defaultValue: '' },
  { name: 'seo_plantrip_title', label: 'SEO | Meta Title — תכנון טיול', defaultValue: '' },
  { name: 'seo_plantrip_description', label: 'SEO | Meta Description — תכנון טיול', defaultValue: '' },
  { name: 'seo_guides_title', label: 'SEO | Meta Title — מדריכים', defaultValue: '' },
  { name: 'seo_guides_description', label: 'SEO | Meta Description — מדריכים', defaultValue: '' },
  { name: 'seo_articles_title', label: 'SEO | Meta Title — מאמרים', defaultValue: '' },
  { name: 'seo_articles_description', label: 'SEO | Meta Description — מאמרים', defaultValue: '' },
  { name: 'seo_insurances_title', label: 'SEO | Meta Title — ביטוחים', defaultValue: '' },
  { name: 'seo_insurances_description', label: 'SEO | Meta Description — ביטוחים', defaultValue: '' },
  { name: 'google_site_verification', label: 'קוד אימות Google Search Console', defaultValue: '' },
];

const SettingsManagement = ({ onFileUpload }) => {
  const [settings, setSettings] = useState(() => {
    const initialSettings = {};
    KNOWN_SITE_SETTINGS.forEach(s => { initialSettings[s.name] = s.defaultValue; });
    return initialSettings;
  });
  const [saving, setSaving] = useState(false);
  const [showSeasonConfirm, setShowSeasonConfirm] = useState(false);
  const [updatingSeasons, setUpdatingSeasons] = useState(false);

  const handleUpdateSeasons = async () => {
    setUpdatingSeasons(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const destinations = await db.entities.SkiDestination.list();
      let updatedCount = 0;
      let skippedCount = 0;
      for (const dest of destinations) {
        if (!dest.season_end_date) { skippedCount++; continue; }
        const endDate = new Date(dest.season_end_date);
        endDate.setHours(0, 0, 0, 0);
        if (endDate < today) {
          const newStart = dest.season_start_date
            ? new Date(new Date(dest.season_start_date).setFullYear(new Date(dest.season_start_date).getFullYear() + 1)).toISOString().split("T")[0]
            : dest.season_start_date;
          const newEnd = new Date(endDate.setFullYear(endDate.getFullYear() + 1)).toISOString().split("T")[0];
          await db.entities.SkiDestination.update(dest.id, {
            ...(newStart && { season_start_date: newStart }),
            season_end_date: newEnd,
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      }
      sonnerToast.success(`עדכון הושלם! ${updatedCount} אתרים עודכנו, ${skippedCount} דולגו (עונה עדיין פעילה).`);
    } catch (error) {
      sonnerToast.error("שגיאה בעדכון תאריכי העונה");
    } finally {
      setUpdatingSeasons(false);
      setShowSeasonConfirm(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await db.entities.SiteSettings.list();
      const settingsMap = settingsData.reduce((acc, s) => ({ ...acc, [s.setting_name]: s.value || "" }), {});
      setSettings(prev => {
        const updatedSettings = { ...prev };
        KNOWN_SITE_SETTINGS.forEach(s => {
          if (s.name in settingsMap) updatedSettings[s.name] = settingsMap[s.name];
        });
        return updatedSettings;
      });
    } catch (error) {
      sonnerToast.error("שגיאה בטעינת הגדרות");
    }
  };

  const handleSaveSetting = async (settingName, value) => {
    setSaving(true);
    try {
      const existingSettings = await db.entities.SiteSettings.filter({ setting_name: settingName });
      const settingDefinition = KNOWN_SITE_SETTINGS.find(s => s.name === settingName);
      const isDefaultOrEmpty = (value === "" || value === settingDefinition?.defaultValue);

      if (existingSettings.length > 0) {
        if (isDefaultOrEmpty) {
          await db.entities.SiteSettings.delete(existingSettings[0].id);
          sonnerToast.success(`ההגדרה נמחקה (חזרה לברירת מחדל)`);
        } else {
          await db.entities.SiteSettings.update(existingSettings[0].id, { value });
          sonnerToast.success(`ההגדרה "${settingDefinition?.label || settingName}" נשמרה`);
        }
      } else {
        if (!isDefaultOrEmpty) {
          await db.entities.SiteSettings.create({ setting_name: settingName, value });
          sonnerToast.success(`ההגדרה "${settingDefinition?.label || settingName}" נוספה`);
        }
      }
      loadSettings();
    } catch (error) {
      sonnerToast.error("שגיאה בשמירת ההגדרה");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (settingName, value) => {
    setSettings(prev => ({ ...prev, [settingName]: value }));
  };

  const renderSettingInput = (setting) => {
    if (setting.name === 'terms_of_use' || setting.name === 'accessibility_statement') return null;
    const isImage = setting.name.includes('image') || setting.name.includes('background') || setting.name.includes('logo_image');
    return (
      <div key={setting.name}>
        <Label htmlFor={setting.name}>{setting.label}</Label>
        {isImage ? (
          <>
            <div className="flex items-center gap-2">
              <Input id={setting.name} value={settings[setting.name]} onChange={e => handleInputChange(setting.name, e.target.value)} placeholder={setting.defaultValue} />
              <Input id={`${setting.name}-upload`} type="file" className="hidden" onChange={(e) => { if (e.target.files[0]) onFileUpload(e.target.files[0], (url) => handleInputChange(setting.name, url)); }} />
              <Label htmlFor={`${setting.name}-upload`}>
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer"><Upload className="w-4 h-4"/></span>
                </Button>
              </Label>
            </div>
            {settings[setting.name] && <img src={settings[setting.name]} alt="תצוגה מקדימה" className="mt-2 h-24 w-auto rounded-lg object-cover"/>}
          </>
        ) : (
          <Input
            id={setting.name}
            type={setting.name.includes('email') ? 'email' : 'text'}
            value={settings[setting.name]}
            onChange={(e) => handleInputChange(setting.name, e.target.value)}
            placeholder={setting.defaultValue || ''}
          />
        )}
        <Button onClick={() => handleSaveSetting(setting.name, settings[setting.name])} disabled={saving} className="mt-2 w-full">
          <Save className="w-4 h-4 ml-2" />שמור
        </Button>
      </div>
    );
  };

  const generalSettings = KNOWN_SITE_SETTINGS.filter(s =>
    !s.name.includes('equipment_rental') && !s.name.includes('booking_com') &&
    !s.name.includes('transfer_service') && !s.name.includes('terms_of_use') &&
    !s.name.includes('accessibility_statement') && !s.name.startsWith('seo_') &&
    s.name !== 'google_site_verification'
  );
  const seoSettings = KNOWN_SITE_SETTINGS.filter(s => s.name.startsWith('seo_') || s.name === 'google_site_verification');
  const equipmentRentalSettings = KNOWN_SITE_SETTINGS.filter(s => s.name.includes('equipment_rental'));
  const affiliateSettings = KNOWN_SITE_SETTINGS.filter(s => s.name.includes('booking_com'));
  const transferSettings = KNOWN_SITE_SETTINGS.filter(s => s.name.includes('transfer_service'));

  return (
    <div className="space-y-6">
      <AlertDialog open={showSeasonConfirm} onOpenChange={setShowSeasonConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>עדכון תאריכי עונת הסקי</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לעדכן את כל אתרי הסקי לעונה הבאה?
              <br />
              <span className="text-slate-500 text-xs mt-1 block">רק אתרים שעונתם כבר הסתיימה יעודכנו שנה קדימה.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateSeasons} disabled={updatingSeasons}>
              {updatingSeasons ? "מעדכן..." : "כן, עדכן"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="border-0 shadow-xl border-l-4 border-l-cyan-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-cyan-600" />
            עדכון תאריכי עונת הסקי
          </CardTitle>
          <p className="text-sm text-slate-500">לחיצה על הכפתור תעדכן את תאריכי הפתיחה והסגירה של כל אתרי הסקי במערכת שנה אחת קדימה.</p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowSeasonConfirm(true)}
            disabled={updatingSeasons}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <CalendarClock className="w-4 h-4 ml-2" />
            עדכון תאריכי עונת הסקי
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle>הגדרות כלליות</CardTitle></CardHeader>
        <CardContent className="space-y-4">{generalSettings.map(renderSettingInput)}</CardContent>
      </Card>

      <Card className="border-0 shadow-xl border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 הגדרות SEO (קידום אתרים)
          </CardTitle>
          <p className="text-sm text-slate-500">הזן Meta Title ו-Meta Description ייחודיים לכל עמוד. השינויים לא ישפיעו על העיצוב.</p>
        </CardHeader>
        <CardContent className="space-y-4">{seoSettings.map(renderSettingInput)}</CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle>הגדרות השכרת ציוד</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {equipmentRentalSettings.map(renderSettingInput)}
          <p className="text-xs text-slate-500 mt-1">קוד הקופון יוצג למשתמשים בדף השכרת הציוד (שלב 5)</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle>קישורי שותפים</CardTitle></CardHeader>
        <CardContent className="space-y-4">{affiliateSettings.map(renderSettingInput)}</CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader><CardTitle>הגדרות שירות הסעות</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {transferSettings.map(renderSettingInput)}
          <p className="text-xs text-slate-500 mt-1">קישור זה יוצג למשתמשים שבוחרים בהסעה במקום בהשכרת רכב (שלב 2)</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsManagement;