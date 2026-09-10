const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { transitionGuestToUser } from "@/lib/guestTripMigration";
import { Ticket, ArrowLeft, CheckCircle2, Info, AlertCircle, AlertTriangle, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TripPlanningProgress from "@/components/TripPlanningProgress";
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
const DRAFT_SKIPASS_KEY = 'draftTripSkiPass';
const DRAFT_STEP_KEY = 'trip_current_step';

export default function SkiPassNotice() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  useEffect(() => {
    loadTrip();
  }, []);

  const loadTrip = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    const guestMode = urlParams.get('guest') === '1';

    // אם המשתמש התחבר בינתיים — נמיר את הטיוטה לטיול אמיתי ונעבור למצב מחובר
    if (guestMode) {
      const migrated = await transitionGuestToUser(navigate, 'SkiPassNotice');
      if (migrated) return;
    }

    // מצב אורח
    if (guestMode || !tripId) {
      setIsGuestMode(true);
      // שמירת השלב הנוכחי
      localStorage.setItem(DRAFT_STEP_KEY, '6');
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setTrip({
            id: null,
            trip_name: parsedDraft.trip_name,
            destination_name: parsedDraft.destination_name,
            steps_completed: parsedDraft.steps_completed || {}
          });
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
      } else {
        navigate(createPageUrl("MyTrips"));
        return;
      }
    } catch (error) {
      console.error("Error loading trip:", error);
      navigate(createPageUrl("MyTrips"));
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!trip || completing) return;

    setCompleting(true);

    // מצב אורח - הצגת דיאלוג להתחברות
    if (isGuestMode) {
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        draftData.steps_completed = { ...draftData.steps_completed, ski_pass: true };
        draftData.ski_pass_details = { acknowledged: true, acknowledged_date: new Date().toISOString() };
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_SKIPASS_KEY, JSON.stringify({ acknowledged: true }));
      
      // הצגת דיאלוג סיום עם אפשרות להתחברות
      setShowCompletionDialog(true);
      setCompleting(false);
      return;
    }

    // מצב רגיל
    try {
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        ski_pass_details: {
          acknowledged: true,
          acknowledged_date: new Date().toISOString()
        },
        steps_completed: {
          ...trip.steps_completed,
          ski_pass: true
        }
      });

      toast.success("תכנון הטיול הושלם בהצלחה! 🎉");
      setTimeout(() => {
        navigate(createPageUrl(`TripDetails?id=${trip.id}`));
      }, 1000);
    } catch (error) {
      console.error("Error completing ski pass step:", error);
      toast.error("שגיאה בסיום השלב");
      setCompleting(false);
    }
  };

  const handleLoginAndSave = () => {
    setShowLoginPrompt(false);
    setShowCompletionDialog(false);
    const currentDraft = localStorage.getItem(DRAFT_TRIP_KEY);
    if (currentDraft) {
      const parsed = JSON.parse(currentDraft);
      parsed.pendingCreation = true;
      localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(parsed));
    }
    db.auth.redirectToLogin(window.location.href);
  };

  const handleStayAsGuest = () => {
    setShowCompletionDialog(false);
    toast.success("תכנון הטיול הושלם! הנתונים נשמרו בדפדפן שלך.");
    navigate(createPageUrl("PlanTrip"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" 
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 rounded-full px-4 py-2 mb-4">
            <Ticket className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800 font-medium">שלב 7 - כרטיס סקי (Ski Pass)</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">מידע חשוב על כרטיס הסקי</h1>
          <p className="text-xl text-slate-600">רכישת כרטיס סקי באתר הסקי</p>
        </div>

        <TripPlanningProgress 
          mode="progress" 
          currentStepKey="ski_pass" 
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

        {/* Trip Summary */}
        <Card className="mb-6 border-0 shadow-xl bg-white/90">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl">{trip.trip_name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-sm">
              <span className="text-slate-500">יעד: </span>
              <span className="font-medium">{trip.destination_name}</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-6 h-6 text-blue-600" />
              כרטיס סקי (Ski Pass)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>שימו לב:</strong> כרטיס הסקי (Ski Pass) לרוב נרכש באתר הסקי עצמו ולא מראש.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                מהו כרטיס סקי?
              </h3>
              <p className="text-slate-700 leading-relaxed">
                כרטיס הסקי הוא כרטיס מגנטי או אלקטרוני שמאפשר לכם גישה למעליות הסקי באתר.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-600" />
                איפה רוכשים?
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>בקופות באתר הסקי</strong> - הדרך הנפוצה ביותר</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>באתר האינטרנט של אתר הסקי</strong> - לפעמים זול יותר</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>דרך המלון באתר הסקי</strong> - לפעמים מחירים טובים</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                מחירים ואפשרויות
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>המחיר משתנה בהתאם למספר ימי הסקי</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>ילדים וקשישים בדרך כלל זכאים להנחה</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>רכישה מראש באינטרנט עשויה להציע הנחה</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                💡 טיפים חשובים
              </h3>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>✓ שמרו על הכרטיס במקום בטוח</li>
                <li>✓ שמרו את הקבלה של הרכישה</li>
                <li>✓ הציגו תעודה מזהה בעת הרכישה</li>
                <li>✓ בדקו מבצעים באתר האינטרנט של היעד</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link to={isGuestMode ? createPageUrl(`LessonsStep?guest=1`) : createPageUrl(`LessonsStep?tripId=${trip.id}`)}>
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 ml-2" />
              חזור לשלב הקודם
            </Button>
          </Link>

          <Button 
            onClick={handleComplete} 
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            disabled={completing}
          >
            {completing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                שומר...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 ml-2" />
                סיימתי את תכנון הטיול!
              </>
            )}
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

        {/* Completion Dialog for Guest Mode */}
        <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
          <AlertDialogContent dir="rtl" className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl flex items-center gap-2">
                <PartyPopper className="w-6 h-6 text-green-600" />
                סיימת את תכנון הטיול! 🎉
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-right">
                  <p className="text-lg">מעולה! עברת את כל שלבי התכנון.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                    <p className="font-medium mb-2">⚠️ שים לב:</p>
                    <p className="text-sm">
                      כרגע התכנון שלך נשמר רק בדפדפן. אם תתחבר עכשיו, נשמור את כל מה שתכננת בחשבון שלך ותוכל לגשת אליו מכל מכשיר.
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handleStayAsGuest}>
                להישאר כאורח
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLoginAndSave}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                התחברות ושמירת הטיול
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}