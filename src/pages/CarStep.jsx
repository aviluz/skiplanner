const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { transitionGuestToUser } from "@/lib/guestTripMigration";
import { ArrowLeft, ArrowRight, Car, ExternalLink, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
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
import ActualCostField from "@/components/ActualCostField";
import { useActualCost, buildActualCostPayload, applyActualCostToDraft } from "@/hooks/useActualCost";

const DRAFT_TRIP_KEY = 'draftTripPlan';
const DRAFT_TRANSPORT_KEY = 'draftTripTransport';

export default function CarStep() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [carProviders, setCarProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { actualCost, setActualCost } = useActualCost(trip, "car_rental_details");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    const guestMode = urlParams.get('guest') === '1';

    // אם המשתמש התחבר בינתיים — נמיר את הטיוטה לטיול אמיתי ונעבור למצב מחובר
    if (guestMode) {
      const migrated = await transitionGuestToUser(navigate, 'CarStep');
      if (migrated) return;
    }

    // טעינת ספקים
    let providers = [];
    try {
      providers = await db.entities.CarRentalProvider.list("order");
      const activeProviders = providers.filter(p => p && p.is_active !== false && p.name && p.url);
      setCarProviders(activeProviders);
      if (activeProviders.length > 0) {
        setSelectedProvider(activeProviders[0]);
      }
    } catch (e) {
      console.error("Error loading providers:", e);
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

    // מצב רגיל
    try {
      const tripData = await db.entities.TripPlan.get(tripId);
      if (tripData) {
        setTrip(tripData);
        if (tripData.car_rental_details?.provider_id) {
          const savedProvider = providers.find(p => p.id === tripData.car_rental_details.provider_id);
          if (savedProvider) setSelectedProvider(savedProvider);
        }
      } else {
        navigate(createPageUrl("MyTrips"));
        return;
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const buildProviderUrl = (provider) => {
    if (!provider || !trip) return provider?.url || '#';

    if (provider.name.toLowerCase().includes('rentalcars') || provider.url.includes('rentalcars.com')) {
      try {
        const baseUrl = 'https://www.rentalcars.com/';
        const params = new URLSearchParams();
        if (trip.arrival_airport) params.set('location', trip.arrival_airport);
        if (trip.departure_date) {
          params.set('pickupDate', format(new Date(trip.departure_date), 'yyyy-MM-dd'));
          params.set('pickupTime', '11:00');
        }
        if (trip.return_date) {
          params.set('dropoffDate', format(new Date(trip.return_date), 'yyyy-MM-dd'));
          params.set('dropoffTime', '11:00');
        }
        return `${baseUrl}?${params.toString()}`;
      } catch (error) {
        return provider.url;
      }
    }
    return provider.url;
  };

  const handleComplete = async () => {
    if (!trip) return;

    // מצב אורח
    if (isGuestMode) {
      const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        draftData.steps_completed = { ...draftData.steps_completed, transport: true };
        draftData.car_rental_details = {
          provider_name: selectedProvider?.name,
          completed_date: new Date().toISOString()
        };
        applyActualCostToDraft(draftData, "car_rental_details", actualCost);
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_TRANSPORT_KEY, JSON.stringify({
        type: 'car',
        provider: selectedProvider?.name,
        completed: true
      }));
      toast.success("פרטי השכרת הרכב נשמרו!");
      navigate(createPageUrl(`AccommodationStep?guest=1`));
      return;
    }

    // מצב רגיל
    try {
      const acPayload = await buildActualCostPayload(trip, "car", "car_rental_details", actualCost);
      const carDetails = {
        ...(acPayload.car_rental_details || {}),
        provider_id: selectedProvider?.id,
        provider_name: selectedProvider?.name,
        completed_date: new Date().toISOString()
      };
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        car_rental_details: carDetails,
        ...(acPayload.budget_items ? { budget_items: acPayload.budget_items } : {}),
        steps_completed: { ...trip.steps_completed, transport: true }
      });
      toast.success("פרטי השכרת הרכב נשמרו בהצלחה!");
      navigate(createPageUrl(`AccommodationStep?tripId=${trip.id}`));
    } catch (error) {
      console.error("Error saving car rental details:", error);
      toast.error("שגיאה בשמירת הפרטים");
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

  if (!trip) return null;

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" 
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-4">
            <Car className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">שלב 2 - השכרת רכב</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">השכרת רכב</h1>
          <p className="text-xl text-slate-600">בחר ספק והזמן את הרכב המתאים ביותר</p>
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

        {/* Trip Summary Card */}
        <Card className="mb-6 border-0 shadow-xl bg-white/90">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl">{trip.trip_name}</CardTitle>
            <CardDescription>יעד: {trip.destination_name}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">תאריכי נסיעה:</span>
                <div className="font-medium">
                  {trip.departure_date && trip.return_date
                    ? `${new Date(trip.departure_date).toLocaleDateString('he-IL')} - ${new Date(trip.return_date).toLocaleDateString('he-IL')}`
                    : 'תאריכים גמישים'}
                </div>
              </div>
              <div>
                <span className="text-slate-500">מספר נוסעים:</span>
                <div className="font-medium">{trip.participants}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Car Rental Providers */}
        {carProviders.length > 0 ? (
          <div className="space-y-6">
            {carProviders.length > 1 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>בחר ספק השכרת רכב</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {carProviders.map((provider) => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedProvider?.id === provider.id
                          ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50'
                          : 'border hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {provider.logo_url && (
                              <img src={provider.logo_url} alt={provider.name} className="h-12 w-12 object-contain" />
                            )}
                            <div>
                              <h3 className="font-semibold text-slate-800">{provider.name}</h3>
                              {provider.description && <p className="text-sm text-slate-600">{provider.description}</p>}
                            </div>
                          </div>
                          {selectedProvider?.id === provider.id && (
                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {selectedProvider && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-4">
                    {selectedProvider.logo_url && (
                      <img src={selectedProvider.logo_url} alt={selectedProvider.name} className="h-16 w-16 object-contain" />
                    )}
                    <div>
                      <CardTitle className="text-2xl">{selectedProvider.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Alert className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 mb-6">
                    <Info className="h-5 w-5 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      <h3 className="font-semibold mb-2">💡 טיפים לפני ההזמנה:</h3>
                      <ul className="text-sm space-y-1 pr-4">
                        <li>• השווה מחירים בין סוגי רכב</li>
                        <li>• בדוק מדיניות ביטול וביטוח</li>
                        <li>• וודא רישיון נהיגה בינלאומי</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  <a href={buildProviderUrl(selectedProvider)} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" size="lg">
                      <ExternalLink className="w-5 h-5 ml-2" />
                      חיפוש והזמנת רכב ב-{selectedProvider.name}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Car className="w-20 h-20 mx-auto mb-4 text-slate-300" />
              <h3 className="text-2xl font-semibold text-slate-700 mb-2">אין ספקים זמינים</h3>
              <Button onClick={handleComplete} variant="outline" size="lg">
                דלג לשלב הבא
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actual Cost */}
        <div className="mb-6">
          <ActualCostField
            value={actualCost}
            onChange={setActualCost}
            baseCurrency={trip?.budget_currency || "EUR"}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <Link to={isGuestMode ? createPageUrl(`TransportChoice?guest=1`) : createPageUrl(`TransportChoice?tripId=${trip.id}`)}>
            <Button variant="outline" size="lg">
              <ArrowRight className="w-5 h-5 ml-2" />
              חזור לבחירת תחבורה
            </Button>
          </Link>

          {carProviders.length > 0 && (
            <Button onClick={handleComplete} size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600">
              <CheckCircle2 className="w-5 h-5 ml-2" />
              המשך לשלב הבא
            </Button>
          )}
        </div>

        {/* Login Dialog */}
        <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>שמור את הטיול שלך</AlertDialogTitle>
              <AlertDialogDescription>התחבר כדי לשמור את התכנון לצמיתות.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>המשך כאורח</AlertDialogCancel>
              <AlertDialogAction onClick={handleLoginAndSave}>התחברות</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}