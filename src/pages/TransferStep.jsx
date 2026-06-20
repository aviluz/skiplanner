const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Bus,
  ArrowLeft,
  CheckCircle,
  Calendar,
  MapPin,
  Plane,
  ExternalLink,
  Info,
  AlertTriangle
} from "lucide-react";
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
const DRAFT_TRANSPORT_KEY = 'draftTripTransport';

export default function TransferStep() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null); 
  const [transferLink, setTransferLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    const guestMode = urlParams.get('guest') === '1';

    // טעינת הגדרות
    try {
      const settings = await db.entities.SiteSettings.filter({ setting_name: "transfer_service_link" });
      if (settings.length > 0) {
        setTransferLink(settings[0].value || '');
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }

    // מצב אורח
    if (guestMode || !tripId) {
      setIsGuestMode(true);
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setTrip({
            id: null,
            trip_name: parsedDraft.trip_name,
            destination_name: parsedDraft.destination_name,
            departure_date: parsedDraft.departure_date,
            return_date: parsedDraft.return_date,
            arrival_airport: parsedDraft.arrival_airport,
            participants: parsedDraft.participants || 2,
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
      console.error("Error loading data:", error);
      navigate(createPageUrl("MyTrips"));
    } finally {
      setLoading(false);
    }
  };

  const markStepCompleted = async () => {
    if (!trip) return;

    // מצב אורח
    if (isGuestMode) {
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        draftData.steps_completed = { ...draftData.steps_completed, transport: true };
        draftData.transfer_details = { completed_date: new Date().toISOString() };
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_TRANSPORT_KEY, JSON.stringify({ type: 'transfer', completed: true }));
      navigate(createPageUrl(`AccommodationStep?guest=1`));
      return;
    }

    // מצב רגיל
    try {
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        steps_completed: { ...trip.steps_completed, transport: true }
      });
      navigate(createPageUrl(`AccommodationStep?tripId=${trip.id}`));
    } catch (error) {
      console.error("Error updating trip:", error);
    }
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
            <Link to={createPageUrl("MyTrips")}>
              <Button>חזור לטיולים שלי</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 rounded-full px-4 py-2 mb-4">
            <Bus className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800 font-medium">שלב 2 - הזמנת הסעה</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800">הזמנת הסעה/מונית</h1>
          <p className="mt-4 text-xl text-slate-600">
            הזמינו הסעה נוחה מנמל התעופה ישירות אל אתר הסקי
          </p>
        </div>

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

        {/* Trip Details */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 mb-8">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold">פרטי הטיול שלכם</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg">
                <Plane className="w-6 h-6 text-blue-500 mb-2"/>
                <span className="text-sm text-slate-500">נחיתה ב:</span>
                <span className="font-bold text-lg">{trip.arrival_airport}</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg">
                <MapPin className="w-6 h-6 text-green-500 mb-2"/>
                <span className="text-sm text-slate-500">יעד:</span>
                <span className="font-bold text-lg">{trip.destination_name}</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-500 mb-2"/>
                <span className="text-sm text-slate-500">תאריכים:</span>
                <span className="font-bold text-lg">
                  {trip.departure_date && trip.return_date ? (
                    `${format(new Date(trip.departure_date), 'dd/MM/yy')} - ${format(new Date(trip.return_date), 'dd/MM/yy')}`
                  ) : 'תאריכים גמישים'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Alert className="mb-8 bg-amber-50 border-amber-200 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-right">
              <AlertTitle className="font-bold">⚠️ שימו לב: מילוי ידני נדרש!</AlertTitle>
              <AlertDescription className="mt-1 leading-relaxed">
                לאחר המעבר לאתר ההסעות, מלאו ידנית את הפרטים לפי הנתונים למעלה.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Transfer Service */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">שירות הסעות מומלץ</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-right">
                  <h3 className="font-semibold text-blue-800 mb-1">למה להזמין הסעה?</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• נוחות מקסימלית ללא דאגות</li>
                    <li>• נהג מקצועי ומנוסה</li>
                    <li>• הסעה ישירה לדלת המלון</li>
                  </ul>
                </div>
              </div>
            </div>

            {transferLink ? (
              <a href={transferLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  הזמן הסעה עכשיו
                  <ExternalLink className="w-5 h-5 mr-2" />
                </Button>
              </a>
            ) : (
              <div className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                <p>צרו קשר עם שירות הסעות מקומי או המשיכו לשלב הבא.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <Link to={isGuestMode ? createPageUrl(`TransportChoice?guest=1`) : createPageUrl(`TransportChoice?tripId=${trip.id}`)} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              <ArrowLeft className="w-4 md:w-5 h-4 md:h-5 ml-2" />
              חזור לבחירת תחבורה
            </Button>
          </Link>

          <Button size="lg" onClick={markStepCompleted} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <CheckCircle className="w-4 md:w-5 h-4 md:h-5 ml-2" />
            עבור לשלב הבא
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