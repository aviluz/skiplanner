const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { transitionGuestToUser } from "@/lib/guestTripMigration";
import { format } from "date-fns";
import {
  Plane,
  ArrowLeft,
  CheckCircle,
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
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
import { toast } from "sonner";

const DRAFT_TRIP_KEY = 'draftTripPlan';
const DRAFT_FLIGHTS_KEY = 'draftTripFlights';
const DRAFT_STEP_KEY = 'trip_current_step';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function FlightStep() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadTrip();
  }, []);

  const loadTrip = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    const guestMode = urlParams.get('guest') === '1';

    // אם המשתמש התחבר בינתיים — נמיר את הטיוטה לטיול אמיתי ונעבור למצב מחובר
    if (guestMode) {
      const migrated = await transitionGuestToUser(navigate, 'FlightStep');
      if (migrated) return;
    }

    // בדיקת משתמש מחובר
    try {
      const userData = await db.auth.me();
      setUser(userData);
    } catch {
      setUser(null);
    }

    // מצב אורח - טעינה מ-localStorage
    if (guestMode || (!tripId && !guestMode)) {
      setIsGuestMode(true);
      // שמירת השלב הנוכחי
      localStorage.setItem(DRAFT_STEP_KEY, '0');
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          // המרה לפורמט דומה ל-trip
          const guestTrip = {
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
            steps_completed: parsedDraft.steps_completed || { flights: false, transport: false, accommodation: false, insurance: false, equipment: false, lessons: false, ski_pass: false }
          };
          setTrip(guestTrip);
        } catch (e) {
          console.error("Error parsing guest draft:", e);
          navigate(createPageUrl("PlanTrip"));
          return;
        }
      } else {
        // אין טיוטה - חזרה לתכנון
        navigate(createPageUrl("PlanTrip"));
        return;
      }
      setLoading(false);
      return;
    }

    // מצב רגיל - טעינה מהשרת
    if (!tripId) {
      navigate(createPageUrl("MyTrips"));
      return;
    }

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

  const markStepCompleted = async () => {
    if (!trip) return;

    // מצב אורח
    if (isGuestMode) {
      // עדכון steps_completed בטיוטה הראשית
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        draftData.steps_completed = { ...draftData.steps_completed, flights: true };
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      
      // שמירת נתוני הטיסות
      const flightData = { completed: true, completedAt: new Date().toISOString() };
      localStorage.setItem(DRAFT_FLIGHTS_KEY, JSON.stringify(flightData));
      
      // מעבר לשלב הבא במצב אורח
      navigate(createPageUrl(`TransportChoice?guest=1`));
      return;
    }

    // מצב רגיל - עדכון בשרת
    try {
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        steps_completed: { ...trip.steps_completed, flights: true }
      });

      navigate(createPageUrl(`TransportChoice?tripId=${trip.id}`));
    } catch (error) {
      console.error("Error updating trip:", error);
    }
  };

  const handleLoginAndSave = async () => {
    setShowLoginPrompt(false);
    
    // שמירת המצב הנוכחי
    const currentDraft = localStorage.getItem(DRAFT_TRIP_KEY);
    if (currentDraft) {
      const parsed = JSON.parse(currentDraft);
      parsed.pendingCreation = true;
      localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(parsed));
    }
    
    db.auth.redirectToLogin(window.location.href);
  };

  // Modified to directly open the URL with more robust logic
  const openFlightSearchUrl = () => {
    if (!trip) return;

    const baseUrl = "https://www.skyscanner.co.il/transport/flights";
    const fromAirport = trip.departure_airport?.match(/\((.*?)\)/)?.[1] || 'TLV'; // Fallback to TLV
    const toAirport = trip.arrival_airport;

    if (!toAirport) {
        alert("לא הוגדר שדה תעופה יעד. אנא חזור לשלב תכנון הטיול ועדכן את השדה.");
        return;
    }

    let dateParams = "";
    if (trip.flexible_dates && trip.departure_month) {
        // Flexible date format: YYYY-MM
        const departureMonthFormatted = trip.departure_month.slice(0, 7); // Ensure it's YYYY-MM
        let returnMonthFormatted = departureMonthFormatted; // Default return month is same as departure

        // If return month is defined and different, use it
        if (trip.return_month && trip.return_month !== trip.departure_month) {
            returnMonthFormatted = trip.return_month.slice(0, 7);
        }
        dateParams = `${departureMonthFormatted}/${returnMonthFormatted}`;

    } else if (trip.departure_date) {
        // Fixed date format: YYMMDD
        dateParams = format(new Date(trip.departure_date), 'yyMMdd');
        if (trip.return_date) {
            dateParams += `/${format(new Date(trip.return_date), 'yyMMdd')}`;
        }
    } else {
         alert("לא הוגדרו תאריכים לטיול. אנא חזור ועדכן.");
        return;
    }

    const adults = trip.participants || 1;
    const finalUrl = `${baseUrl}/${fromAirport.toLowerCase()}/${toAirport.toLowerCase()}/${dateParams}/?adults=${adults}&adultsv2=${adults}&cabinclass=economy&children=0&childrenv2=&infants=0&preferdirects=false&rtn=1`;
    
    window.open(finalUrl, "_blank");
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
            <p className="text-slate-600 mb-4">לא הצלחנו למצוא את הטיול המבוקש</p>
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
      className="min-h-screen bg-slate-100 p-4 md:p-6" 
      dir="rtl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-4">
            <Plane className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">שלב 1 - הזמנת טיסות</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">הזמנת טיסות</h1>
          <p className="text-xl text-slate-600">
            התחילו את החופשה ברגל ימין עם הטיסות הנוחות ביותר עבורכם.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div variants={itemVariants}>
          <TripPlanningProgress 
            mode="progress" 
            currentStepKey="flights" 
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
                <p className="mb-2">התכנון שלך נשמר רק בדפדפן הנוכחי. כדי לשמור אותו לצמיתות ולגשת אליו מכל מכשיר:</p>
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
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
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
                      {trip.flexible_dates ? (
                        <>
                          {monthOptions.find(m => m.value === trip.departure_month)?.label}
                          {trip.return_month && trip.return_month !== trip.departure_month &&
                            ` - ${monthOptions.find(m => m.value === trip.return_month)?.label}`
                          }
                          {trip.flexible_dates && <Badge className="mr-2 bg-green-100 text-green-800">תאריכים גמישים</Badge>}
                        </>
                      ) : (
                        `${format(new Date(trip.departure_date), 'dd/MM/yy')} - ${format(new Date(trip.return_date), 'dd/MM/yy')}`
                      )}
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

        {/* Flight Search */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle className="text-2xl">חיפוש טיסות</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50 rounded-lg gap-4">
                      <div>
                          <div className="text-sm text-slate-500">נתיב טיסה</div>
                          <div className="text-2xl font-bold text-slate-800">
                              {trip.departure_airport?.match(/\((.*?)\)/)?.[1] || 'TLV'} → {trip.arrival_airport}
                          </div>
                      </div>
                      <Button
                        size="lg"
                        onClick={openFlightSearchUrl}
                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      >
                          חפש טיסות ב-Skyscanner
                          <ExternalLink className="w-4 h-4 mr-2" />
                      </Button>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                      <p>אנו ממליצים להשתמש ב-Skyscanner כדי למצוא את הדילים הטובים ביותר. זכרו לבדוק גם את עלויות הטסת ציוד סקי.</p>
                  </div>
              </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <Link to={isGuestMode ? createPageUrl("PlanTrip") : createPageUrl("MyTrips")} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              <ArrowLeft className="w-4 md:w-5 h-4 md:h-5 ml-2" />
              {isGuestMode ? "חזור לתכנון הטיול" : "חזור לטיולים שלי"}
            </Button>
          </Link>

          <Button size="lg" onClick={markStepCompleted} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <CheckCircle className="w-4 md:w-5 h-4 md:h-5 ml-2" />
            השלמתי הזמנת טיסות - עבור לשלב הבא
          </Button>
        </motion.div>

        {/* Login Prompt Dialog */}
        <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <AlertDialogContent dir="rtl" className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">שמור את הטיול שלך</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-right">
                  <p>
                    כדי לשמור את התכנון לצמיתות ולגשת אליו מכל מכשיר, התחבר או הירשם לחשבון.
                  </p>
                  <p className="text-slate-600">
                    כל מה שתכננת עד עכשיו יישמר אוטומטית בחשבון שלך.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel>המשך כאורח</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLoginAndSave}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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

// Add monthOptions array at the top level for use in FlightStep
const monthOptions = [
  { value: "2024-11", label: "נובמבר 2024" },
  { value: "2024-12", label: "דצמבר 2024" },
  { value: "2025-01", label: "ינואר 2025" },
  { value: "2025-02", label: "פברואר 2025" },
  { value: "2025-03", label: "מרץ 2025" },
  { value: "2025-04", label: "אפריל 2025" },
  { value: "2025-05", label: "מאי 2025" }
];