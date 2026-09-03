const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from 'react-markdown';
import {
  MountainSnow,
  Shield,
  Wrench,
  Star,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Copy,
  ImageIcon,
  UserRound,
  Baby,
  Sparkles,
  Share2,
  ExternalLink,
  Accessibility,
  Play,
  Calculator,
  RefreshCw
} from "lucide-react";
import WeatherForecast from "@/components/WeatherForecast";
import FaqSection from "@/components/FaqSection";
import { resortsData } from "@/components/weather/data";
import { useToast } from "@/components/ui/use-toast";
import { isRateLimitError, extractRetryAfter } from "@/lib/articleUtils";
import RateLimitState from "@/components/RateLimitState";
import { useCountdown } from "@/hooks/useCountdown";

const CHECKED_ITEMS_KEY = "skiplan_checked_equipment";

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  // If it's just an ID (11 characters, alphanumeric with dashes/underscores)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  // Regular YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/playlist\?list=.*?&v=([a-zA-Z0-9_-]{11})/, // Handle playlists with a specific video
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

export default function Guides() {
  const { toast } = useToast();

  // ציוד
  const [equipment, setEquipment] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [checklistError, setChecklistError] = useState(null);
  const [checklistRetryAfter, setChecklistRetryAfter] = useState(null);

  // הכנה לחופשה
  const [tripPreparation, setTripPreparation] = useState(null);
  const [prepLoading, setPrepLoading] = useState(true);
  const [prepError, setPrepError] = useState(null);
  const [prepRetryAfter, setPrepRetryAfter] = useState(null);

  // מזג אוויר לכל היעדים
  const [resorts, setResorts] = useState(resortsData);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherRetryAfter, setWeatherRetryAfter] = useState(null);
  const { secondsLeft: weatherSecondsLeft, canRetry: weatherCanRetry } = useCountdown(weatherRetryAfter);

  // מעקב אחר טאבים שכבר נטענו
  const loadedTabsRef = useRef(new Set());

  // Get active tab from URL params (reactive via useLocation)
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const tabParam = urlParams.get('tab') || 'checklist';
  const resortParam = urlParams.get('resort');
  const VALID_TABS = ['checklist', 'preparation', 'weather', 'tips', 'safety'];
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'checklist';

  // טעינת ציונים מסומנים מ-localStorage בלבד (ללא קריאת Entity)
  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem(CHECKED_ITEMS_KEY);
      if (savedChecked) setCheckedItems(new Set(JSON.parse(savedChecked)));
    } catch (e) {
      console.error("Failed to load checked items from localStorage", e);
    }
  }, []);

  // טעינת נתונים לפי טאב פעיל — רק בפעם הראשונה שהטאב נפתח
  useEffect(() => {
    if (loadedTabsRef.current.has(activeTab)) return;

    if (activeTab === 'checklist') {
      loadEquipment();
    } else if (activeTab === 'preparation') {
      loadTripPreparation();
    } else if (activeTab === 'weather') {
      loadResorts();
    } else {
      loadedTabsRef.current.add(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadEquipment = async () => {
    setChecklistError(null);
    setLoading(true);
    try {
      const data = await db.entities.Equipment.list();
      const sorted = data.sort((a, b) =>
        (a.category || "אחר").localeCompare(b.category || "אחר", "he", { sensitivity: "base" })
      );
      setEquipment(sorted);
      loadedTabsRef.current.add('checklist');
    } catch (error) {
      console.error("Error loading equipment:", error);
      if (isRateLimitError(error)) {
        setChecklistError("rate_limit");
        setChecklistRetryAfter(extractRetryAfter(error));
      } else {
        setChecklistError("error");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTripPreparation = async () => {
    setPrepError(null);
    setPrepLoading(true);
    try {
      const data = await db.entities.TripPreparation.list();
      const prep = data.find(item => item.setting_key === 'trip_preparation') || data[0];
      setTripPreparation(prep);
      loadedTabsRef.current.add('preparation');
    } catch (error) {
      console.error("Error loading trip preparation:", error);
      if (isRateLimitError(error)) {
        setPrepError("rate_limit");
        setPrepRetryAfter(extractRetryAfter(error));
      } else {
        setPrepError("error");
      }
    } finally {
      setPrepLoading(false);
    }
  };

  const loadResorts = async () => {
    setWeatherError(null);
    setWeatherLoading(true);
    try {
      const all = await db.entities.SkiDestination.list();
      const extras = (all || [])
        .filter((d) => typeof d.latitude === "number" && typeof d.longitude === "number")
        .map((d) => ({
          id: d.id,
          name: d.name,
          country: d.country,
          lat: d.latitude,
          lon: d.longitude
        }));
      const key = (r) => `${(r.name || "").toLowerCase()}|${r.lat}|${r.lon}`;
      const baseMap = new Map(resortsData.map((r) => [key(r), r]));
      extras.forEach((r) => baseMap.set(key(r), r));
      setResorts(Array.from(baseMap.values()));
      loadedTabsRef.current.add('weather');
    } catch (err) {
      console.warn("Failed to enrich weather resorts from SkiDestination:", err);
      if (isRateLimitError(err)) {
        setWeatherError("rate_limit");
        setWeatherRetryAfter(extractRetryAfter(err));
      } else {
        setWeatherError("error");
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    const category = item.category || "אחר";
    (acc[category] ||= []).push(item);
    return acc;
  }, {});

  const handleCheckedChange = (itemId) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      try {
        localStorage.setItem(CHECKED_ITEMS_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to save checked items to localStorage", e);
      }
      return next;
    });
  };

  const handleCopy = (couponCode) => {
    navigator.clipboard.writeText(couponCode);
    toast({ title: "הקופון הועתק!", description: `${couponCode} הועתק ללוח.` });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "מדריך הסקי המלא",
          text: "כל מה שצריך לדעת על ציוד סקי, בטיחות ועצות לחופשה מוצלחת!",
          url: window.location.href
        });
        toast({ title: "המדריך שותף בהצלחה!", description: "תודה ששיתפתם את מדריך הסקי." });
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.warn("Web Share failed, fallback to clipboard:", error?.message);
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "פעולת השיתוף נחסמה",
          description: "הדפדפן מנע את השיתוף. הקישור הועתק ללוח."
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "קישור הועתק!", description: "הדפדפן שלך אינו תומך בשיתוף." });
    }
  };

  const handleAIAssist = () =>
    toast({ title: "עוזר ה-AI בבנייה", description: "בקרוב תוכלו לקבל המלצות מותאמות אישית!" });

  // הפניה אוטומטית: קישורים ישנים של טאב מאמרים → עמוד Articles החדש
  if (tabParam === 'articles') {
    return <Navigate to={createPageUrl("Articles")} replace />;
  }

  const isTabLoading = 
    (activeTab === 'checklist' && loading && !checklistError) ||
    (activeTab === 'preparation' && prepLoading && !prepError);

  if (isTabLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-6 text-right" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* כותרת הדף */}
        <div className="text-center mb-6 md:mb-8 lg:mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-3 md:mb-4">
        <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-600 shrink-0" />
        <span className="text-blue-800 font-medium text-sm md:text-base whitespace-nowrap">מדריכי סקי</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-3 md:mb-4 px-2 leading-tight">
        המדריך המלא לחופשת סקי
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto px-2 sm:px-4 leading-relaxed">
        כל מה שצריך לדעת על ציוד, בטיחות, טיפים ותחזיות מזג אוויר.
        </p>
        <div className="flex justify-center gap-3 mt-4">
         <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span>שתף מדריך</span>
        </Button>
        <Link to={createPageUrl("ExpenseTracker")}>
           <Button size="sm" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
             <Calculator className="w-4 h-4" />
             <span>ניהול הוצאות טיול</span>
           </Button>
        </Link>
        </div>
        </div>

        {/* טאבים – עיצוב חדש ומותאם */}
        <Tabs
          value={activeTab}
          onValueChange={(nextTab) => {
            navigate(`/Guides?tab=${nextTab}`, { replace: true });
          }}
          className="space-y-4 md:space-y-6 lg:space-y-8"
        >
          <TabsList className="
            bg-white shadow-md rounded-lg p-1 h-auto w-full 
            inline-flex justify-start flex-row-reverse space-x-reverse space-x-1 border border-gray-200 overflow-x-auto
          ">
            <TabsTrigger 
              value="checklist" 
              className="
                text-base font-semibold text-slate-700 px-4 py-2 rounded-md transition-all duration-200 
                text-right whitespace-nowrap
                hover:bg-blue-100 hover:text-blue-700 
                data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg
              "
            >
              צ'ק ליסט
            </TabsTrigger>
            <TabsTrigger 
              value="preparation" 
              className="
                text-base font-semibold text-slate-700 px-4 py-2 rounded-md transition-all duration-200 
                text-right whitespace-nowrap
                hover:bg-blue-100 hover:text-blue-700 
                data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg
              "
            >
              הכנה לחופשה
            </TabsTrigger>
            <TabsTrigger 
              value="weather" 
              className="
                text-base font-semibold text-slate-700 px-4 py-2 rounded-md transition-all duration-200 
                text-right whitespace-nowrap
                hover:bg-blue-100 hover:text-blue-700 
                data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg
              "
            >
              מזג אוויר
            </TabsTrigger>
            <TabsTrigger 
              value="tips" 
              className="
                text-base font-semibold text-slate-700 px-4 py-2 rounded-md transition-all duration-200 
                text-right whitespace-nowrap
                hover:bg-blue-100 hover:text-blue-700 
                data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg
              "
            >
              טיפים
            </TabsTrigger>
            <TabsTrigger 
              value="safety" 
              className="
                text-base font-semibold text-slate-700 px-4 py-2 rounded-md transition-all duration-200 
                text-right whitespace-nowrap
                hover:bg-blue-100 hover:text-blue-700 
                data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg
              "
            >
              בטיחות
            </TabsTrigger>
          </TabsList>

          {/* צ'ק ליסט */}
          <TabsContent value="checklist">
            {checklistError === "rate_limit" ? (
              <RateLimitState retryAfter={checklistRetryAfter || 60} onRetry={loadEquipment} message="טעינת הציוד נכשלה בגלל עומס זמני." />
            ) : checklistError ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">שגיאה בטעינת הציוד.</p>
                <Button variant="outline" onClick={loadEquipment}><RefreshCw className="w-4 h-4 ml-2" />נסה שוב</Button>
              </div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-16">
                <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">אין עדיין פריטי ציוד.</p>
              </div>
            ) : (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-indigo-50 p-3 text-right space-y-1.5 sm:p-4 md:p-6 flex flex-col sm:flex-row-reverse sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-base sm:text-lg md:text-xl lg:text-2xl">
                    <span className="leading-tight">צ'ק ליסט ציוד כללי לחופשת סקי</span>
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0" />
                  </CardTitle>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAIAssist}
                  className="bg-cyan-50 mt-2 px-3 text-sm font-medium rounded-md h-9 flex items-center gap-2 w-full sm:w-auto sm:mt-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>עזרה מבינה מלאכותית</span>
                </Button>
              </CardHeader>

              <CardContent className="p-2 sm:p-4 md:p-6">
                <div className="space-y-6">
                  {Object.entries(groupedEquipment).map(([category, items]) => (
                    <div key={category} className="text-right">
                      <h3 className="text-lg font-semibold mb-3">{category}</h3>
                      <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-full" style={{ direction: "rtl" }}>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8 text-right" />
                              <TableHead className="text-muted-foreground px-4 font-medium text-right h-12 w-[100px]">
                                פריט
                              </TableHead>
                              <TableHead className="w-20 text-center">תמונה</TableHead>
                              <TableHead className="min-w-[150px] text-right">הערות</TableHead>
                              <TableHead className="w-[120px] text-center">קישורים</TableHead>
                              <TableHead className="w-[120px] text-center">קופון</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id} className={checkedItems.has(item.id) ? "bg-green-50" : ""}>
                                <TableCell className="py-4">
                                  <Checkbox
                                    checked={checkedItems.has(item.id)}
                                    onCheckedChange={() => handleCheckedChange(item.id)}
                                    aria-label={`סמן את ${item.name}`}
                                    className="mt-1 mr-4 mb-1 h-4 w-4"
                                  />
                                </TableCell>
                                <TableCell className="px-1 py-4 font-medium text-right whitespace-nowrap">{item.name}</TableCell>
                                <TableCell className="text-center">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-md mx-auto" />
                                  ) : (
                                    <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center mx-auto">
                                      <ImageIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 max-w-xs text-right">{item.description}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center items-center gap-2">
                                    {item.link_men && (
                                      <a href={item.link_men} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-500 hover:text-blue-700" title="קישור לגברים">
                                        <UserRound className="w-5 h-5" />
                                      </a>
                                    )}
                                    {item.link_women && (
                                      <a href={item.link_women} target="_blank" rel="noopener noreferrer" className="p-2 text-pink-500 hover:text-pink-700" title="קישור לנשים">
                                        <UserRound className="w-5 h-5" />
                                      </a>
                                    )}
                                    {item.link_kids && (
                                      <a href={item.link_kids} target="_blank" rel="noopener noreferrer" className="p-2 text-yellow-500 hover:text-yellow-700" title="קישור לילדים">
                                        <Baby className="w-5 h-5" />
                                      </a>
                                    )}
                                    {item.purchase_link && (
                                      <a href={item.purchase_link} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-gray-700" title="קישור כללי">
                                        <ExternalLink className="w-5 h-5" />
                                      </a>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center whitespace-nowrap">
                                  {item.coupon_code && (
                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(item.coupon_code)} className="flex items-center gap-1 p-1 h-auto text-xs sm:text-sm">
                                      <Copy className="w-4 h-4" />
                                      <span>{item.coupon_code}</span>
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* הכנה לחופשה - טאב חדש */}
          <TabsContent value="preparation" className="space-y-4 md:space-y-6">
            {prepError === "rate_limit" ? (
              <RateLimitState retryAfter={prepRetryAfter || 60} onRetry={loadTripPreparation} message="טעינת התוכן נכשלה בגלל עומס זמני." />
            ) : prepError ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">שגיאה בטעינת התוכן.</p>
                <Button variant="outline" onClick={loadTripPreparation}><RefreshCw className="w-4 h-4 ml-2" />נסה שוב</Button>
              </div>
            ) : (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50 p-3 sm:p-4 md:p-6 text-right">
                <CardTitle className="flex items-center justify-end gap-2 md:gap-3 text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="leading-tight">הכנה לחופשה</span>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600 shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 text-right" dir="rtl">
                {prepLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                  </div>
                ) : tripPreparation ? (
                  <div className="space-y-6">
                    {/* YouTube Video */}
                    {tripPreparation.video_url && getYouTubeVideoId(tripPreparation.video_url) && (
                      <div className="w-full">
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(tripPreparation.video_url)}`}
                            title="סרטון הכנה לחופשת סקי"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Text Content */}
                    {tripPreparation.content && (
                      <div className="prose prose-slate max-w-none text-right" dir="rtl">
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
                          {tripPreparation.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {!tripPreparation.video_url && !tripPreparation.content && (
                      <div className="text-center py-12">
                        <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">התוכן עדיין לא הוגדר</p>
                        <p className="text-slate-400 text-sm mt-2">ניתן להוסיף תוכן ווידאו מפאנל הניהול</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">עדיין אין תוכן זמין</p>
                    <p className="text-slate-400 text-sm mt-2">אנא פנה למנהל האתר להוספת תוכן</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* מזג אוויר – עכשיו לכל היעדים */}
          <TabsContent value="weather" className="space-y-4 md:space-y-6">
            {weatherError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{weatherError === "rate_limit" ? "טעינת יעדים נוספים נכשלה בגלל עומס זמני. מציג נתונים חלקיים." : "טעינת יעדים נוספים נכשלה. מציג נתונים חלקיים."}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {weatherError === "rate_limit" && !weatherCanRetry && (
                    <span className="text-xs text-amber-600">ניתן לנסות בעוד {weatherSecondsLeft} שניות</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadResorts}
                    disabled={weatherError === "rate_limit" && !weatherCanRetry}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 ml-1" />נסה שוב
                  </Button>
                </div>
              </div>
            )}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50 p-3 sm:p-4 md:p-6 text-right">
                <CardTitle className="flex items-center justify-end gap-2 md:gap-3 text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="leading-tight">תחזית מזג אוויר</span>
                  <MountainSnow className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WeatherForecast resorts={resorts} defaultResortName={resortParam} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* טיפים – יישור לימין */}
          <TabsContent value="tips" className="space-y-4 md:space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 md:p-6 text-right">
                <CardTitle className="flex items-center justify-end gap-2 md:gap-3 text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="leading-tight">טיפים לחופשה מוצלחת</span>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 text-right" dir="rtl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {[
                    {
                      title: "לפני הנסיעה",
                      tips: ["הזמינו ציוד מראש אונליין", "בדקו את תנאי השלג באתר", "רכשו ביטוח נסיעות", "התאמנו פיזית לפני הנסיעה"]
                    },
                    {
                      title: "באתר הסקי",
                      tips: ["קחו שיעור ראשון עם מדריך", "התחילו במסלולים קלים", "שתו הרבה מים", "השתמשו בקרם הגנה"]
                    }
                  ].map((section, idx) => (
                    <div key={idx} className="space-y-3">
                      <h4 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg">{section.title}</h4>
                      <div className="space-y-2">
                        {section.tips.map((tip, i) => (
                          <div key={i} className="flex flex-row-reverse items-start gap-2 justify-end">
                            <span className="text-slate-700 text-sm md:text-base leading-relaxed text-right">{tip}</span>
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* בטיחות – יישור לימין */}
          <TabsContent value="safety" className="space-y-4 md:space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50 p-3 sm:p-4 md:p-6 text-right">
                <CardTitle className="flex items-center justify-end gap-2 md:gap-3 text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="leading-tight">כללי בטיחות בסקי</span>
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 text-right" dir="rtl">
                <div className="space-y-3 md:space-y-4">
                  {[
                    "תמיד חבשו קסדה - היא יכולה להציל חיים",
                    "שמרו על מרחק בטוח מגולשים אחרים",
                    "גלשו רק במסלולים המתאימים לרמתכם",
                    "בדקו תחזית מזג האוויר לפני היציאה",
                    "אל תגלשו לבד - תמיד עם חברים",
                    "שאו איתכם טלפון נייד במקרה חירום",
                    "הקפידו על מנוחה ושתייה במהלך היום"
                  ].map((tip, index) => (
                    <div key={index} className="flex flex-row-reverse items-start gap-3 justify-end p-2 sm:p-3 rounded-lg bg-red-50">
                      <span className="text-slate-800 text-sm md:text-base leading-relaxed text-right">{tip}</span>
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* תנאי שימוש */}
          <TabsContent value="terms" className="space-y-4 md:space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 md:p-6 text-right">
                <CardTitle className="flex items-center justify-end gap-2 md:gap-3 text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="leading-tight">תנאי שימוש</span>
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 text-right" dir="rtl">
                <div className="space-y-4 text-slate-700">
                  <p>
                    ברוכים הבאים למדריך הסקי המלא שלנו! השימוש באתר ובתוכן המוצג בו כפוף לתנאים המפורטים להלן.
                    קריאת תנאים אלו מהווה הסכמה מלאה לכל האמור בהם.
                  </p>
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg">
                    אחריות ותוכן:
                  </h4>
                  <ul className="list-disc pr-5 space-y-1">
                    <li>המידע המוצג באתר הינו למטרות מידע כללי בלבד ואינו מהווה ייעוץ מקצועי.</li>
                    <li>אנו עושים את מירב המאמצים להבטיח את דיוק ואמינות המידע, אך איננו יכולים להתחייב על כך באופן מוחלט.</li>
                    <li>השימוש במידע ובטיפים הניתנים באתר הוא באחריות המשתמש בלבד.</li>
                  </ul>
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg">
                    קישורים חיצוניים וקופונים:
                  </h4>
                  <ul className="list-disc pr-5 space-y-1">
                    <li>האתר עשוי לכלול קישורים לאתרים ושירותים של צדדים שלישיים. איננו אחראים לתוכנם או למדיניות הפרטיות שלהם.</li>
                    <li>קופוני הנחה וקישורי רכישה ניתנים כשירות, וייתכן שאנו מקבלים עמלה בגינם. תוקף וזמינות הקופונים וההטבות הינם באחריות הספקים.</li>
                  </ul>
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg">
                    שינויים בתנאים:
                  </h4>
                  <p>
                    אנו שומרים לעצמנו את הזכות לעדכן או לשנות את תנאי השימוש מעת לעת, ללא הודעה מוקדמת. מומלץ לבדוק את העמוד הזה באופן קבוע.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* נגישות */}
          <TabsContent value="accessibility" className="space-y-4 md:space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100 p-3 sm:p-4 md:p-6 text-right">
                <CardTitle className="flex items-center justify-end gap-2 md:gap-3 text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="leading-tight">הצהרת נגישות</span>
                  <Accessibility className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600 shrink-0" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 text-right" dir="rtl">
                <div className="space-y-4 text-slate-700">
                  <p>
                    אנו ב-"מדריך הסקי המלא" מחויבים להנגיש את האתר שלנו לכלל המשתמשים, כולל אנשים עם מוגבלויות.
                    אנו פועלים כל העת לשפר את חווית השימוש ולהבטיח שהאתר יהיה נוח וקל לשימוש עבור כולם.
                  </p>
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg">
                    פעולות הנגשה שבוצעו:
                  </h4>
                  <ul className="list-disc pr-5 space-y-1">
                    <li>האתר תואם לדפדפנים נפוצים ולשימוש במכשירים ניידים.</li>
                    <li>קוד האתר נבנה בהתאם לתקני נגישות מקובלים (WCAG 2.1 AA).</li>
                    <li>אנו משתמשים בשפה ברורה ופשוטה ככל האפשר.</li>
                    <li>אפשרות לניווט באמצעות מקלדת.</li>
                    <li>הוספת תיאורי תמונה (alt text) היכן שרלוונטי.</li>
                    <li>יחסי ניגודיות מספקים בין טקסט לרקע.</li>
                  </ul>
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg">
                    פניות ומשוב:
                  </h4>
                  <p>
                    אנו ממשיכים במאמצים לשפר את נגישות האתר כחלק ממחויבותנו לאפשר לכלל האוכלוסייה לגלוש באתר.
                    אם נתקלתם בבעיית נגישות או שיש לכם הצעות לשיפור, נשמח לשמוע מכם.
                    אנא צרו קשר בכתובת מייל: <a href="mailto:accessibility@example.com" className="text-blue-600 hover:underline">accessibility@example.com</a>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <FaqSection page="guides" />
    </div>
  );
}