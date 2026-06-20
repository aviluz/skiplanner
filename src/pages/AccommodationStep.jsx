const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
  Bed, 
  ArrowLeft, 
  CheckCircle, 
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Star,
  Home,
  AlertTriangle
} from "lucide-react";
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
const DRAFT_ACCOMMODATION_KEY = 'draftTripAccommodation';
const DRAFT_STEP_KEY = 'trip_current_step';

const AccommodationCard = ({ provider, trip }) => {
  const [affiliateLink, setAffiliateLink] = useState('#');

  useEffect(() => {
    const buildLink = async () => {
      let finalLink = '#';

      if (provider.id === 'booking') {
        const settings = await db.entities.SiteSettings.list();
        const bookingSetting = settings.find(s => s.setting_name === "booking_com_affiliate_link");
        let baseUrl = bookingSetting?.value || 'https://www.booking.com/searchresults.he.html';

        const url = new URL(baseUrl);
        if (trip) {
          url.searchParams.set('ss', trip.destination_name || '');
          if (trip.departure_date && trip.return_date) {
            url.searchParams.set('checkin', format(new Date(trip.departure_date), "yyyy-MM-dd"));
            url.searchParams.set('checkout', format(new Date(trip.return_date), "yyyy-MM-dd"));
          }
          if (trip.participants) {
            url.searchParams.set('group_adults', trip.participants);
            url.searchParams.set('no_rooms', Math.ceil(trip.participants / 2));
          }
        }
        finalLink = url.toString();
      } else if (provider.id === 'airbnb') {
        if (trip) {
          const dest = encodeURIComponent(trip.destination_name || 'ski');
          const params = new URLSearchParams();
          if (trip.departure_date) params.set('checkin', format(new Date(trip.departure_date), "yyyy-MM-dd"));
          if (trip.return_date) params.set('checkout', format(new Date(trip.return_date), "yyyy-MM-dd"));
          if (trip.participants) params.set('adults', trip.participants);
          finalLink = `https://he.airbnb.com/s/${dest}/homes?${params.toString()}`;
        } else {
          finalLink = 'https://he.airbnb.com';
        }
      }
      setAffiliateLink(finalLink);
    };
    buildLink();
  }, [provider, trip]);

  const IconComponent = provider.icon;

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="text-center border-b p-4 sm:p-6">
        <div className={`w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 bg-gradient-to-r ${provider.gradientFrom} ${provider.gradientTo} rounded-2xl flex items-center justify-center`}>
          <IconComponent className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold text-slate-800">{provider.title}</CardTitle>
        <p className="text-slate-600 text-sm sm:text-base">{provider.description}</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 text-center">
        <div className="space-y-3 mb-6">
          <div className={`${provider.badgeBgClass} p-3 rounded-lg`}>
            <p className={`text-sm ${provider.badgeTextColorClass}`}>{provider.badgeText}</p>
          </div>
          <ul className="text-sm text-slate-600 space-y-1">
            {provider.pros.map((pro, i) => <li key={i}>• {pro}</li>)}
          </ul>
        </div>
        <Button size="lg" asChild className={`${provider.buttonBgClass} ${provider.buttonHoverClass} text-white font-semibold w-full`}>
          <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 ml-2" />
            חפש ב-{provider.title}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default function AccommodationStep() {
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

    if (guestMode || !tripId) {
      setIsGuestMode(true);
      // שמירת השלב הנוכחי
      localStorage.setItem(DRAFT_STEP_KEY, '2');
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

    try {
      const tripData = await db.entities.TripPlan.get(tripId);
      if (tripData) {
        setTrip(tripData);
      } else {
        navigate(createPageUrl("MyTrips"));
        return;
      }
    } catch (error) {
      navigate(createPageUrl("MyTrips"));
      return;
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
        draftData.steps_completed = { ...draftData.steps_completed, accommodation: true };
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_ACCOMMODATION_KEY, JSON.stringify({ completed: true }));
      navigate(createPageUrl(`InsuranceStep?guest=1`));
      return;
    }

    try {
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        steps_completed: { ...trip.steps_completed, accommodation: true }
      });
      navigate(createPageUrl(`InsuranceStep?tripId=${trip.id}`));
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">טוען נתונים...</h2>
            <Link to={createPageUrl("MyTrips")}><Button>חזור לטיולים שלי</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bookingProvider = {
    id: 'booking',
    title: 'Booking.com',
    icon: Star,
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    description: 'מלונות ואכסניות',
    badgeText: 'מלונות, אכסניות ודירות ליד מסלולי הסקי',
    badgeBgClass: 'bg-blue-50',
    badgeTextColorClass: 'text-blue-700',
    buttonBgClass: 'bg-gradient-to-r from-blue-500 to-blue-600',
    buttonHoverClass: 'hover:from-blue-600 hover:to-blue-700',
    pros: ["מגוון רחב של מלונות", "ביטול חינם ברוב ההזמנות", "חוות דעת מאומתות"]
  };

  const airbnbProvider = {
    id: 'airbnb',
    title: 'Airbnb',
    icon: Home,
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-red-500',
    description: 'דירות ובתים פרטיים',
    badgeText: 'דירות ובתים עם מטבח וחללים גדולים',
    badgeBgClass: 'bg-pink-50',
    badgeTextColorClass: 'text-pink-700',
    buttonBgClass: 'bg-gradient-to-r from-pink-500 to-red-500',
    buttonHoverClass: 'hover:from-pink-600 hover:to-red-600',
    pros: ["בתים ודירות ייחודיים", "תחושה של בית", "אירוח על ידי מקומיים"]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 rounded-full px-3 sm:px-4 py-2 mb-4">
            <Bed className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
            <span className="text-purple-800 font-medium text-sm sm:text-base">שלב 3 - בחירת לינה</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">בחירת לינה</h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600">בואו נמצא לכם מקום נהדר לישון</p>
        </div>

        <TripPlanningProgress 
          mode="progress" 
          currentStepKey="accommodation" 
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
        <Card className="mb-6 sm:mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">{trip.trip_name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="font-medium">{trip.destination_name}</div>
                  <div className="text-slate-500">יעד הלינה</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <div className="font-medium">
                    {trip.departure_date && trip.return_date
                      ? `${format(new Date(trip.departure_date), 'dd/MM/yy')} - ${format(new Date(trip.return_date), 'dd/MM/yy')}`
                      : 'תאריכים גמישים'}
                  </div>
                  <div className="text-slate-500">תאריכים</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div className="font-medium">{trip.participants} אורחים</div>
                  <div className="text-slate-500">מספר אורחים</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <AccommodationCard provider={bookingProvider} trip={trip} />
          <AccommodationCard provider={airbnbProvider} trip={trip} />
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link to={isGuestMode ? createPageUrl(`CarStep?guest=1`) : createPageUrl(`CarStep?tripId=${trip.id}`)} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:w-5 ml-2" />
              חזור לשלב הקודם
            </Button>
          </Link>
          <Button size="lg" onClick={markStepCompleted} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <CheckCircle className="w-4 sm:w-5 h-4 sm:w-5 ml-2" />
            השלמתי בחירת לינה - עבור לשלב הבא
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