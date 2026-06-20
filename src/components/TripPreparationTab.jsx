const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Play, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from 'react-markdown';

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  // If it's just an ID (11 characters, alphanumeric with dashes/underscores)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  // Regular YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*?v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

export default function TripPreparationTab() {
  const [preparationData, setPreparationData] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreparationData();
  }, []);

  const loadPreparationData = async () => {
    try {
      const data = await db.entities.TripPreparation.list();
      // Find or use first record
      const prep = data.find(item => item.setting_key === 'trip_preparation') || data[0];
      
      if (prep) {
        setPreparationData(prep);
        setVideoUrl(prep.video_url || "");
        setContent(prep.content || "");
      }
    } catch (error) {
      console.error("Error loading trip preparation data:", error);
      toast.error("שגיאה בטעינת נתוני ההכנה לחופשה");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const payload = {
        setting_key: 'trip_preparation',
        video_url: videoUrl.trim(),
        content: content.trim()
      };

      if (preparationData?.id) {
        // Update existing
        await db.entities.TripPreparation.update(preparationData.id, payload);
        toast.success("התוכן עודכן בהצלחה!");
      } else {
        // Create new
        const newPrep = await db.entities.TripPreparation.create(payload);
        setPreparationData(newPrep);
        toast.success("התוכן נוצר בהצלחה!");
      }
      
      await loadPreparationData();
    } catch (error) {
      console.error("Error saving trip preparation:", error);
      toast.error("שגיאה בשמירת התוכן: " + (error.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const videoId = getYouTubeVideoId(videoUrl);

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-600" />
            ניהול תוכן "הכנה לחופשה"
          </CardTitle>
          <CardDescription>
            התוכן יוצג בטאב "הכנה לחופשה" בדף המדריכים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video URL Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="video_url" className="text-base font-semibold">
                קישור לסרטון YouTube
              </Label>
              <p className="text-sm text-slate-500 mb-2">
                ניתן להזין קישור מלא (https://youtube.com/watch?v=...) או רק את מזהה הסרטון
              </p>
              <Input
                id="video_url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* Video Preview */}
            {videoId && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">תצוגה מקדימה:</p>
                <div className="relative w-full max-w-2xl mx-auto" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg border"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="תצוגה מקדימה של סרטון"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {videoUrl && !videoId && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  קישור הסרטון אינו תקין. אנא ודא שהקישור הוא מ-YouTube.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="content" className="text-base font-semibold">
                תוכן טקסטואלי
              </Label>
              <p className="text-sm text-slate-500 mb-2">
                תמיכה ב-Markdown לעיצוב הטקסט (כותרות, רשימות, הדגשות)
              </p>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="הכנס את תוכן ההדרכה להכנה לחופשה..."
                className="min-h-[400px] font-mono text-sm"
                dir="rtl"
              />
            </div>

            {/* Markdown Tips */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                טיפים לעיצוב (Markdown):
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <code className="bg-blue-100 px-1 rounded"># כותרת ראשית</code> - לכותרות גדולות</li>
                <li>• <code className="bg-blue-100 px-1 rounded">## כותרת משנית</code> - לתתי כותרות</li>
                <li>• <code className="bg-blue-100 px-1 rounded">**טקסט מודגש**</code> - להדגשה</li>
                <li>• <code className="bg-blue-100 px-1 rounded">- פריט ברשימה</code> - ליצירת רשימה</li>
                <li>• <code className="bg-blue-100 px-1 rounded">[טקסט](URL)</code> - ליצירת קישור</li>
              </ul>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  שמור תוכן
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {(videoId || content) && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              תצוגה מקדימה של התוכן באתר
            </CardTitle>
            <CardDescription>
              כך התוכן יוצג למשתמשים בדף המדריכים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {videoId && (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="סרטון הכנה לחופשת סקי"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {content && (
              <div className="prose prose-slate max-w-none text-right bg-slate-50 p-6 rounded-lg" dir="rtl">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-6">{children}</h2>,
                    h2: ({ children }) => <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-5">{children}</h3>,
                    h3: ({ children }) => <h4 className="text-lg font-semibold text-slate-700 mb-2 mt-4">{children}</h4>,
                    p: ({ children }) => <p className="text-slate-700 mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pr-6 mb-4 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pr-6 mb-4 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-700">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}