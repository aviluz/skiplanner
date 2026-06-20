const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Car,
  Bus,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Plane,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import TripPlanningProgress from "@/components/TripPlanningProgress";
import GuestModeBanner from "@/components/GuestModeBanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
const DRAFT_STEP_KEY = 'trip_current_step';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function TransportChoice() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    loadTrip();
  }, []);

  const loadTrip = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    const guestMode = urlParams.get('guest') === '1';

    // מצב אורח - טעינה מ-localStorage
    if (guestMode || !tripId) {
      setIsGuestMode(true);
      // שמירת השלב הנוכחי
      localStorage.setItem(DRAFT_STEP_KEY, '1');
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setTrip({
            id: null,
            trip_name: parsedDraft.trip_name,
            destination_id: parsedDraft.destination_id,
            destination_name: parsedDraft.destination_name,
            departure_date: parsedDraft.departure_date,
            return_date: parsedDraft.return_date,
            departure_month: parsedDraft.departure_month,
            return_month: parsedDraft.return_month,
            departure_airport: parsedDraft.departure_airport,
            arrival_airport: parsedDraft.arrival_airport,
            participants: parsedDraft.participants || 2,
            flexible_dates: parsedDraft.flexible_dates,
            steps_completed: parsedDraft.steps_completed || {}
          });
        } catch (e) {
          console.error("Error parsing guest draft:", e);
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

    // מצב רגיל - טעינה מהשרת
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

  const handleTransportChoice = async (transportType) => {
    if (!trip) return;

    // מצב אורח
    if (isGuestMode) {
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        draftData.transport_type = transportType;
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_TRANSPORT_KEY, JSON.stringify({ type: transportType, selectedAt: new Date().toISOString() }));

      if (transportType === 'car') {
        navigate(createPageUrl(`CarStep?guest=1`));
      } else {
        navigate(createPageUrl(`TransferStep?guest=1`));
      }
      return;
    }

    // מצב רגיל
    try {
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        transport_type: transportType
      });

      if (transportType === 'car') {
        navigate(createPageUrl(`CarStep?tripId=${trip.id}`));
      } else {
        navigate(createPageUrl(`TransferStep?tripId=${trip.id}`));
      }
    } catch (error) {
      console.error("Error updating transport choice:", error);
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
            <h2 className="text-xl font-bold text-slate-800 mb-2">טוען נתונים...</h2>
            <Link to={createPageUrl("MyTrips")}>
              <Button>חזור לטיולים שלי</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" 
      dir="rtl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-2 mb-4">
            <Car className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800 font-medium">שלב 2 - בחירת אופן ההגעה</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">בחר את אופן ההגעה ליעד</h1>
          <p className="text-xl text-slate-600">
            מה הדרך הנוחה ביותר עבורכם להגיע מהשדה אל אתר הסקי?
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div variants={itemVariants}>
          <TripPlanningProgress 
            mode="progress" 
            currentStepKey="transport" 
            stepsCompleted={trip.steps_completed || {}}
            tripId={trip.id}
            isGuest={isGuestMode}
          />
        </motion.div>

        {/* Guest Mode Warning */}
        {isGuestMode && (
          <motion.div variants={itemVariants}>
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">מצב אורח - המידע נשמר באופן זמני</AlertTitle>
              <AlertDescription className="text-amber-700">
                <p className="mb-2">התכנון שלך נשמר רק בדפדפן הנוכחי. כדי לשמור אותו לצמיתות:</p>
                <Button 
                  size="sm" 
                  onClick={() => setShowLoginPrompt(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  התחבר ושמור את הטיול
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Trip Summary */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 md:mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">{trip.trip_name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium">{trip.destination_name}</div>
                    <div className="text-slate-500">יעד</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-medium">
                      {trip.departure_date && trip.return_date ? (
                        `${format(new Date(trip.departure_date), 'dd/MM/yy')} - ${format(new Date(trip.return_date), 'dd/MM/yy')}`
                      ) : 'תאריכים גמישים'}
                    </div>
                    <div className="text-slate-500">תאריכים</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-medium">{trip.participants} נוסעים</div>
                    <div className="text-slate-500">מספר נוסעים</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transport Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Car Rental Option */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow h-full">
              <CardHeader className="text-center border-b p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">השכרת רכב</CardTitle>
                <CardDescription className="text-base mt-2">
                  חופש מלא לנסוע לפי הקצב שלכם
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>גמישות מלאה בזמנים ומסלולים</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>אפשרות לטיולים נוספים באזור</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>מתאים למשפחות וקבוצות</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>חיסכון בהוצאות הסעות</span>
                  </li>
                </ul>
                <Button 
                  size="lg" 
                  onClick={() => handleTransportChoice('car')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  אני רוצה לשכור רכב
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transfer Option */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow h-full">
              <CardHeader className="text-center border-b p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Bus className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">הסעה/מונית</CardTitle>
                <CardDescription className="text-base mt-2">
                  נוחות מקסימלית ללא דאגות
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>אין צורך להתמצא בניווט זר</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>נהג מקצועי ומנוסה</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>הסעה ישירות לדלת המלון</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>מתאים למי שלא רוצה לנהוג</span>
                  </li>
                </ul>
                <Button 
                  size="lg" 
                  onClick={() => handleTransportChoice('transfer')}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  אני מעדיף הסעה/מונית
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Navigation */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <Link to={isGuestMode ? createPageUrl(`FlightStep?guest=1`) : createPageUrl(`FlightStep?tripId=${trip.id}`)}>
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 ml-2" />
              חזור לשלב הקודם
            </Button>
          </Link>
        </motion.div>

        {/* Login Prompt Dialog */}
        <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <AlertDialogContent dir="rtl" className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">שמור את הטיול שלך</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-right">
                  <p>כדי לשמור את התכנון לצמיתות ולגשת אליו מכל מכשיר, התחבר או הירשם לחשבון.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel>המשך כאורח</AlertDialogCancel>
              <AlertDialogAction onClick={handleLoginAndSave} className="bg-gradient-to-r from-blue-500 to-indigo-600">
                התחברות ושמירת הטיול
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}