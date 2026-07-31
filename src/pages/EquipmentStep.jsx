const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { transitionGuestToUser } from "@/lib/guestTripMigration";
import { format } from "date-fns";
import { toast } from 'sonner';
import { 
  MountainSnow, 
  ArrowLeft, 
  CheckCircle, 
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Info,
  Package,
  Copy,
  AlertTriangle
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
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
const DRAFT_EQUIPMENT_KEY = 'draftTripEquipment';
const DRAFT_STEP_KEY = 'trip_current_step';

export default function EquipmentStep() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [rentalLink, setRentalLink] = useState("#");
  const [couponCode, setCouponCode] = useState('');
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

    // אם המשתמש התחבר בינתיים — נמיר את הטיוטה לטיול אמיתי ונעבור למצב מחובר
    if (guestMode) {
      const migrated = await transitionGuestToUser(navigate, 'EquipmentStep');
      if (migrated) return;
    }

    // טעינת הגדרות
    try {
      const settingsData = await db.entities.SiteSettings.list();
      const rentalSetting = settingsData.find(s => s.setting_name === 'equipment_rental_link');
      const couponSetting = settingsData.find(s => s.setting_name === 'equipment_rental_coupon');
      if (couponSetting?.value) setCouponCode(couponSetting.value);
      if (rentalSetting?.value) setRentalLink(rentalSetting.value);
    } catch (e) {
      console.error("Error loading settings:", e);
    }

    // מצב אורח
    if (guestMode || !tripId) {
      setIsGuestMode(true);
      // שמירת השלב הנוכחי
      localStorage.setItem(DRAFT_STEP_KEY, '4');
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
            participants: parsedDraft.participants || 2,
            flexible_dates: parsedDraft.flexible_dates,
            departure_month: parsedDraft.departure_month,
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
    } finally {
      setLoading(false);
    }
  };

  const markStepCompleted = async () => {
    if (!trip) return;

    if (isGuestMode) {
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        draftData.steps_completed = { ...draftData.steps_completed, equipment: true };
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_EQUIPMENT_KEY, JSON.stringify({ completed: true }));
      navigate(createPageUrl(`LessonsStep?guest=1`));
      return;
    }

    try {
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        steps_completed: { ...trip.steps_completed, equipment: true }
      });
      navigate(createPageUrl(`LessonsStep?tripId=${trip.id}`));
    } catch (error) {
      console.error("Error updating trip:", error);
    }
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(couponCode);
    toast.success('קוד הקופון הועתק בהצלחה!');
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

  const rentalPartners = [
    {
      name: "קניית ציוד סקי",
      logo: "https://cdn.pixabay.com/photo/2015/09/09/17/57/ski-932188_1280.jpg",
      description: "מצאו ציוד וביגוד סקי וסנובורד שאתם צריכים במחירים מעולים.",
      features: ["מגוון רחב של ביגוד וציוד", "מבצעים משתלמים", "מחירים נמוכים ודילים סודיים"],
      link: createPageUrl('SkiDeals'),
      buttonText: "עיין בדילים לציוד"
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">שגיאה: טיול לא נמצא</h2>
          <Link to={createPageUrl("Home")}><Button>חזור לדף הבית</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-100 rounded-full px-4 py-2 mb-4">
            <MountainSnow className="w-5 h-5 text-cyan-600" />
            <span className="text-cyan-800 font-medium">שלב 5 - השכרת ציוד סקי</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">השכרת ציוד סקי</h1>
          <p className="text-lg md:text-xl text-slate-600">במידה ואין לכם ציוד משלכם, זה הזמן לדאוג להשכרה.</p>
        </div>

        <TripPlanningProgress 
          mode="progress" 
          currentStepKey="equipment" 
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
        <Card className="mb-6 md:mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-teal-50">
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
                    {trip.flexible_dates 
                      ? `חודש ${trip.departure_month}` 
                      : trip.departure_date && trip.return_date 
                        ? `${format(new Date(trip.departure_date), 'dd/MM/yy')} - ${format(new Date(trip.return_date), 'dd/MM/yy')}`
                        : 'תאריכים גמישים'}
                  </div>
                  <div className="text-slate-500">תאריכים</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="font-medium">{trip.participants} גולשים</div>
                  <div className="text-slate-500">מספר גולשים</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Link */}
        {rentalLink !== "#" && (
          <Card className="mb-6 md:mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-lg md:text-xl font-bold text-slate-800">השכרת ציוד אונליין</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 justify-center">
                  <Info className="w-5 h-5" />טיפ חשוב
                </h3>
                <p className="text-sm text-blue-700">הזמנה מראש מבטיחה שהציוד המתאים יהיה זמין כשתגיעו.</p>
              </div>
              <Button size="lg" asChild className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-4 text-lg w-full sm:w-auto">
                <a href={rentalLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5 ml-2" />
                  עבור לאתר ההשכרה
                </a>
              </Button>
              
              {couponCode && (
                <div className="mt-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-5 max-w-sm mx-auto shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-right flex-1">
                      <p className="text-xs font-medium text-slate-600 mb-1">קוד קופון מיוחד:</p>
                      <p className="font-bold text-xl text-orange-600">{couponCode}</p>
                    </div>
                    <Button size="sm" onClick={handleCopyCoupon} className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
                      <Copy className="w-4 h-4 ml-1" />העתק
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rental Partners */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">אפשרויות מומלצות</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rentalPartners.map((partner, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/95 backdrop-blur-sm flex flex-col h-full">
                <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
                  <img src={partner.logo} alt={partner.name} className="w-12 h-12 rounded-full object-cover" />
                  <CardTitle className="text-md font-semibold text-slate-800">{partner.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-slate-600 text-sm mb-3">{partner.description}</p>
                    <ul className="list-disc list-inside text-xs text-slate-500 mb-4 pr-4">
                      {partner.features.map((feature, i) => <li key={i}>{feature}</li>)}
                    </ul>
                  </div>
                  <Button size="sm" asChild className="mt-auto bg-gradient-to-r from-teal-500 to-green-600 text-white font-semibold w-full">
                    <Link to={partner.link}>
                      <Package className="w-4 h-4 ml-2" />{partner.buttonText}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link to={isGuestMode ? createPageUrl(`InsuranceStep?guest=1`) : createPageUrl(`InsuranceStep?tripId=${trip.id}`)} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              <ArrowLeft className="w-5 h-5 ml-2" />
              חזור לשלב הקודם
            </Button>
          </Link>
          <Button size="lg" onClick={markStepCompleted} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <CheckCircle className="w-5 h-5 ml-2" />
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