const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { transitionGuestToUser } from "@/lib/guestTripMigration";
import { 
  Shield, 
  ArrowLeft, 
  CheckCircle, 
  ExternalLink,
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
import ActualCostField from "@/components/ActualCostField";
import { useActualCost, buildActualCostPayload, applyActualCostToDraft } from "@/hooks/useActualCost";

const DRAFT_TRIP_KEY = 'draftTripPlan';
const DRAFT_INSURANCE_KEY = 'draftTripInsurance';
const DRAFT_STEP_KEY = 'trip_current_step';

export default function InsuranceStep() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { actualCost, setActualCost } = useActualCost(trip, "insurance_details");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    const guestMode = urlParams.get('guest') === '1';

    // אם המשתמש התחבר בינתיים — נמיר את הטיוטה לטיול אמיתי ונעבור למצב מחובר
    if (guestMode) {
      const migrated = await transitionGuestToUser(navigate, 'InsuranceStep');
      if (migrated) return;
    }

    // טעינת ספקי ביטוח
    try {
      const providersData = await db.entities.InsuranceProvider.filter({ is_active: true }, 'sort_order');
      setInsuranceProviders(providersData);
    } catch (e) {
      console.error("Error loading providers:", e);
    }

    // מצב אורח
    if (guestMode || !tripId) {
      setIsGuestMode(true);
      // שמירת השלב הנוכחי
      localStorage.setItem(DRAFT_STEP_KEY, '3');
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
      }
    } catch (error) {
      navigate(createPageUrl("MyTrips")); 
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
        draftData.steps_completed = { ...draftData.steps_completed, insurance: true };
        applyActualCostToDraft(draftData, "insurance_details", actualCost);
        localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftData));
      }
      localStorage.setItem(DRAFT_INSURANCE_KEY, JSON.stringify({ completed: true }));
      navigate(createPageUrl(`EquipmentStep?guest=1`));
      return;
    }

    try {
      const acPayload = await buildActualCostPayload(trip, "insurance", "insurance_details", actualCost);
      await db.entities.TripPlan.update(trip.id, {
        ...trip,
        ...acPayload,
        steps_completed: { ...trip.steps_completed, insurance: true }
      });
      navigate(createPageUrl(`EquipmentStep?tripId=${trip.id}`));
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
          <div className="inline-flex items-center gap-2 bg-yellow-100 rounded-full px-4 py-2 mb-4">
            <Shield className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">שלב 4 - ביטוח נסיעות</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">ביטוח נסיעות לסקי</h1>
          <p className="text-lg md:text-xl text-slate-600">אל תצאו לחופשת סקי בלי ביטוח מתאים!</p>
        </div>

        <TripPlanningProgress 
          mode="progress" 
          currentStepKey="insurance" 
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

        {/* Insurance partners grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
          {insuranceProviders.map((provider, index) => (
            <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm flex flex-col">
              <CardHeader className="text-center border-b">
                <img src={provider.logo_url} alt={`${provider.name} logo`} className="w-20 h-20 mx-auto rounded-full mb-4 object-cover"/>
                <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">{provider.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 flex-grow">
                <p className="text-sm md:text-base text-slate-600 mb-4">{provider.description}</p>
              </CardContent>
              <div className="p-4 md:p-6 border-t mt-auto">
                <Button asChild size="lg" className="w-full">
                  <a href={provider.action_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 ml-2" />
                    קבל הצעה
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Actual Cost */}
        <div className="mb-6">
          <ActualCostField
            value={actualCost}
            onChange={setActualCost}
            baseCurrency={trip?.budget_currency || "EUR"}
          />
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
          <Link to={isGuestMode ? createPageUrl(`AccommodationStep?guest=1`) : createPageUrl(`AccommodationStep?tripId=${trip.id}`)} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              <ArrowLeft className="w-5 h-5 ml-2" />
              חזור לשלב הקודם
            </Button>
          </Link>
          <Button size="lg" onClick={markStepCompleted} className="bg-yellow-500 hover:bg-yellow-600 w-full sm:w-auto">
            <CheckCircle className="w-5 h-5 ml-2" />
            המשך לשלב הבא
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