const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Edit, Mountain, Plane, Save, Trash2, MountainSnow, Upload, GraduationCap, MessageCircle, Link as LinkIcon, BookLock, Star, ThumbsUp, ThumbsDown, Clock, Tag, ChevronDown, ChevronUp, Briefcase, PlusCircle, Shield, BarChart3, ExternalLink, BookOpen, Sparkles, Eye, EyeOff, Loader2, HelpCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast as sonnerToast } from 'sonner';
import TripPreparationTab from "@/components/TripPreparationTab";
import VipFormBuilder from "@/components/admin/VipFormBuilder";
import TestimonialsManager from "@/components/admin/TestimonialsManager";
import SettingsManagement from "@/components/admin/SettingsManagement";
import LegalDocumentsTab from "@/components/admin/LegalDocumentsTab";
import ArticlesManager from "@/components/admin/ArticlesManager";
import AdminFeedbackTabContent from "@/components/admin/AdminFeedbackTab";
import FaqManager from "@/components/admin/FaqManager";
const ReviewsInlineTab = ({ reviews, destinations, handleReviewStatusChange, confirmDelete }) => { const pending = reviews.filter(r => r.status==='pending'); return <div className="space-y-8"><Card className="border-0 shadow-xl"><CardHeader><CardTitle>ביקורות ממתינות ({pending.length})</CardTitle></CardHeader><CardContent className="space-y-4">{pending.length>0?<div className="grid md:grid-cols-2 gap-4">{pending.map(review => { const dest=destinations.find(d=>d.id===review.destination_id); return <Card key={review.id} className="flex flex-col"><CardHeader className="pb-2"><CardTitle className="text-lg flex justify-between">{review.user_nickname||review.created_by}<Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">ממתין</Badge></CardTitle><CardDescription>יעד: {dest?.name||'לא ידוע'} | דירוג: {review.general_rating}/5</CardDescription></CardHeader><CardContent className="flex-grow text-sm">{review.comment&&<p className="italic mb-2">"{review.comment}"</p>}{review.pros?.length>0&&<div><strong>אהב/ה:</strong> {review.pros.join(', ')}</div>}</CardContent><CardFooter className="flex gap-2 pt-0 justify-end"><Button onClick={()=>handleReviewStatusChange(review,'approved')} size="sm" variant="outline" className="text-green-600 border-green-600"><ThumbsUp className="w-4 h-4 ml-1"/>אישור</Button><Button onClick={()=>handleReviewStatusChange(review,'rejected')} size="sm" variant="outline" className="text-red-600 border-red-600"><ThumbsDown className="w-4 h-4 ml-1"/>דחייה</Button><Button size="sm" variant="destructive" onClick={()=>confirmDelete('Review',review.id)}><Trash2 className="w-4 h-4"/></Button></CardFooter></Card>;})}</div>:<p>אין ביקורות ממתינות.</p>}</CardContent></Card><Card className="border-0 shadow-xl"><CardHeader><CardTitle>כל הביקורות ({reviews.length})</CardTitle></CardHeader><CardContent className="space-y-4">{reviews.length>0?reviews.map(review=>{ const dest=destinations.find(d=>d.id===review.destination_id); const st=review.status==='approved'?'default':(review.status==='rejected'?'destructive':'secondary'); const stTxt=review.status==='approved'?'מאושר':(review.status==='rejected'?'נדחה':'ממתין'); return <div key={review.id} className="p-4 border rounded-lg bg-slate-50 space-y-3"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{dest?.name||"יעד לא ידוע"}</h4><p className="text-xs text-slate-500">{review.user_nickname||review.created_by} | <Badge variant={st}>{stTxt}</Badge></p></div><div className="flex gap-2">{review.status!=='approved'&&<Button size="sm" variant="outline" onClick={()=>handleReviewStatusChange(review,'approved')}><ThumbsUp className="w-4 h-4"/></Button>}{review.status!=='rejected'&&<Button size="sm" variant="outline" onClick={()=>handleReviewStatusChange(review,'rejected')}><ThumbsDown className="w-4 h-4"/></Button>}<Button size="sm" variant="destructive" onClick={()=>confirmDelete('Review',review.id)}><Trash2 className="w-4 h-4"/></Button></div></div><div className="text-sm bg-white p-3 rounded-md"><p><strong>דירוג:</strong> {review.general_rating}/5</p>{review.comment&&<p><strong>תגובה:</strong> {review.comment}</p>}</div></div>; }):<p>אין ביקורות.</p>}</CardContent></Card></div>; };
const ClickTrackingInlineTab = () => { const [data, setData] = React.useState([]); const [loading, setLoading] = React.useState(true); React.useEffect(()=>{ db.entities.ProductClick.list().then(d=>setData(d||[])).finally(()=>setLoading(false)); },[]); const total=data.reduce((s,c)=>s+Number(c.click_count||0),0); if(loading) return <Card className="border-0 shadow-xl"><CardContent className="p-6 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></CardContent></Card>; return <Card className="border-0 shadow-xl"><CardHeader><CardTitle>נתוני הקלקות | סה"כ: {total}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="text-right">שם המוצר</TableHead><TableHead className="text-right">קליקים</TableHead><TableHead className="text-right">תאריך איפוס</TableHead></TableRow></TableHeader><TableBody>{data.map(item=><TableRow key={item.id}><TableCell>{item.product_name||'לא ידוע'}</TableCell><TableCell><Badge>{item.click_count||0}</Badge></TableCell><TableCell>{item.last_reset_date?new Date(item.last_reset_date).toLocaleDateString('he-IL'):'-'}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>; };

// SkiSchoolForm - compact inline
const SkiSchoolForm = ({ initialData, onSubmit, onCancel, destinations }) => {
  const empty = { destination_name: "", school_name: "", booking_url: "", whatsapp_contact: "", whatsapp_message: "", instructor_name: "", notes: "" };
  const [formData, setFormData] = useState(initialData || empty);
  useEffect(() => { setFormData(initialData || empty); }, [initialData]);
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div><Label>שם בית הספר / מדריך</Label><Input name="school_name" value={formData.school_name} onChange={handleChange} required /></div>
      <div><Label>שיוך ליעד סקי</Label><Select value={formData.destination_name} onValueChange={(v) => setFormData(p => ({...p, destination_name: v}))}><SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first"><SelectValue placeholder="בחר יעד..." /></SelectTrigger><SelectContent>{destinations.filter(d => d.name).map(d => <SelectItem key={d.id} value={d.name} className="text-right">{d.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>קישור להזמנה</Label><Input name="booking_url" type="url" value={formData.booking_url} onChange={handleChange} /></div>
      <div><Label>קישור וואטסאפ</Label><Input name="whatsapp_contact" type="url" value={formData.whatsapp_contact} onChange={handleChange} placeholder="https://wa.me/..." /></div>
      <div><Label>טקסט ברירת מחדל להודעת וואטסאפ</Label><Textarea name="whatsapp_message" value={formData.whatsapp_message} onChange={handleChange} rows={2} /></div>
      <div><Label>שם המדריך (אופציונלי)</Label><Input name="instructor_name" value={formData.instructor_name} onChange={handleChange} /></div>
      <div><Label>הערות</Label><Textarea name="notes" value={formData.notes} onChange={handleChange} /></div>
      <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={onCancel}>ביטול</Button><Button type="submit">{initialData?.id ? "עדכן" : "הוסף"}</Button></DialogFooter>
    </form>
  );
};

// --- Admin Panel Sub-Components (as content for tabs) ---

// AdminClickTrackingTabContent - inline kept (small enough)

// AdminFeedbackTabContent extracted to components/admin/AdminFeedbackTab.jsx

// AdminReviewsTabContent - see usage below (inline)

// InsuranceForm - inline simple form (preserved for dialog usage)
const InsuranceForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || { name: "", description: "", logo_url: "", action_link: "", sort_order: 0, is_active: true });
  useEffect(() => { setFormData(initialData || { name: "", description: "", logo_url: "", action_link: "", sort_order: 0, is_active: true }); }, [initialData]);
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.action_link) { sonnerToast.error("שם החברה וקישור ההזמנה הם שדות חובה"); return; }
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div><Label>שם חברת הביטוח <span className="text-red-500">*</span></Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
      <div><Label>תיאור קצר</Label><Textarea name="description" value={formData.description} onChange={handleChange} rows={3} /></div>
      <div><Label>קישור ללוגו החברה</Label><Input name="logo_url" type="url" value={formData.logo_url} onChange={handleChange} placeholder="https://example.com/logo.png" />{formData.logo_url && <img src={formData.logo_url} alt="לוגו" className="mt-2 h-16 w-auto object-contain rounded" onError={(e) => e.target.style.display='none'} />}</div>
      <div><Label>קישור ישיר להזמנת הביטוח <span className="text-red-500">*</span></Label><Input name="action_link" type="url" value={formData.action_link} onChange={handleChange} required /></div>
      <div><Label>סדר הצגה</Label><Input name="sort_order" type="number" min="0" value={formData.sort_order} onChange={handleChange} /></div>
      <div className="flex items-center space-x-2 space-x-reverse"><Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(c) => setFormData(p => ({...p, is_active: c}))} /><Label htmlFor="is_active" className="cursor-pointer">האם להציג את הספק באתר?</Label></div>
      <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={onCancel}>ביטול</Button><Button type="submit">{initialData?.id ? "עדכן" : "הוסף"}</Button></DialogFooter>
    </form>
  );
};

// --- Main AdminPanel Component ---

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for all entities
  const [destinations, setDestinations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [skiSchools, setSkiSchools] = useState([]);
  const [airports, setAirports] = useState([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [accommodationProviders, setAccommodationProviders] = useState([]);
  const [carRentalProviders, setCarRentalProviders] = useState([]);
  const [recommendedLinks, setRecommendedLinks] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [skiProducts, setSkiProducts] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // Form states - for new items or editing existing ones
  const [editingDestination, setEditingDestination] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const [editingAirport, setEditingAirport] = useState(null);
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [editingAccommodation, setEditingAccommodation] = useState(null);
  const [editingCarRental, setEditingCarRental] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [kosherPlaces, setKosherPlaces] = useState([]);
  const [editingKosherPlace, setEditingKosherPlace] = useState(null);

  // AI Destination Search
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // Delete confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null });

  const checkAuth = useCallback(async () => {
    try {
      const userData = await db.auth.me();
      if (userData && userData.role === 'admin') {
        setUser(userData);
        await loadGlobalData();
      } else {
        sonnerToast.error("שגיאת אימות. אנא התחבר כמנהל.");
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Auth error:', error);
      sonnerToast.error("שגיאת אימות. אנא התחבר כמנהל.");
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadGlobalData = useCallback(async () => {
    try {
      // Batch 1: Core destination data
      const [destData, equipData, schoolsData, airportsData] = await Promise.all([
        db.entities.SkiDestination.list("-created_date"),
        db.entities.Equipment.list("-created_date"),
        db.entities.SkiSchool.list("-created_date"),
        db.entities.Airport.list("-created_date"),
      ]);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Batch 2: Providers
      const [insuranceData, accommodationData, carRentalData] = await Promise.all([
        db.entities.InsuranceProvider.list("sort_order"),
        db.entities.AccommodationProvider.list("-created_date"),
        db.entities.CarRentalProvider.list("-created_date"),
      ]);

      await new Promise(resolve => setTimeout(resolve, 300));

      // Batch 3: Content and feedback
      const [linksData, categoriesData, productsData, feedbackData, reviewsData, kosherPlacesData] = await Promise.all([
        db.entities.RecommendedLink.list("-created_date"),
        db.entities.ProductCategory.list("order"),
        db.entities.SkiProduct.list("-created_date"),
        db.entities.Feedback.list("-created_date"),
        db.entities.Review.list("-created_date"),
        db.entities.KosherPlace.list("sort_order"),
      ]);

      setDestinations(destData.filter(d => d));
      setEquipment(equipData.filter(e => e));
      setSkiSchools(schoolsData.filter(s => s));
      setAirports(airportsData.filter(a => a));
      setInsuranceProviders(insuranceData.filter(i => i));
      setAccommodationProviders(accommodationData.filter(a => a));
      setCarRentalProviders(carRentalData.filter(c => c));
      setRecommendedLinks(linksData.filter(l => l));
      setProductCategories(categoriesData.filter(c => c));
      setSkiProducts(productsData.filter(p => p));
      setFeedbackList(feedbackData.filter(f => f));
      setReviews(reviewsData.filter(r => r));
      setKosherPlaces(kosherPlacesData.filter(k => k));
      
    } catch (error) {
      console.error('Error loading data:', error);
      sonnerToast.error('שגיאה בטעינת נתונים');
    }
  }, []);

  // Universal image/video upload handler
  const handleFileUpload = useCallback(async (file, setter) => {
    if (!file) return;
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setter(file_url);
      sonnerToast.success("קובץ הועלה בהצלחה!");
      return file_url;
    } catch (error) {
      console.error("Error uploading file:", error);
      sonnerToast.error("שגיאה בהעלאת הקובץ");
      return null;
    }
  }, []);

  // CRUD Functions

  // AI Search for destination
  const handleAiSearch = useCallback(async () => {
    if (!aiSearchQuery.trim()) {
      sonnerToast.error('אנא הזן שם אתר סקי');
      return;
    }

    setAiSearchLoading(true);
    try {
      const prompt = `You are a ski resort data expert. Search the internet for detailed, accurate information about the ski resort: "${aiSearchQuery}".

IMPORTANT INSTRUCTIONS:
1. Search for data from reliable sources, preferably from skiresort.info and the resort's official website
2. Return ONLY valid JSON, with no additional text
3. For any field you cannot find reliable data - return null or omit it. DO NOT invent data.
4. For airports - include ONLY airports reachable from Israel (direct flights or 1 reasonable connection)
5. For live cam - include ONLY if there's a real embeddable live camera (YouTube embed or official camera site iframe)
6. For images - include ONLY if copyright-free (Unsplash, Pexels, official sites allowing use)

REQUIRED JSON STRUCTURE:
{
  "name": "string (resort name in Hebrew if possible, otherwise English)",
  "country": "string (country in Hebrew)",
  "region": "string (region/area)",
  "latitude": number,
  "longitude": number,
  "nearest_airport": "string (IATA code)",
  "nearest_airports": ["string (IATA codes)"],
  "airport_distances": {"IATA": number (km)},
  "drive_times": {"IATA": "string (e.g., '2 שעות')"},
  "lower_elevation": number (meters),
  "upper_elevation": number (meters),
  "season_start_date": "YYYY-MM-DD",
  "season_end_date": "YYYY-MM-DD",
  "difficulty_level": "מתחילים" | "בינוניים" | "מתקדמים" | "כל הרמות",
  "budget_level": "נמוך" | "בינוני" | "גבוה",
  "average_cost_per_night": number (EUR),
  "ski_pass_price": number (EUR daily),
  "blue_piste_km": number,
  "red_piste_km": number,
  "black_piste_km": number,
  "description": "string (Hebrew or English)",
  "highlights": ["string"],
  "website_url": "string",
  "youtube_url": "string (YouTube URL or video ID)",
  "image_url": "string (copyright-free only)",
  "live_cam_embed_url": "string (embeddable iframe URL)",
  "is_beginner_friendly": boolean,
  "has_kosher_option": boolean
}

Fields you MUST NOT invent if uncertain:
- season dates
- airport distances
- drive times
- piste kilometers

Return ONLY the JSON object, nothing else.`;

      const result = await db.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            country: { type: "string" },
            region: { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            nearest_airport: { type: "string" },
            nearest_airports: { type: "array", items: { type: "string" } },
            airport_distances: { type: "object" },
            drive_times: { type: "object" },
            lower_elevation: { type: "number" },
            upper_elevation: { type: "number" },
            season_start_date: { type: "string" },
            season_end_date: { type: "string" },
            difficulty_level: { type: "string" },
            budget_level: { type: "string" },
            average_cost_per_night: { type: "number" },
            ski_pass_price: { type: "number" },
            blue_piste_km: { type: "number" },
            red_piste_km: { type: "number" },
            black_piste_km: { type: "number" },
            description: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            website_url: { type: "string" },
            youtube_url: { type: "string" },
            image_url: { type: "string" },
            live_cam_embed_url: { type: "string" },
            is_beginner_friendly: { type: "boolean" },
            has_kosher_option: { type: "boolean" }
          }
        }
      });

      // Check for missing fields
      const allFields = [
        'name', 'country', 'region', 'latitude', 'longitude', 'nearest_airport',
        'nearest_airports', 'airport_distances', 'drive_times', 'lower_elevation',
        'upper_elevation', 'season_start_date', 'season_end_date', 'difficulty_level',
        'budget_level', 'average_cost_per_night', 'ski_pass_price', 'blue_piste_km',
        'red_piste_km', 'black_piste_km', 'description', 'highlights', 'website_url',
        'youtube_url', 'image_url', 'live_cam_embed_url', 'is_beginner_friendly',
        'has_kosher_option'
      ];
      
      const missing = allFields.filter(field => 
        !result[field] || 
        (Array.isArray(result[field]) && result[field].length === 0) ||
        (typeof result[field] === 'object' && Object.keys(result[field]).length === 0)
      );
      
      setMissingFields(missing);

      // Fill the existing form with AI data, set is_published to false by default
      setEditingDestination(prev => ({
        ...(prev || {}),
        ...result,
        is_published: false // Default to draft
      }));

      setIsAiSearchOpen(false);
      setAiSearchQuery("");
      sonnerToast.success('הנתונים נטענו בהצלחה! בדוק ועדכן לפי הצורך');
    } catch (error) {
      console.error("AI search error:", error);
      sonnerToast.error('שגיאה בחיפוש: ' + error.message);
    } finally {
      setAiSearchLoading(false);
    }
  }, [aiSearchQuery]);

  // Toggle publish status
  const handleTogglePublish = useCallback(async (destination) => {
    try {
      await db.entities.SkiDestination.update(destination.id, {
        is_published: !destination.is_published
      });
      sonnerToast.success(destination.is_published ? 'היעד הוסתר' : 'היעד פורסם');
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בעדכון סטטוס הפרסום');
    }
  }, [loadGlobalData]);

  // Destinations CRUD
  const handleSaveDestination = useCallback(async (data, isNew = false) => {
    try {
      // Comprehensive validation
      if (!data?.name || !data?.country || !data?.nearest_airport || !data?.budget_level) {
        sonnerToast.error('אנא מלא את כל השדות החובה: שם היעד, מדינה, שדה תעופה ראשי ורמת תקציב');
        return;
      }

      if (!data?.difficulty_level) {
        sonnerToast.error('אנא בחר רמת קושי');
        return;
      }

      const parsedData = { ...data };
      ['airport_distances', 'drive_times'].forEach(field => {
          if (typeof parsedData[field] === 'string' && parsedData[field]) {
              try {
                  parsedData[field] = JSON.parse(parsedData[field]);
              } catch (e) {
                  sonnerToast.error(`פורמט JSON שגוי עבור ${field}: ${e.message}`);
                  throw e;
              }
          } else {
              parsedData[field] = parsedData[field] || {};
          }
      });
      ['highlights', 'nearest_airports'].forEach(field => {
        if (typeof parsedData[field] === 'string') {
          parsedData[field] = parsedData[field].split(',').map(item => item.trim()).filter(item => item);
        } else {
          parsedData[field] = parsedData[field] || [];
        }
      });

      if (Array.isArray(parsedData.nearest_airport)) {
          parsedData.nearest_airport = parsedData.nearest_airport[0] || "";
      }

      parsedData.lower_elevation = parsedData.lower_elevation ? parseInt(parsedData.lower_elevation) : 0;
      parsedData.upper_elevation = parsedData.upper_elevation ? parseInt(parsedData.upper_elevation) : 0;
      parsedData.average_cost_per_night = parsedData.average_cost_per_night ? parseInt(parsedData.average_cost_per_night) : 0;
      parsedData.ski_pass_price = parsedData.ski_pass_price ? parseInt(parsedData.ski_pass_price) : 0;
      parsedData.total_piste_km = parsedData.total_piste_km ? parseInt(parsedData.total_piste_km) : 0;
      parsedData.blue_piste_km = parsedData.blue_piste_km ? parseInt(parsedData.blue_piste_km) : 0;
      parsedData.red_piste_km = parsedData.red_piste_km ? parseInt(parsedData.red_piste_km) : 0;
      parsedData.black_piste_km = parsedData.black_piste_km ? parseInt(parsedData.black_piste_km) : 0;
      parsedData.is_beginner_friendly = !!parsedData.is_beginner_friendly;
      parsedData.has_kosher_option = !!parsedData.has_kosher_option;
      parsedData.is_featured = !!parsedData.is_featured;
      parsedData.is_published = parsedData.is_published !== false; // Ensure boolean, default true if not specified

      if (isNew) {
        await db.entities.SkiDestination.create(parsedData);
        sonnerToast.success('היעד נוצר בהצלחה');
      } else {
        await db.entities.SkiDestination.update(data.id, parsedData);
        sonnerToast.success('היעד עודכן בהצלחה');
      }
      setEditingDestination(null);
      setMissingFields([]);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת היעד: ' + error.message);
    }
  }, [loadGlobalData]);

  // Equipment CRUD
  const handleSaveEquipment = useCallback(async (data, isNew = false) => {
    try {
      // Validation
      if (!data?.name || !data?.category || !data?.importance) {
        sonnerToast.error('אנא מלא את כל השדות החובה: שם הפריט, קטגוריה וחשיבות');
        return;
      }

      const payload = {
        ...data,
        estimated_price: data?.estimated_price ? parseFloat(data.estimated_price) : null,
      };
      if (isNew) {
        await db.entities.Equipment.create(payload);
        sonnerToast.success('הציוד נוצר בהצלחה');
      } else {
        await db.entities.Equipment.update(data.id, payload);
        sonnerToast.success('הציוד עודכן בהצלחה');
      }
      setEditingEquipment(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת הציוד: ' + error.message);
    }
  }, [loadGlobalData]);

  // Ski Schools CRUD
  const handleSaveSchool = useCallback(async (data, isNew = false) => {
    try {
      // Validation
      if (!data?.destination_name || !data?.school_name) {
        sonnerToast.error('אנא מלא את כל השדות החובה: יעד ושם בית הספר');
        return;
      }

      if (isNew) {
        await db.entities.SkiSchool.create(data);
        sonnerToast.success('בית הספר נוצר בהצלחה');
      } else {
        await db.entities.SkiSchool.update(data.id, data);
        sonnerToast.success('בית הספר עודכן בהצלחה');
      }
      setEditingSchool(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת בית הספר: ' + error.message);
    }
  }, [loadGlobalData]);

  // Airports CRUD
  const handleSaveAirport = useCallback(async (data, isNew = false) => {
    try {
      // Validation for required fields
      if (!data?.name || !data?.code || !data?.city || !data?.country) {
        sonnerToast.error('אנא מלא את כל השדות החובה: שם שדה התעופה, קוד IATA, עיר ומדינה');
        return;
      }

      const payload = {
        ...data,
        serves_destinations: typeof data?.serves_destinations === 'string' ? data.serves_destinations.split(',').map(d => d.trim()).filter(d => d) : (data?.serves_destinations || []),
      };

      if (isNew) {
        const codeExists = airports.some(airport => airport?.code?.toUpperCase() === payload?.code?.toUpperCase());
        if (codeExists) {
            sonnerToast.error("שגיאה: קוד שדה תעופה זה כבר קיים במערכת.");
            return;
        }
        await db.entities.Airport.create(payload);
        sonnerToast.success('שדה התעופה נוצר בהצלחה');
      } else {
        await db.entities.Airport.update(data.id, payload);
        sonnerToast.success('שדה התעופה עודכן בהצלחה');
      }
      setEditingAirport(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת שדה התעופה: ' + error.message);
    }
  }, [loadGlobalData, airports]);

  // Insurance Providers CRUD
  const handleSaveInsurance = useCallback(async (data, isNew = false) => {
    try {
      const payload = {
        ...data,
        sort_order: Number(data.sort_order) || 0,
      };
      
      if (isNew) {
        await db.entities.InsuranceProvider.create(payload);
        sonnerToast.success('ספק הביטוח נוצר בהצלחה');
      } else {
        await db.entities.InsuranceProvider.update(data.id, payload);
        sonnerToast.success('ספק הביטוח עודכן בהצלחה');
      }
      setEditingInsurance(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת ספק הביטוח: ' + error.message);
    }
  }, [loadGlobalData]);

  // Accommodation Providers CRUD
  const handleSaveAccommodation = useCallback(async (data, isNew = false) => {
    try {
      // Validation for required fields
      if (!data?.name || !data?.url) {
        sonnerToast.error('אנא מלא את כל השדות החובה: שם הספק וקישור לאתר');
        return;
      }

      const payload = {
        name: data.name,
        url: data.url,
        description: data.description || '',
        image_url: data.image_url || '',
        order: Number(data.order) || 0
      };

      if (isNew) {
        await db.entities.AccommodationProvider.create(payload);
        sonnerToast.success('ספק הלינה נוצר בהצלחה');
      } else {
        await db.entities.AccommodationProvider.update(data.id, payload);
        sonnerToast.success('ספק הלינה עודכן בהצלחה');
      }
      setEditingAccommodation(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת ספק הלינה: ' + error.message);
    }
  }, [loadGlobalData]);

  // Car Rental Providers CRUD
  const handleSaveCarRental = useCallback(async (data, isNew = false) => {
    try {
      // Validation for required fields
      if (!data?.name || !data?.url) {
        sonnerToast.error('אנא מלא את כל השדות החובה: שם הספק וקישור לאתר');
        return;
      }

      const payload = {
        name: data.name,
        url: data.url,
        description: data.description || '',
        logo_url: data.logo_url || '',
        order: Number(data.order) || 0,
        is_active: data.is_active !== false // Ensure boolean, defaults to true if undefined/null
      };

      if (isNew) {
        await db.entities.CarRentalProvider.create(payload);
        sonnerToast.success('ספק הרכב נוצר בהצלחה');
      } else {
        await db.entities.CarRentalProvider.update(data.id, payload);
        sonnerToast.success('ספק הרכב עודכן בהצלחה');
      }
      setEditingCarRental(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת ספק הרכב: ' + error.message);
    }
  }, [loadGlobalData]);

  // Recommended Links CRUD
  const handleSaveLink = useCallback(async (data, isNew = false) => {
    try {
      // Validation
      if (!data?.title || !data?.link_url) {
        sonnerToast.error('אנא מלא את כל השדות החובה: כותרת וכתובת URL');
        return;
      }

      // URL validation
      try {
        new URL(data.link_url);
      } catch {
        sonnerToast.error('כתובת ה-URL שהוזנה אינה תקינה');
        return;
      }

      // Ensure is_visible is explicitly set as boolean
      const linkData = {
        ...data,
        is_visible: data.is_visible === true || data.is_visible === undefined // Default to true if not specified
      };

      if (isNew) {
        await db.entities.RecommendedLink.create(linkData);
        sonnerToast.success('הקישור נוצר בהצלחה');
      } else {
        await db.entities.RecommendedLink.update(data.id, linkData);
        sonnerToast.success('הקישור עודכן בהצלחה');
      }
      setEditingLink(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת הקישור: ' + error.message);
    }
  }, [loadGlobalData]);

  // Product Categories CRUD
  const handleSaveCategory = useCallback(async (data, isNew = false) => {
    try {
      // Validation
      if (!data?.name) {
        sonnerToast.error('אנא הזן שם לקטגוריה');
        return;
      }

      const payload = { ...data, order: Number(data?.order || 0) };
      if (isNew) {
        await db.entities.ProductCategory.create(payload);
        sonnerToast.success('הקטגוריה נוצרה בהצלחה');
      } else {
        await db.entities.ProductCategory.update(data.id, payload);
        sonnerToast.success('הקטגוריה עודכנה בהצלחה');
      }
      setEditingCategory(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת הקטגוריה: ' + error.message);
    }
  }, [loadGlobalData]);

  // Products CRUD
  const handleSaveProduct = useCallback(async (data, isNew = false) => {
    try {
      // Validation
      if (!data?.name || !data?.category_id || !data?.price || !data?.link) {
        sonnerToast.error('אנא מלא את כל השדות החובה: שם המוצר, קטגוריה, מחיר וקישור');
        return;
      }

      // Price validation
      const priceValue = Number(data.price);
      if (isNaN(priceValue) || priceValue < 0) {
        sonnerToast.error('מחיר המוצר חייב להיות מספר חיובי');
        return;
      }

      // URL validation
      try {
        new URL(data.link);
      } catch {
        sonnerToast.error('קישור המוצר אינו תקין');
        return;
      }

      const payload = { 
        ...data, 
        price: priceValue,
        is_cheapest: !!data.is_cheapest,
        is_best_seller: !!data.is_best_seller,
        editors_pick: !!data.editors_pick
      };
      
      if (isNew) {
        await db.entities.SkiProduct.create(payload);
        sonnerToast.success('המוצר נוצר בהצלחה');
      } else {
        await db.entities.SkiProduct.update(data.id, payload);
        sonnerToast.success('המוצר עודכן בהצלחה');
      }
      setEditingProduct(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת המוצר: ' + error.message);
    }
  }, [loadGlobalData]);

  // Reviews actions
  const handleReviewStatusChange = useCallback(async (review, newStatus) => {
    try {
      await db.entities.Review.update(review.id, { status: newStatus });
      sonnerToast.success(`סטטוס הביקורת עודכן ל: ${newStatus}`);
      await loadGlobalData();
    } catch(e) {
      console.error(e);
      sonnerToast.error("שגיאה בעדכון סטטוס הביקורת");
    }
  }, [loadGlobalData]);

  const handleMarkFeedbackAsRead = useCallback(async (feedbackId) => {
    try {
      await db.entities.Feedback.update(feedbackId, { is_read: true });
      sonnerToast.success('המשוב סומן כנקרא');
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בסימון המשוב');
    }
  }, [loadGlobalData]);

  // Kosher Places CRUD
  const handleSaveKosherPlace = useCallback(async (data, isNew = false) => {
    try {
      if (!data?.name || !data?.destination_id) {
        sonnerToast.error('אנא מלא את שם המקום');
        return;
      }

      const payload = {
        ...data,
        type: Array.isArray(data.type) ? data.type : (data.type ? [data.type] : []),
        shabbat_options: Array.isArray(data.shabbat_options) ? data.shabbat_options : (data.shabbat_options ? [data.shabbat_options] : []),
        sort_order: Number(data.sort_order) || 0,
        is_visible: data.is_visible !== false
      };

      if (isNew) {
        await db.entities.KosherPlace.create(payload);
        sonnerToast.success('המקום הכשר נוצר בהצלחה');
      } else {
        await db.entities.KosherPlace.update(data.id, payload);
        sonnerToast.success('המקום הכשר עודכן בהצלחה');
      }
      setEditingKosherPlace(null);
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה בשמירת המקום הכשר: ' + error.message);
    }
  }, [loadGlobalData]);

  // Generic Delete Handler
  const confirmDelete = useCallback((type, id) => {
    setDeleteConfirm({ open: true, type, id });
  }, []);

  const executeDelete = useCallback(async () => {
    const { type, id } = deleteConfirm;
    setDeleteConfirm({ open: false, type: null, id: null });
    
    try {
      switch (type) {
        case 'SkiDestination': await db.entities.SkiDestination.delete(id); break;
        case 'Equipment': await db.entities.Equipment.delete(id); break;
        case 'SkiSchool': await db.entities.SkiSchool.delete(id); break;
        case 'Airport': await db.entities.Airport.delete(id); break;
        case 'InsuranceProvider': await db.entities.InsuranceProvider.delete(id); break;
        case 'AccommodationProvider': await db.entities.AccommodationProvider.delete(id); break;
        case 'CarRentalProvider': await db.entities.CarRentalProvider.delete(id); break;
        case 'RecommendedLink': await db.entities.RecommendedLink.delete(id); break;
        case 'ProductCategory': await db.entities.ProductCategory.delete(id); break;
        case 'SkiProduct': await db.entities.SkiProduct.delete(id); break;
        case 'Review': await db.entities.Review.delete(id); break;
        case 'Feedback': await db.entities.Feedback.delete(id); break;
        case 'TripPreparation': await db.entities.TripPreparation.delete(id); break;
        case 'KosherPlace': await db.entities.KosherPlace.delete(id); break;
        default: throw new Error(`Unknown entity type for deletion: ${type}`);
      }
      sonnerToast.success('הפריט נמחק בהצלחה');
      await loadGlobalData();
    } catch (error) {
      console.error(error);
      sonnerToast.error('שגיאה במחיקת הפריט: ' + error.message);
    }
  }, [deleteConfirm, loadGlobalData]);

  const pendingReviewsCount = reviews.filter(r => r && r.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const adminSections = [
    { id: 'destinations', name: 'יעדי סקי', icon: Mountain },
    { id: 'airports', name: 'שדות תעופה', icon: Plane },
    { id: 'equipment', name: 'ציוד סקי', icon: MountainSnow },
    { id: 'ski-schools', name: 'בתי ספר', icon: GraduationCap },
    { id: 'trip-preparation', name: 'הכנה לחופשה', icon: BookOpen },
    { id: 'deals', name: 'דילים', icon: Tag },
    { id: 'links', name: 'קישורים מומלצים', icon: LinkIcon },
    { id: 'insurance-tab', name: 'ביטוח', icon: Shield },
    { id: 'accommodation', name: 'לינה', icon: BookLock },
    { id: 'car-rental', name: 'השכרת רכב', icon: Briefcase },
    { id: 'vip-form', name: 'טופס VIP', icon: Sparkles },
    { id: 'reviews', name: 'ביקורות', icon: Star, count: pendingReviewsCount },
    { id: 'testimonials', name: 'המלצות', icon: ThumbsUp },
    { id: 'feedback', name: 'משוב', icon: MessageCircle },
    { id: 'click-tracking', name: 'נתוני הקלקות', icon: BarChart3 },
    { id: 'legal', name: 'מסמכים משפטיים', icon: BookLock },
    { id: 'articles', name: 'מאמרים ומדריכים', icon: BookOpen },
    { id: 'faq', name: 'שאלות נפוצות', icon: HelpCircle },
    { id: 'settings', name: 'הגדרות', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 overflow-x-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">פאנל ניהול</h1>
          <p className="text-slate-600 mt-2">ניהול מלא של כל תכני האתר</p>
        </div>

        <Tabs defaultValue="destinations" dir="rtl" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-8 h-auto bg-transparent p-0">
            {adminSections.map(section => (
              <TabsTrigger 
                key={section.id} 
                value={section.id} 
                className="
                  relative flex flex-col items-center justify-center gap-2 
                  bg-white border-2 border-slate-200 rounded-xl 
                  px-4 py-4 md:py-6
                  data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:shadow-lg
                  hover:border-blue-400 hover:-translate-y-1 hover:shadow-md
                  transition-all duration-300
                  min-h-[100px] md:min-h-[120px]
                "
              >
                <section.icon className="w-7 h-7 md:w-8 md:h-8 text-slate-600 data-[state=active]:text-blue-600" />
                <span className="text-xs md:text-sm font-medium text-slate-700 text-center leading-tight">
                  {section.name}
                </span>
                {section.count > 0 && (
                  <Badge className="absolute -top-2 -left-2 bg-red-500 text-white text-xs px-2 py-0.5 h-5 min-w-[20px] flex items-center justify-center rounded-full shadow-lg">
                    {section.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="destinations">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{editingDestination?.id ? "עריכת יעד סקי קיים" : "הוספת יעד סקי חדש"}</CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAiSearchOpen(true)}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300 hover:from-purple-100 hover:to-blue-100"
                  >
                    <Sparkles className="w-4 h-4 ml-2" />
                    מצא יעד בעזרת AI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {missingFields.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      שדות שלא נמצא להם מידע אוטומטי
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {missingFields.map(field => (
                        <Badge key={field} variant="outline" className="bg-white text-amber-800 border-amber-300">
                          {field}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-amber-700 mt-2">ניתן למלא שדות אלו ידנית בטופס למטה</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>שם היעד <span className="text-red-500">*</span></Label>
                    <Input value={editingDestination?.name || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), name: e.target.value})} />
                  </div>
                  <div>
                    <Label>מדינה <span className="text-red-500">*</span></Label>
                    <Input value={editingDestination?.country || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), country: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>שם היעד באנגלית (עבור חיפוש לינה)</Label>
                  <Input
                    value={editingDestination?.name_en || ''}
                    onChange={(e) => setEditingDestination({...(editingDestination || {}), name_en: e.target.value})}
                    placeholder="e.g. Sestriere, Courchevel, Zermatt"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-slate-500 mt-1">יש להזין את שם העיירה/האתר באנגלית כפי שהוא מופיע ב-Google Maps. אם ריק, ישתמש בשם בעברית כברירת מחדל.</p>
                </div>
                <div>
                  <Label>תיאור</Label>
                  <Textarea value={editingDestination?.description || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), description: e.target.value})} />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>רמת קושי <span className="text-red-500">*</span></Label>
                    <Select value={editingDestination?.difficulty_level || 'בינוניים'} onValueChange={val => setEditingDestination({...(editingDestination || {}), difficulty_level: val})}>
                      <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="מתחילים" className="text-right">מתחילים</SelectItem>
                        <SelectItem value="בינוניים" className="text-right">בינוניים</SelectItem>
                        <SelectItem value="מתקדמים" className="text-right">מתקדמים</SelectItem>
                        <SelectItem value="כל הרמות" className="text-right">כל הרמות</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>רמת תקציב <span className="text-red-500">*</span></Label>
                    <Select value={editingDestination?.budget_level || 'בינוני'} onValueChange={val => setEditingDestination({...(editingDestination || {}), budget_level: val})}>
                      <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="נמוך" className="text-right">נמוך</SelectItem>
                        <SelectItem value="בינוני" className="text-right">בינוני</SelectItem>
                        <SelectItem value="גבוה" className="text-right">גבוה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div>
                      <Label>שדה תעופה ראשי <span className="text-red-500">*</span></Label>
                      <Select value={editingDestination?.nearest_airport || ''} onValueChange={val => setEditingDestination({...(editingDestination || {}), nearest_airport: val})}>
                          <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                            <SelectValue placeholder="בחר שדה תעופה"/>
                          </SelectTrigger>
                          <SelectContent>
                              {airports.filter(a => a && a.name && a.code).map(a => <SelectItem key={a.id} value={a.code} className="text-right">{a.name} ({a.code})</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                </div>
                 <div className="grid md:grid-cols-4 gap-4">
                    <div><Label>עלות ממוצעת ללילה (€)</Label><Input type="number" value={editingDestination?.average_cost_per_night || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), average_cost_per_night: e.target.value})} /></div>
                    <div><Label>מחיר סקי-פס יומי (€)</Label><Input type="number" value={editingDestination?.ski_pass_price || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), ski_pass_price: e.target.value})} /></div>
                    <div><Label>גובה תחתון (מ')</Label><Input type="number" value={editingDestination?.lower_elevation || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), lower_elevation: e.target.value})} /></div>
                    <div><Label>גובה עליון (מ')</Label><Input type="number" value={editingDestination?.upper_elevation || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), upper_elevation: e.target.value})} /></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>תאריך פתיחה צפוי</Label>
                      <div className="flex items-center gap-2">
                          <Input type="date" value={editingDestination?.season_start_date || ''} onChange={e => setEditingDestination({...(editingDestination || {}), season_start_date: e.target.value})} />
                          <Button variant="ghost" size="sm" onClick={() => setEditingDestination({...(editingDestination || {}), season_start_date: ''})}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </div>
                    <div>
                      <Label>תאריך סגירה צפוי</Label>
                      <div className="flex items-center gap-2">
                          <Input type="date" value={editingDestination?.season_end_date || ''} onChange={e => setEditingDestination({...(editingDestination || {}), season_end_date: e.target.value})} />
                          <Button variant="ghost" size="sm" onClick={() => setEditingDestination({...(editingDestination || {}), season_end_date: ''})}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                      <div><Label>סה"כ ק"מ מסלולים</Label><Input type="number" value={ (Number(editingDestination?.blue_piste_km || 0) + Number(editingDestination?.red_piste_km || 0) + Number(editingDestination?.black_piste_km || 0)) || ''} readOnly className="bg-slate-100" /></div>
                      <div><Label>ק"מ כחול</Label><Input type="number" value={editingDestination?.blue_piste_km || ''} onChange={e => setEditingDestination({...(editingDestination || {}), blue_piste_km: e.target.value})} /></div>
                      <div><Label>ק"מ אדום</Label><Input type="number" value={editingDestination?.red_piste_km || ''} onChange={e => setEditingDestination({...(editingDestination || {}), red_piste_km: e.target.value})} /></div>
                      <div><Label>ק"מ שחור</Label><Input type="number" value={editingDestination?.black_piste_km || ''} onChange={e => setEditingDestination({...(editingDestination || {}), black_piste_km: e.target.value})} /></div>
                  </div>
                   <div>
                      <Label>נקודות מרכזיות (מופרד בפסיק)</Label>
                      <Input value={Array.isArray(editingDestination?.highlights) ? editingDestination?.highlights.join(', ') : editingDestination?.highlights || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), highlights: e.target.value})} />
                  </div>
                  <div>
                      <Label>שדות תעופה קרובים (קוד, מופרד בפסיק)</Label>
                      <Input
                        value={Array.isArray(editingDestination?.nearest_airports) ? editingDestination?.nearest_airports.join(', ') : editingDestination?.nearest_airports || ''}
                        onChange={(e) => setEditingDestination({...(editingDestination || {}), nearest_airports: e.target.value})}
                        placeholder="למשל: TRN, MXP, FCO"
                      />
                  </div>
                  <div>
                      <Label>מרחקים משדות תעופה (JSON)</Label>
                      <Textarea
                        placeholder='לדוגמה: {"TRN": 95, "MXP": 180}'
                        value={typeof editingDestination?.airport_distances === 'object' ? JSON.stringify(editingDestination?.airport_distances) : editingDestination?.airport_distances || ''}
                        onChange={(e) => setEditingDestination({...(editingDestination || {}), airport_distances: e.target.value})}
                      />
                  </div>
                   <div>
                      <Label>זמני נסיעה (JSON)</Label>
                      <Textarea placeholder='לדוגמה: {"TRN": "1.5 שעות", "MXP": "3 שעות"}'
                        value={typeof editingDestination?.drive_times === 'object' ? JSON.stringify(editingDestination?.drive_times) : editingDestination?.drive_times || ''}
                        onChange={(e) => setEditingDestination({...(editingDestination || {}), drive_times: e.target.value})}
                      />
                  </div>
                   <div className="grid md:grid-cols-2 gap-4">
                     <div className="flex items-center space-x-2">
                       <Checkbox id="destination_beginner_friendly" checked={editingDestination?.is_beginner_friendly || false} onCheckedChange={checked => setEditingDestination({...(editingDestination || {}), is_beginner_friendly: checked})} />
                       <label htmlFor="destination_beginner_friendly" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">מתאים לחופשה ראשונה</label>
                    </div>
                     <div className="flex items-center space-x-2">
                       <Checkbox id="destination_kosher_option" checked={editingDestination?.has_kosher_option || false} onCheckedChange={checked => setEditingDestination({...(editingDestination || {}), has_kosher_option: checked})} />
                       <label htmlFor="destination_kosher_option" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">אופציה לאוכל כשר</label>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                      <Checkbox 
                        id="destination_featured" 
                        checked={editingDestination?.is_featured || false} 
                        onCheckedChange={checked => setEditingDestination({...(editingDestination || {}), is_featured: checked})} 
                      />
                      <label 
                        htmlFor="destination_featured" 
                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-900 flex items-center gap-2"
                      >
                        ⭐ יעד מומלץ - יופיע בקרוסלה בדף הבית
                      </label>
                    </div>

                    <div className="flex items-center space-x-2 bg-green-50 p-4 rounded-lg border-2 border-green-300">
                      <Checkbox 
                        id="destination_published" 
                        checked={editingDestination?.is_published !== false} 
                        onCheckedChange={checked => setEditingDestination({...(editingDestination || {}), is_published: checked})} 
                      />
                      <label 
                        htmlFor="destination_published" 
                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-900 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        הצג יעד זה באתר (פרסום למשתמשים)
                      </label>
                    </div>
                  </div>
                  
                  <div>
                     <Label>כתובת אתר אינטרנט</Label>
                     <Input value={editingDestination?.website_url || ''} onChange={(e) => setEditingDestination({...(editingDestination || {}), website_url: e.target.value})} />
                  </div>

                  {editingDestination?.has_kosher_option && (
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                      <Label className="text-base font-semibold text-green-900 mb-2 block">הודעת וואטסאפ ברירת מחדל למקומות כשרים ביעד זה</Label>
                      <Textarea
                        value={editingDestination?.kosher_whatsapp_message || ''}
                        onChange={(e) => setEditingDestination({...(editingDestination || {}), kosher_whatsapp_message: e.target.value})}
                        placeholder="היי, הגעתי אליכם דרך אתר SkiPlanner.co.il"
                        rows={2}
                        className="text-sm"
                      />
                      <p className="text-xs text-green-700 mt-1">הודעה זו תישלח אוטומטית כאשר משתמש לוחץ על וואטסאפ של מקומות כשרים ביעד זה</p>
                    </div>
                  )}
                  <div>
                      <Label>תמונת רקע</Label>
                      <div className="flex items-center gap-2">
                        <Input value={editingDestination?.image_url || ''} onChange={e => setEditingDestination({...(editingDestination || {}), image_url: e.target.value})} />
                        <Input id="destination-image-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setEditingDestination({...(editingDestination || {}), image_url: url}))} />
                        <Label htmlFor="destination-image-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4" /></span></Button></Label>
                      </div>
                      {editingDestination?.image_url && <img src={editingDestination.image_url} alt="תצוגה מקדימה" className="mt-2 h-24 w-auto rounded-lg object-cover"/>}
                  </div>
                  <div>
                      <Label>וידאו רקע</Label>
                      <div className="flex items-center gap-2">
                          <Input
                              value={editingDestination?.video_url || ""}
                              onChange={e => setEditingDestination({...(editingDestination || {}), video_url: e.target.value})}
                              placeholder="https://example.com/video.mp4"
                          />
                          <Input id="destination-video-upload" type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setEditingDestination({...(editingDestination || {}), video_url: url}))} />
                          <Label htmlFor="destination-video-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4" /></span></Button></Label>
                      </div>
                  </div>
                  <div>
                      <Label>קישור YouTube (אופציונלי)</Label>
                      <Input
                        value={editingDestination?.youtube_url || ""}
                        onChange={e => setEditingDestination({...(editingDestination || {}), youtube_url: e.target.value})}
                        placeholder="https://www.youtube.com/watch?v=... או מזהה הסרטון"
                        dir="ltr"
                        className="text-left"
                      />
                      <p className="text-xs text-slate-500 mt-1">ניתן להזין קישור מלא או רק את מזהה הסרטון</p>
                  </div>
                  <div>
                      <Label>מצלמת לייב - קישור הטמעה (אופציונלי)</Label>
                      <Input
                        value={editingDestination?.live_cam_embed_url || ""}
                        onChange={e => setEditingDestination({...(editingDestination || {}), live_cam_embed_url: e.target.value})}
                        placeholder="https://www.youtube.com/embed/... או קישור iframe אחר"
                        dir="ltr"
                        className="text-left"
                      />
                      <p className="text-xs text-slate-500 mt-1">קישור להטמעת מצלמת לייב - יוצג בדף היעד</p>
                  </div>
                  <div>
                      <Label>קואורדינטות (קו רוחב, קו אורך)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="0.000001"
                          value={editingDestination?.latitude || ""}
                          onChange={e => setEditingDestination({...(editingDestination || {}), latitude: parseFloat(e.target.value) || null})}
                          placeholder="Latitude"
                        />
                        <Input
                          type="number"
                          step="0.000001"
                          value={editingDestination?.longitude || ""}
                          onChange={e => setEditingDestination({...(editingDestination || {}), longitude: parseFloat(e.target.value) || null})}
                          placeholder="Longitude"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">נדרש לתחזית מזג אוויר</p>
                  </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingDestination(null)}>ביטול</Button>
                  <Button onClick={() => handleSaveDestination(editingDestination, !editingDestination?.id)}>{editingDestination?.id ? "עדכן יעד סקי" : "הוסף יעד סקי"}</Button>
                </div>
                </CardContent>
                </Card>

                {/* ניהול מקומות כשרות - מוצג רק ליעד עם has_kosher_option */}
                {editingDestination?.has_kosher_option && editingDestination?.id && (
                <Card className="border-0 shadow-xl mt-8 bg-green-50/30">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-green-900">
                        <MountainSnow className="w-5 h-5" />
                        מידע על אוכל כשר ושבת ב{editingDestination.name}
                      </CardTitle>
                      <p className="text-sm text-green-700 mt-1">ניהול מסעדות, קייטרינג ופתרונות כשרות ביעד זה</p>
                    </div>
                    <Button 
                      onClick={() => setEditingKosherPlace({ destination_id: editingDestination.id, is_visible: true, sort_order: 0 })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף מקום כשר
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {kosherPlaces.filter(kp => kp.destination_id === editingDestination.id).length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {kosherPlaces.filter(kp => kp.destination_id === editingDestination.id).map(place => (
                        <div key={place.id} className="p-4 bg-white rounded-lg border shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-slate-800">{place.name}</h4>
                              {place.type && place.type.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {place.type.map((t, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditingKosherPlace(place)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => confirmDelete('KosherPlace', place.id)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            {place.address && <p>{place.address}</p>}
                            {place.kashrut_supervision && <p className="text-xs text-green-700">כשרות: {place.kashrut_supervision}</p>}
                            {place.open_on_shabbat && place.open_on_shabbat !== 'לא ידוע' && (
                              <Badge variant="outline" className="text-xs">{place.open_on_shabbat === 'כן' ? '✓ פתוח בשבת' : '✗ סגור בשבת'}</Badge>
                            )}
                            <Badge variant={place.is_visible ? "default" : "secondary"} className="text-xs">
                              {place.is_visible ? "מוצג באתר" : "מוסתר"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">לא הוספת עדיין מקומות כשרים ליעד זה. לחץ על "הוסף מקום כשר" כדי להתחיל.</p>
                  )}
                </CardContent>
                </Card>
                )}

            <Card className="border-0 shadow-xl mt-8">
              <CardHeader><CardTitle>יעדי סקי קיימים ({destinations.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {destinations.filter(dest => dest && dest.id && dest.name).map((dest) => (
                    <div key={dest.id} className="p-4 border rounded-lg bg-slate-50 relative">
                      <div className="absolute top-2 left-2 flex gap-1">
                        {dest.is_featured && (
                          <Badge className="bg-blue-600 text-white">⭐ מומלץ</Badge>
                        )}
                        <Badge 
                          variant={dest.is_published ? "default" : "secondary"}
                          className={dest.is_published ? "bg-green-600 text-white" : "bg-gray-400 text-white"}
                        >
                          {dest.is_published ? <Eye className="w-3 h-3 ml-1" /> : <EyeOff className="w-3 h-3 ml-1" />}
                          {dest.is_published ? "מפורסם" : "מוסתר"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-start mb-2 mt-8">
                         <div>
                          <h4 className="font-semibold text-slate-800">{dest.name}</h4>
                          <p className="text-sm text-slate-600">{dest.country || ''}</p>
                        </div>
                        <div className="flex items-center gap-1">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => handleTogglePublish(dest)}
                             title={dest.is_published ? "הסתר יעד" : "פרסם יעד"}
                           >
                             {dest.is_published ? <EyeOff className="w-4 h-4 text-orange-600" /> : <Eye className="w-4 h-4 text-green-600" />}
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => setEditingDestination(dest)}><Edit className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => confirmDelete('SkiDestination', dest.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="airports">
            <Card className="border-0 shadow-xl">
              <CardHeader><CardTitle>{editingAirport?.id ? "עריכת שדה תעופה קיים" : "הוספת שדה תעופה חדש"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>שם שדה התעופה <span className="text-red-500">*</span></Label>
                    <Input value={editingAirport?.name || ''} onChange={(e) => setEditingAirport({...(editingAirport || {}), name: e.target.value})} />
                  </div>
                  <div>
                    <Label>קוד IATA <span className="text-red-500">*</span></Label>
                    <Input value={editingAirport?.code || ''} onChange={(e) => setEditingAirport({...(editingAirport || {}), code: e.target.value})} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>עיר <span className="text-red-500">*</span></Label>
                    <Input value={editingAirport?.city || ''} onChange={(e) => setEditingAirport({...(editingAirport || {}), city: e.target.value})} />
                  </div>
                  <div>
                    <Label>מדינה <span className="text-red-500">*</span></Label>
                    <Input value={editingAirport?.country || ''} onChange={(e) => setEditingAirport({...(editingAirport || {}), country: e.target.value})} />
                  </div>
                </div>
                 <div>
                      <Label>משרת יעדים (שם היעד, מופרד בפסיק)</Label>
                      <Textarea
                        value={Array.isArray(editingAirport?.serves_destinations) ? editingAirport.serves_destinations.join(', ') : editingAirport?.serves_destinations || ''}
                        onChange={(e) => setEditingAirport({...(editingAirport || {}), serves_destinations: e.target.value})}
                        placeholder="למשל: צ'רביניה, ססטרייר, מדונה די קמפיליו"
                      />
                  </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingAirport(null)}>ביטול</Button>
                  <Button onClick={() => handleSaveAirport(editingAirport, !editingAirport?.id)}>{editingAirport?.id ? "עדכן שדה תעופה" : "הוסף שדה תעופה"}</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl mt-8">
              <CardHeader><CardTitle>שדות תעופה קיימים ({airports.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {airports.filter(airport => airport && airport.id && airport.name && airport.code).map((airport) => (
                    <div key={airport.id} className="p-4 border rounded-lg bg-slate-50">
                       <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-800">{airport.name} ({airport.code})</h4>
                          <p className="text-sm text-slate-600">{airport.city || '', airport.country || ''}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingAirport(airport)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => confirmDelete('Airport', airport.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment">
            <Card className="border-0 shadow-xl">
              <CardHeader><CardTitle>{editingEquipment?.id ? "עריכת ציוד קיים" : "הוספת ציוד חדש"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>שם הפריט <span className="text-red-500">*</span></Label>
                      <Input value={editingEquipment?.name || ''} onChange={(e) => setEditingEquipment({...editingEquipment, name: e.target.value})} />
                    </div>
                    <div>
                      <Label>קטגוריה <span className="text-red-500">*</span></Label>
                      <Select value={editingEquipment?.category || 'ציוד גלישה'} onValueChange={val => setEditingEquipment({...editingEquipment, category: val})}>
                        <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="ציוד גלישה" className="text-right">ציוד גלישה</SelectItem><SelectItem value="בטיחות" className="text-right">בטיחות</SelectItem><SelectItem value="לבוש" className="text-right">לבוש</SelectItem><SelectItem value="אביזרים" className="text-right">אביזרים</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                      <Label>תיאור</Label>
                      <Textarea value={editingEquipment?.description || ''} onChange={(e) => setEditingEquipment({...editingEquipment, description: e.target.value})} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                     <div>
                      <Label>חשיבות <span className="text-red-500">*</span></Label>
                      <Select value={editingEquipment?.importance || 'מומלץ'} onValueChange={val => setEditingEquipment({...editingEquipment, importance: val})}>
                        <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="חובה" className="text-right">חובה</SelectItem><SelectItem value="מומלץ" className="text-right">מומלץ</SelectItem><SelectItem value="אופציונלי" className="text-right">אופציונלי</SelectItem></SelectContent>
                      </Select>
                    </div>
                     <div>
                      <Label>מחיר השכרה משוער (€)</Label>
                      <Input type="number" value={editingEquipment?.estimated_price || ''} onChange={(e) => setEditingEquipment({...editingEquipment, estimated_price: e.target.value})} />
                    </div>
                  </div>
                  <div>
                      <Label>קישור לרכישה (כללי)</Label>
                      <Input value={editingEquipment?.purchase_link || ''} onChange={(e) => setEditingEquipment({...editingEquipment, purchase_link: e.target.value})} placeholder="https://example.com/product" />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div><Label>קישור לגברים</Label><Input value={editingEquipment?.link_men || ''} onChange={(e) => setEditingEquipment({...editingEquipment, link_men: e.target.value})} /></div>
                    <div><Label>קישור לנשים</Label><Input value={editingEquipment?.link_women || ''} onChange={(e) => setEditingEquipment({...editingEquipment, link_women: e.target.value})} /></div>
                    <div><Label>קישור לילדים</Label><Input value={editingEquipment?.link_kids || ''} onChange={(e) => setEditingEquipment({...editingEquipment, link_kids: e.target.value})} /></div>
                  </div>
                   <div><Label>קוד קופון</Label><Input value={editingEquipment?.coupon_code || ''} onChange={(e) => setEditingEquipment({...editingEquipment, coupon_code: e.target.value})} /></div>
                   <div>
                      <Label>תמונת פריט</Label>
                      <div className="flex items-center gap-2">
                        <Input value={editingEquipment?.image_url || ''} onChange={e => setEditingEquipment({...editingEquipment, image_url: e.target.value})} />
                        <Input id="equipment-image-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setEditingEquipment({...editingEquipment, image_url: url}))} />
                        <Label htmlFor="equipment-image-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4"/></span></Button></Label>
                      </div>
                      {editingEquipment?.image_url && <img src={editingEquipment.image_url} alt="תצוגה מקדימה" className="mt-2 h-24 w-auto rounded-lg object-contain"/>}
                  </div>
                  <div className="flex items-center space-x-2">
                     <Checkbox id="equipment_rental_available" checked={editingEquipment?.rental_available || false} onCheckedChange={checked => setEditingEquipment({...editingEquipment, rental_available: checked})} />
                     <label htmlFor="equipment_rental_available" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">זמין להשכרה באתר</label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingEquipment(null)}>ביטול</Button>
                    <Button onClick={() => handleSaveEquipment(editingEquipment, !editingEquipment?.id)}>{editingEquipment?.id ? "עדכן ציוד" : "הוסף ציוד"}</Button>
                  </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl mt-8">
              <CardHeader><CardTitle>ציוד קיים ({equipment.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.filter(item => item && item.id && item.name).map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-800">{item.name}</h4>
                          <p className="text-sm text-slate-600">{item.category || ''}</p>
                        </div>
                         <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingEquipment(item)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => confirmDelete('Equipment', item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ski-schools">
            <Card className="border-0 shadow-xl">
              <CardHeader><CardTitle>{editingSchool?.id ? "עריכת בית ספר לסקי קיים" : "הוספת בית ספר לסקי חדש"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SkiSchoolForm
                  initialData={editingSchool}
                  onSubmit={(data) => handleSaveSchool(data, !editingSchool?.id)}
                  onCancel={() => setEditingSchool(null)}
                  destinations={destinations}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl mt-8">
              <CardHeader><CardTitle>בתי ספר לסקי קיימים ({skiSchools.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skiSchools.filter(school => school && school.id && school.school_name).map((school) => (
                    <div key={school.id} className="p-4 border rounded-lg bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-800">{school.school_name}</h4>
                          <p className="text-sm text-slate-600">{school.destination_name || ''}</p>
                          {school.instructor_name && <p className="text-xs text-slate-500">מדריך: {school.instructor_name}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingSchool(school)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => confirmDelete('SkiSchool', school.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trip-preparation">
            <TripPreparationTab 
              onFileUpload={handleFileUpload} 
              loadGlobalData={loadGlobalData} 
              confirmDelete={confirmDelete} 
            />
          </TabsContent>

          <TabsContent value="deals">
            <div className="space-y-8">
              <Card className="border-0 shadow-xl">
                <CardHeader><CardTitle>{editingCategory?.id ? "עריכת קטגוריית מוצרים קיימת" : "ניהול קטגוריות מוצרים"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 border p-4 rounded-lg">
                    <div>
                      <Label>שם קטגוריה חדשה</Label>
                      <Input value={editingCategory?.name || ''} onChange={(e) => setEditingCategory({ ...(editingCategory || {}), name: e.target.value })} />
                    </div>
                    <div>
                      <Label>סדר תצוגה</Label>
                      <Input type="number" value={editingCategory?.order || 0} onChange={(e) => setEditingCategory({ ...(editingCategory || {}), order: e.target.value })} />
                    </div>
                    <div className="self-end">
                      <Button onClick={() => handleSaveCategory(editingCategory, !editingCategory?.id)}>{editingCategory?.id ? "עדכן קטגוריה" : "הוסף קטגוריה"}</Button>
                      {editingCategory?.id && <Button variant="outline" className="mr-2" onClick={() => setEditingCategory(null)}>ביטול</Button>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">קטגוריות קיימות</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productCategories.filter(cat => cat).map((cat) => (
                        <div key={cat.id} className="p-3 border rounded-lg bg-slate-50">
                          <div className="flex justify-between items-center">
                            <span>{cat?.name || 'ללא שם'} (סדר: {cat?.order || 0})</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setEditingCategory(cat)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => confirmDelete('ProductCategory', cat.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl mt-8">
                <CardHeader><CardTitle>{editingProduct?.id ? "עריכת מוצר קיים" : "הוספת מוצר חדש"}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>פרטי מוצר</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><Label>שם המוצר <span className="text-red-500">*</span></Label><Input value={editingProduct?.name || ''} onChange={(e) => setEditingProduct({ ...(editingProduct || {}), name: e.target.value })} /></div>
                        <div>
                          <Label>קטגוריה <span className="text-red-500">*</span></Label>
                          <Select value={editingProduct?.category_id || ''} onValueChange={(val) => setEditingProduct({ ...(editingProduct || {}), category_id: val })}>
                            <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first"><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                            <SelectContent>
                              {productCategories.filter(cat => cat).map(cat => <SelectItem key={cat.id} value={cat.id} className="text-right">{cat?.name || 'ללא שם'}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label>מחיר ($) <span className="text-red-500">*</span></Label><Input type="number" step="0.01" min="0" value={editingProduct?.price || ''} onChange={(e) => setEditingProduct({ ...(editingProduct || {}), price: e.target.value })} placeholder="0.00" /></div>
                      <div><Label>קישור לרכישה <span className="text-red-500">*</span></Label><Input value={editingProduct?.link || ''} onChange={(e) => setEditingProduct({ ...(editingProduct || {}), link: e.target.value })} /></div>
                      <div>
                        <Label>תמונת מוצר (URL)</Label>
                        <div className="flex items-center gap-2">
                          <Input value={editingProduct?.image_url || ''} onChange={e => setEditingProduct({ ...(editingProduct || {}), image_url: e.target.value })} />
                          <Input id="product-image-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setEditingProduct({ ...(editingProduct || {}), image_url: url}))} />
                          <Label htmlFor="product-image-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4" /></span></Button></Label>
                        </div>
                        {editingProduct?.image_url && <img src={editingProduct.image_url} alt="תצוגה מקדימה" className="mt-2 h-24 w-auto rounded-lg object-contain" />}
                      </div>
                      <div><Label>תיאור</Label><Textarea value={editingProduct?.description || ''} onChange={(e) => setEditingProduct({ ...(editingProduct || {}), description: e.target.value })} /></div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><Label>קוד קופון</Label><Input value={editingProduct?.coupon_code || ''} onChange={(e) => setEditingProduct({ ...(editingProduct || {}), coupon_code: e.target.value })} /></div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2"><Checkbox checked={editingProduct?.is_cheapest || false} onCheckedChange={(checked) => setEditingProduct({ ...(editingProduct || {}), is_cheapest: checked })} /><Label>הכי זול שיש</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox checked={editingProduct?.is_best_seller || false} onCheckedChange={(checked) => setEditingProduct({ ...(editingProduct || {}), is_best_seller: checked })} /><Label>רב מכר</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox checked={editingProduct?.editors_pick || false} onCheckedChange={(checked) => setEditingProduct({ ...(editingProduct || {}), editors_pick: checked })} /><Label>בחירת העורכים</Label></div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingProduct(null)}>ביטול</Button>
                        <Button onClick={() => handleSaveProduct(editingProduct, !editingProduct?.id)}>{editingProduct?.id ? "עדכן מוצר" : "הוסף מוצר"}</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>מוצרים קיימים ({skiProducts.length})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {skiProducts.filter(prod => prod).map((prod) => {
                            const category = productCategories.find(cat => cat && cat.id === prod?.category_id);
                            return (
                              <div key={prod.id} className="p-4 border rounded-lg bg-slate-50">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold text-slate-800">{prod?.name || 'ללא שם'}</h4>
                                    <p className="text-sm text-slate-600">קטגוריה: {category?.name || 'לא ידוע'}</p>
                                    <p className="text-sm text-slate-600">מחיר: ${prod?.price || 0}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingProduct(prod)}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => confirmDelete('SkiProduct', prod.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                                {prod?.image_url && <img src={prod.image_url} alt={prod.name} className="mt-2 h-24 w-auto rounded-lg object-contain" />}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {prod?.is_cheapest && <Badge variant="outline" className="bg-green-100 text-green-800">הכי זול</Badge>}
                                    {prod?.is_best_seller && <Badge variant="outline" className="bg-blue-100 text-blue-800">רב מכר</Badge>}
                                    {prod?.editors_pick && <Badge variant="outline" className="bg-purple-100 text-purple-800">בחירת העורכים</Badge>}
                                  </div>
                              </div>
                            );
                          })}
                        </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="links">
            <Card className="border-0 shadow-xl">
              <CardHeader><CardTitle>{editingLink?.id ? "עריכת קישור מומלץ קיים" : "הוספת קישור מומלץ חדש"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>כותרת <span className="text-red-500">*</span></Label>
                    <Input value={editingLink?.title || ''} onChange={(e) => setEditingLink({ ...(editingLink || {}), title: e.target.value })} />
                  </div>
                  <div>
                    <Label>כתובת (URL) <span className="text-red-500">*</span></Label>
                    <Input value={editingLink?.link_url || ''} onChange={(e) => setEditingLink({ ...(editingLink || {}), link_url: e.target.value })} />
                  </div>
                </div>
                <div><Label>תיאור</Label><Textarea value={editingLink?.description || ''} onChange={(e) => setEditingLink({ ...(editingLink || {}), description: e.target.value })} /></div>
                <div>
                  <Label>תמונת רקע</Label>
                  <div className="flex items-center gap-2">
                    <Input value={editingLink?.image_url || ''} onChange={e => setEditingLink({ ...(editingLink || {}), image_url: e.target.value })} />
                    <Input id="link-image-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setEditingLink({ ...(editingLink || {}), image_url: url}))} />
                    <Label htmlFor="link-image-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4" /></span></Button></Label>
                  </div>
                  {editingLink?.image_url && <img src={editingLink.image_url} alt="תצוגה מקדימה" className="mt-2 h-24 w-auto rounded-lg object-cover" />}
                </div>
                <div className="flex items-center space-x-2">
                   <Checkbox id="link_visible" checked={editingLink?.is_visible !== false} onCheckedChange={checked => setEditingLink({...(editingLink || {}), is_visible: checked})} />
                   <label htmlFor="link_visible" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">גלוי לציבור</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingLink(null)}>ביטול</Button>
                  <Button onClick={() => handleSaveLink(editingLink, !editingLink?.id)}>{editingLink?.id ? "עדכן קישור" : "הוסף קישור"}</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl mt-8">
              <CardHeader><CardTitle>קישורים קיימים ({recommendedLinks.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedLinks.filter(l => l && l.id && l.title).map((link) => (
                    <div key={link.id} className="p-4 border rounded-lg bg-slate-50">
                      {/* שורה גמישה: תוכן משמאל-ימין, פעולות לא מתכווצות */}
                      <div className="flex items-start gap-3 mb-2">
                        {/* תוכן - תתן לרוחב להיחתך ולהישבר נכון */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 break-words">{link.title}</h4>

                          {/* URL - מציג LTR, שוברים שורה ארוכה, מגבילים גובה כדי לא “להציף” את הכרטיס */}
                          <p className="text-sm text-slate-600 mt-1 overflow-hidden max-h-12 break-all">
                            <span dir="ltr" className="block">
                              {link.link_url}
                            </span>
                          </p>

                          <p className="text-xs text-slate-500 mt-2">
                            <Badge
                              variant={link.is_visible ? "secondary" : "outline"}
                              className={link.is_visible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {link.is_visible ? "גלוי" : "מוסתר"}
                            </Badge>
                          </p>
                        </div>

                        {/* פעולות - לא מאפשרים כיווץ, נשאר תמיד בתוך הפריים */}
                        <div className="flex flex-shrink-0 items-center gap-1 self-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={() => setEditingLink(link)}
                            aria-label="עריכה"
                            title="עריכה"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-red-500 hover:text-red-700"
                            onClick={() => confirmDelete('RecommendedLink', link.id)}
                            aria-label="מחיקה"
                            title="מחיקה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance-tab">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{editingInsurance?.id ? "עריכת ספק ביטוח קיים" : "ניהול ספקי ביטוח"}</CardTitle>
                  <Button onClick={() => setEditingInsurance({})}>
                    <PlusCircle className="ml-2 h-4 w-4" /> הוסף ספק ביטוח חדש
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">לוגo</TableHead>
                      <TableHead className="text-right">שם</TableHead>
                      <TableHead className="text-right">מוצג באתר</TableHead>
                      <TableHead className="text-right">סדר הצגה</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insuranceProviders.filter(provider => provider && provider.id && provider.name).map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          {provider.logo_url && (
                            <img 
                              src={provider.logo_url} 
                              alt={provider.name}
                              className="h-10 w-10 object-contain rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{provider.name}</TableCell>
                        <TableCell>
                          <Badge variant={provider.is_active ? "default" : "secondary"}>
                            {provider.is_active ? "כן" : "לא"}
                          </Badge>
                        </TableCell>
                        <TableCell>{provider.sort_order || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingInsurance(provider)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDelete('InsuranceProvider', provider.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>

              <Dialog open={!!editingInsurance} onOpenChange={() => setEditingInsurance(null)}>
                <DialogContent
                  className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                  dir="rtl">
                  <DialogHeader className="pb-4 border-b">
                    <DialogTitle>
                      {editingInsurance?.id ? "עריכת ספק ביטוח" : "הוספת ספק ביטוח חדש"}
                    </DialogTitle>
                  </DialogHeader>

                  {/* תוכן גולל */}
                  <div className="overflow-y-auto flex-1 px-1 py-4">
                    <InsuranceForm
                      initialData={editingInsurance}
                      onSubmit={(data) => handleSaveInsurance(data, !editingInsurance?.id)}
                      onCancel={() => setEditingInsurance(null)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>

          <TabsContent value="accommodation">
            <div className="space-y-8">
              <Card className="border-0 shadow-xl"><CardHeader><CardTitle>{editingAccommodation?.id ? "עריכת ספק לינה קיים" : "הוספת ספק לינה חדש"}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid md:grid-cols-2 gap-4"><div><Label>שם הספק <span className="text-red-500">*</span></Label><Input value={editingAccommodation?.name || ''} onChange={(e) => setEditingAccommodation({...(editingAccommodation || {}), name: e.target.value})} /></div><div><Label>קישור לאתר <span className="text-red-500">*</span></Label><Input value={editingAccommodation?.url || ''} onChange={(e) => setEditingAccommodation({...(editingAccommodation || {}), url: e.target.value})} placeholder="https://example.com" /></div></div><div><Label>תיאור</Label><Textarea value={editingAccommodation?.description || ''} onChange={(e) => setEditingAccommodation({...(editingAccommodation || {}), description: e.target.value})} /></div><div><Label>תמונה/לוגו</Label><div className="flex items-center gap-2"><Input value={editingAccommodation?.image_url || ''} onChange={e => setEditingAccommodation({...(editingAccommodation || {}), image_url: e.target.value})} /><Input id="accommodation-image-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setEditingAccommodation({...(editingAccommodation || {}), image_url: url}))} /><Label htmlFor="accommodation-image-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4"/></span></Button></Label></div>{editingAccommodation?.image_url && <img src={editingAccommodation.image_url} alt="תצוגה מקדימה" className="mt-2 h-24 w-auto rounded-lg object-cover"/>}</div><div><Label>סדר הצגה</Label><Input type="number" value={editingAccommodation?.order || 0} onChange={(e) => setEditingAccommodation({...editingAccommodation, order: e.target.value})} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingAccommodation(null)}>ביטול</Button><Button onClick={() => handleSaveAccommodation(editingAccommodation, !editingAccommodation?.id)}>{editingAccommodation?.id ? "עדכן" : "הוסף"}</Button></div></CardContent></Card>
              <Card className="border-0 shadow-xl"><CardHeader><CardTitle>ספקי לינה קיימים ({accommodationProviders.length})</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{accommodationProviders.filter(p => p && p.id && p.name).map((provider) => (<div key={provider.id} className="p-4 border rounded-lg bg-slate-50"><div className="flex justify-between items-start mb-2"><div><h4 className="font-semibold text-slate-800">{provider.name}</h4>{provider.description && <p className="text-sm text-slate-600">{provider.description}</p>}</div><div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => setEditingAccommodation(provider)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => confirmDelete('AccommodationProvider', provider.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button></div></div>{provider.image_url && <img src={provider.image_url} alt={provider.name} className="mt-2 h-20 w-auto rounded-lg object-cover"/>}</div>))}</div></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="car-rental">
            <div className="space-y-8">
              <Card className="border-0 shadow-xl"><CardHeader><CardTitle>{editingCarRental?.id ? "עריכת ספק השכרת רכב קיים" : "הוספת ספק השכרת רכב חדש"}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid md:grid-cols-2 gap-4"><div><Label>שם הספק <span className="text-red-500">*</span></Label><Input value={editingCarRental?.name || ''} onChange={(e) => setEditingCarRental({...(editingCarRental || {}), name: e.target.value})} /></div><div><Label>קישור לאתר <span className="text-red-500">*</span></Label><Input value={editingCarRental?.url || ''} onChange={(e) => setEditingCarRental({...(editingCarRental || {}), url: e.target.value})} placeholder="https://example.com" /></div></div><div><Label>תיאור</Label><Textarea value={editingCarRental?.description || ''} onChange={(e) => setEditingCarRental({...(editingCarRental || {}), description: e.target.value})} /></div><div><Label>לוגו</Label><div className="flex items-center gap-2"><Input value={editingCarRental?.logo_url || ''} onChange={e => setEditingCarRental({...(editingCarRental || {}), logo_url: e.target.value})} /><Input id="car-rental-logo-upload" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setEditingCarRental({...(editingCarRental || {}), logo_url: url}))} /><Label htmlFor="car-rental-logo-upload"><Button type="button" variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="w-4 h-4"/></span></Button></Label></div>{editingCarRental?.logo_url && <img src={editingCarRental.logo_url} alt="לוגו" className="mt-2 h-24 w-auto rounded-lg object-contain"/>}</div><div><Label>סדר הצגה</Label><Input type="number" value={editingCarRental?.order || 0} onChange={(e) => setEditingCarRental({...editingCarRental, order: e.target.value})} /></div><div className="flex items-center space-x-2 space-x-reverse"><Checkbox id="car_rental_is_active" checked={editingCarRental?.is_active !== false} onCheckedChange={checked => setEditingCarRental({...(editingCarRental || {}), is_active: checked})} /><Label htmlFor="car_rental_is_active" className="cursor-pointer">האם להציג באתר?</Label></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditingCarRental(null)}>ביטול</Button><Button onClick={() => handleSaveCarRental(editingCarRental, !editingCarRental?.id)}>{editingCarRental?.id ? "עדכן" : "הוסף"}</Button></div></CardContent></Card>
              <Card className="border-0 shadow-xl"><CardHeader><CardTitle>ספקי השכרת רכב קיימים ({carRentalProviders.length})</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{carRentalProviders.filter(p => p && p.id && p.name).map((provider) => (<div key={provider.id} className="p-4 border rounded-lg bg-slate-50"><div className="flex justify-between items-start mb-2"><div><h4 className="font-semibold text-slate-800 break-words">{provider.name}</h4>{provider.description && <p className="text-sm text-slate-600 mt-1">{provider.description}</p>}<Badge variant={provider.is_active !== false ? "secondary" : "outline"} className={provider.is_active !== false ? "bg-green-100 text-green-800 mt-1" : "bg-red-100 text-red-800 mt-1"}>{provider.is_active !== false ? "פעיל" : "לא פעיל"}</Badge></div><div className="flex items-center gap-1 flex-shrink-0"><Button variant="ghost" size="sm" onClick={() => setEditingCarRental(provider)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" onClick={() => confirmDelete('CarRentalProvider', provider.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></div></div>{provider.logo_url && <img src={provider.logo_url} alt={provider.name} className="mt-2 h-20 w-auto rounded-lg object-contain"/>}</div>))}</div></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsInlineTab reviews={reviews} destinations={destinations} handleReviewStatusChange={handleReviewStatusChange} confirmDelete={confirmDelete} />
          </TabsContent>

          <TabsContent value="testimonials">
            <TestimonialsManager />
          </TabsContent>

          <TabsContent value="feedback">
            <AdminFeedbackTabContent feedbackList={feedbackList} handleMarkFeedbackAsRead={handleMarkFeedbackAsRead} />
          </TabsContent>

          <TabsContent value="click-tracking">
            <ClickTrackingInlineTab />
          </TabsContent>

          <TabsContent value="legal">
            <LegalDocumentsTab />
          </TabsContent>

          <TabsContent value="vip-form">
            <VipFormBuilder />
          </TabsContent>

          <TabsContent value="articles">
            <ArticlesManager onFileUpload={handleFileUpload} />
          </TabsContent>

          <TabsContent value="faq">
            <FaqManager />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManagement onFileUpload={handleFileUpload} />
          </TabsContent>
        </Tabs>

        {/* AI Search Dialog */}
        <Dialog open={isAiSearchOpen} onOpenChange={setIsAiSearchOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                חיפוש יעד סקי בעזרת AI
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="ai-search-query">שם אתר הסקי באנגלית</Label>
                <Input
                  id="ai-search-query"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder="e.g., Zermatt, Val d'Isère, Courchevel"
                  dir="ltr"
                  className="text-left"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !aiSearchLoading) {
                      handleAiSearch();
                    }
                  }}
                />
                <p className="text-xs text-slate-500 mt-2">
                  המערכת תחפש באינטרנט את כל הנתונים הרלוונטיים ותמלא אוטומטית את הטופס
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAiSearchOpen(false)} disabled={aiSearchLoading}>
                ביטול
              </Button>
              <Button onClick={handleAiSearch} disabled={aiSearchLoading}>
                {aiSearchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מחפש...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    חפש ומלא טופס
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, type: null, id: null })}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו לא ניתנת לביטול. הפריט יימחק לצמיתות.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Kosher Place Dialog */}
        <Dialog open={!!editingKosherPlace} onOpenChange={(open) => !open && setEditingKosherPlace(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" dir="rtl">
            <DialogHeader className="pb-4 border-b"><DialogTitle>{editingKosherPlace?.id ? 'עריכת מקום כשר' : 'הוספת מקום כשר חדש'}</DialogTitle></DialogHeader>
            <div className="space-y-4 overflow-y-auto flex-1 py-4 px-1">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>שם המקום <span className="text-red-500">*</span></Label><Input value={editingKosherPlace?.name || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, name: e.target.value})} /></div>
                <div><Label>סוג המקום</Label><div className="flex flex-wrap gap-2 mt-2">{['מסעדה','קייטרינג','משלוחים','מלון עם אוכל כשר','חבד','אחר'].map(t => { const sel = Array.isArray(editingKosherPlace?.type) ? editingKosherPlace.type : []; const isSel = sel.includes(t); return <Badge key={t} variant={isSel?"default":"outline"} className="cursor-pointer" onClick={() => setEditingKosherPlace({...editingKosherPlace, type: isSel?sel.filter(x=>x!==t):[...sel,t]})}>{t}</Badge>; })}</div></div>
              </div>
              <div><Label>כתובת / תיאור מיקום</Label><Input value={editingKosherPlace?.address || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, address: e.target.value})} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>קישור Google Maps</Label><Input value={editingKosherPlace?.google_maps_link || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, google_maps_link: e.target.value})} placeholder="https://maps.google.com/..." /></div>
                <div><Label>קישור לאתר / הזמנה</Label><Input value={editingKosherPlace?.website_url || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, website_url: e.target.value})} /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>טלפון</Label><Input value={editingKosherPlace?.phone || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, phone: e.target.value})} /></div>
                <div><Label>מספר וואטסאפ</Label><Input value={editingKosherPlace?.whatsapp_number || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, whatsapp_number: e.target.value})} placeholder="972501234567" /></div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                <h4 className="font-semibold text-blue-900">מידע שבת</h4>
                <div><Label>פתוח/פעיל בשבת?</Label><Select value={editingKosherPlace?.open_on_shabbat || 'לא ידוע'} onValueChange={val => setEditingKosherPlace({...editingKosherPlace, open_on_shabbat: val})}><SelectTrigger dir="rtl" className="text-right bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="כן" className="text-right">כן</SelectItem><SelectItem value="לא" className="text-right">לא</SelectItem><SelectItem value="לא ידוע" className="text-right">לא ידוע</SelectItem></SelectContent></Select></div>
                <div><Label>אפשרויות שבת</Label><div className="flex flex-wrap gap-2 mt-2">{['אוכל מוכן','פלטה','הזמנה מראש','ארוחות שבת','סעודה שלישית'].map(o => { const sel = Array.isArray(editingKosherPlace?.shabbat_options)?editingKosherPlace.shabbat_options:[]; const isSel=sel.includes(o); return <Badge key={o} variant={isSel?"default":"outline"} className="cursor-pointer" onClick={() => setEditingKosherPlace({...editingKosherPlace, shabbat_options: isSel?sel.filter(x=>x!==o):[...sel,o]})}>{o}</Badge>; })}</div></div>
                <div><Label>הערות שבת</Label><Textarea value={editingKosherPlace?.shabbat_notes || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, shabbat_notes: e.target.value})} rows={2} /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>סוג הכשר / השגחה</Label><Input value={editingKosherPlace?.kashrut_supervision || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, kashrut_supervision: e.target.value})} /></div>
                <div><Label>סדר הצגה</Label><Input type="number" value={editingKosherPlace?.sort_order || 0} onChange={e => setEditingKosherPlace({...editingKosherPlace, sort_order: e.target.value})} /></div>
              </div>
              <div><Label>הערות נוספות</Label><Textarea value={editingKosherPlace?.notes || ''} onChange={e => setEditingKosherPlace({...editingKosherPlace, notes: e.target.value})} rows={2} /></div>
              <div className="flex items-center space-x-2 space-x-reverse"><Checkbox id="kosher_is_visible" checked={editingKosherPlace?.is_visible !== false} onCheckedChange={checked => setEditingKosherPlace({...editingKosherPlace, is_visible: checked})} /><Label htmlFor="kosher_is_visible" className="cursor-pointer">מוצג באתר</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setEditingKosherPlace(null)}>ביטול</Button><Button onClick={() => handleSaveKosherPlace(editingKosherPlace, !editingKosherPlace?.id)}>{editingKosherPlace?.id ? 'עדכן' : 'הוסף'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}