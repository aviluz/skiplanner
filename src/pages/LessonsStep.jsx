const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle,
  Users,
  Star,
  Clock,
  Award,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import TripPlanningProgress from "@/components/TripPlanningProgress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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

const DRAFT_TRIP_KEY = 'draftTripPlan';
const DRAFT_LESSONS_KEY = 'draftTripLessons';
const DRAFT_STEP_KEY = 'trip_current_step';

export default function LessonsStep() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [skiSchools, setSkiSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [notes, setNotes] = useState("");
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    const guestMode = urlParams.get('guest') === '1';

    // מצב אורח
    if (guestMode || !tripId) {
      setIsGuestMode(true);
      // שמירת השלב הנוכחי
      localStorage.setItem(DRAFT_STEP_KEY, '5');
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      const savedLessons = localStorage.getItem(DRAFT_LESSONS_KEY);
      
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          const guestTrip = {
            id: null,
            trip_name: parsedDraft.trip_name,
            destination_name: parsedDraft.destination_name,
            steps_completed: parsedDraft.steps_completed || {}
          };
          setTrip(guestTrip);

          // טעינת בתי ספר לפי יעד
          if (parsedDraft.destination_name) {
            const schoolsData = await db.entities.SkiSchool.filter({ destination_name: parsedDraft.destination_name });
            const validSchools = (schoolsData || []).filter(s => s && s.id && s.school_name);
            setSkiSchools(validSchools);
          }

          // טעינת נתונים שמורים
          if (savedLessons) {
            const lessonsData = JSON.parse(savedLessons);
            setNotes(lessonsData.notes || '');
          }
        } catch (e) {
          navigate(createPageUrl("PlanTrip"));
          return;
        }
      } else {
        navigate(createPageUrl("PlanTrip"));
        return;
      }
      setLoading(false);
      return;
    }

    // מצב רגיל
    try {
      const tripData = await db.entities.TripPlan.get(tripId);
      if (tripData) {
        setTrip(tripData);
        const schoolsData = await db.entities.SkiSchool.filter({ destination_name: tripData.destination_name });
        const validSchools = (schoolsData || []).filter(s => s && s.id && s.school_name);
        setSkiSchools(validSchools);

        if (tripData.lessons_details) {
          if (tripData.lessons_details.school_selected) {
            const preSelected = validSchools.find(s => s.id === tripData.lessons_details.school_selected);
            if (preSelected) setSelectedSchool(preSelected);
          }
          if (tripData.lessons_details.notes) setNotes(tripData.lessons_details.notes);
        }
      } else {
        navigate(createPageUrl("MyTrips"));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      navigate(createPageUrl("MyTrips"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!trip) return;

    const lessonsDetails = {
      school_selected: selectedSchool?.id || null,
      school_name: selectedSchool?.school_name || null,
      notes: notes,
      completed_date: new Date().toISOString()
    };

    if (isGuestMode) {
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        draftData.steps_completed = { ...draftData.steps_completed, lessons: true };
        draftData.lessons_details = lessonsDetails;
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_LESSONS_KEY, JSON.stringify(lessonsDetails));
      toast.success("פרטי השיעורים נשמרו!");
      navigate(createPageUrl(`SkiPassNotice?guest=1`));
      return;
    }

    try {
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        lessons_details: lessonsDetails,
        steps_completed: { ...trip.steps_completed, lessons: true }
      });
      toast.success("פרטי השיעורים נשמרו בהצלחה!");
      navigate(createPageUrl(`SkiPassNotice?tripId=${trip.id}`));
    } catch (error) {
      console.error("Error saving lessons details:", error);
      toast.error("שגיאה בשמירת הפרטים");
    }
  };

  const generateWhatsAppLink = (school) => {
    if (!school.whatsapp_contact) return "#";
    const defaultMessage = "Hello, I reached you through the SkiPlanner.co.il website.";
    const message = encodeURIComponent(school.whatsapp_message || defaultMessage);
    if (school.whatsapp_contact.includes('wa.me')) {
      return `${school.whatsapp_contact}${school.whatsapp_contact.includes('?') ? '&' : '?'}text=${message}`;
    }
    const phoneNumber = school.whatsapp_contact.replace(/[^0-9]/g, '');
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  const handleLoginAndSave = () => {
    setShowLoginPrompt(false);
    const currentDraft = localStorage.getItem(DRAFT_TRIP_KEY);
    if (currentDraft) {
      const parsed = JSON.parse(currentDraft);
      parsed.pendingCreation = true;
      localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(parsed));
    }
    db.auth.redirectToLogin(window.location.href);
  };

  const lessonTypes = [
    { title: "שיעור פרטי", description: "מדריך אישי רק עבורכם", price: "€60-80/שעה", icon: Users, benefits: ["התקדמות מהירה", "תשומת לב אישית", "גמישות בזמנים"] },
    { title: "שיעור קבוצתי", description: "קבוצה קטנה של 4-6 אנשים", price: "€40-60/שעה", icon: Star, benefits: ["חברותי ומהנה", "מחיר נוח יותר", "למידה חברתית"] },
    { title: "שיעור למתחילים", description: "מיוחד למי שמתחיל מאפס", price: "€35-50/שעה", icon: Award, benefits: ["בסיס חזק", "בטיחות מקסימלית", "ביטחון עצמי"] }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">טיול לא נמצא</h2>
            <Link to={createPageUrl("MyTrips")}><Button>חזור לטיולים שלי</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-2 mb-4">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-800 font-medium">שלב 6 - שיעורי סקי</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">שיעורי סקי</h1>
          <p className="text-lg md:text-xl text-slate-600">למדו או השתפרו עם מדריכים מקצועיים (אופציונלי)</p>
        </div>

        <TripPlanningProgress 
          mode="progress" 
          currentStepKey="lessons" 
          stepsCompleted={trip.steps_completed || {}}
          tripId={trip.id}
          isGuest={isGuestMode}
        />

        {/* Guest Mode Warning */}
        {isGuestMode && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">מצב אורח</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">התכנון נשמר רק בדפדפן שלך.</p>
              <Button size="sm" onClick={() => setShowLoginPrompt(true)} className="bg-amber-600 hover:bg-amber-700">
                התחבר ושמור לצמיתות
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Why Take Lessons */}
        <Card className="mb-6 md:mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center border-b bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-xl font-bold text-slate-800">למה כדאי לקחת שיעורי סקי?</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                  <div><h4 className="font-semibold text-slate-800">טכניקה נכונה</h4><p className="text-sm text-slate-600">למדו את הבסיס הנכון</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                  <div><h4 className="font-semibold text-slate-800">בטיחות מקסימלית</h4><p className="text-sm text-slate-600">הכירו את המסלולים</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                  <div><h4 className="font-semibold text-slate-800">התקדמות מהירה</h4><p className="text-sm text-slate-600">הגיעו לרמה גבוהה</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
                  <div><h4 className="font-semibold text-slate-800">הכרות עם האתר</h4><p className="text-sm text-slate-600">המדריכים מכירים את המסלולים</p></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Types */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {lessonTypes.map((lesson, index) => (
            <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm flex flex-col">
              <CardHeader className="text-center border-b">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <lesson.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-800">{lesson.title}</CardTitle>
                <p className="text-slate-600 text-sm">{lesson.description}</p>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{lesson.price}</Badge>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <ul className="space-y-2">
                  {lesson.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ski Schools */}
        {skiSchools.length > 0 && (
          <Card className="mb-6 md:mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">הזמנת שיעורים ב{trip.destination_name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <p className="text-slate-600 mb-4 text-center">בחר בית ספר לסקי מומלץ:</p>
              <div className="space-y-4">
                {skiSchools.map(school => {
                  const isSelected = selectedSchool && selectedSchool.id === school.id;
                  return (
                    <div key={school.id} className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">{school.school_name} {isSelected && <Badge className="mr-2 bg-blue-500 text-white">נבחר</Badge>}</h4>
                        {school.instructor_name && <p className="text-sm text-slate-600">עם המדריך {school.instructor_name}</p>}
                      </div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {school.booking_url && (
                          <Button asChild variant="outline" size="sm">
                            <a href={school.booking_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 ml-2"/>הזמנה אונליין
                            </a>
                          </Button>
                        )}
                        {school.whatsapp_contact && (
                          <Button asChild size="sm" className="bg-green-500 hover:bg-green-600">
                            <a href={generateWhatsAppLink(school)} target="_blank" rel="noopener noreferrer">
                              <WhatsAppIcon className="w-5 h-5 text-white ml-2" />וואטסאפ
                            </a>
                          </Button>
                        )}
                        <Button variant={isSelected ? "secondary" : "default"} size="sm" onClick={() => setSelectedSchool(isSelected ? null : school)}>
                          {isSelected ? "בטל בחירה" : "בחר בית ספר זה"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">הערות נוספות:</label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="רשמו כאן הערות..." rows={4} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-8">
          <Link to={isGuestMode ? createPageUrl(`EquipmentStep?guest=1`) : createPageUrl(`EquipmentStep?tripId=${trip.id}`)} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              <ArrowLeft className="w-5 h-5 ml-2" />חזור לשלב הקודם
            </Button>
          </Link>
          <Button size="lg" onClick={handleSaveAndContinue} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-8 py-4 text-lg w-full sm:w-auto">
            <CheckCircle className="w-5 h-5 ml-2" />המשך לשלב הבא
          </Button>
        </div>

        {/* Login Dialog */}
        <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>שמור את הטיול</AlertDialogTitle>
              <AlertDialogDescription>התחבר כדי לשמור לצמיתות.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>המשך כאורח</AlertDialogCancel>
              <AlertDialogAction onClick={handleLoginAndSave}>התחברות</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}