const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CalendarIcon,
  Users,
  MapPin,
  CheckCircle,
  Plane,
  Car,
  Shield,
  Ticket,
  Bed,
  MountainSnow,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Clock,
  Route,
  AlertCircle,
  X,
  RefreshCw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner';
import RtlSelect from "@/components/RtlSelect";
import TripPlanningProgress from "@/components/TripPlanningProgress";

// ===== Helpers: normalize & parse numbers =====
const toNumber = (v) => {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const num = v.replace(/[^\d.,-]/g, "").replace(",", ".");
    const f = parseFloat(num);
    return Number.isFinite(f) ? f : null;
  }
  return null;
};

const normalizeKey = (s) => (s || "").trim();

const normalizeIATAMap = (obj) => {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  Object.keys(obj).forEach((k) => {
    const kNorm = normalizeKey(k);
    out[kNorm] = obj[k];
    // Add uppercase and lowercase versions for robust lookup
    out[kNorm.toUpperCase()] = obj[k];
    out[kNorm.toLowerCase()] = obj[k];
  });
  return out;
};

const formatHours = (h) => {
  if (h == null) return "";
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (hours === 0 && minutes === 0) return "פחות מדקה";
  if (hours === 0) return `${minutes} ותדק`;
  if (minutes === 0) return `${hours} שעות`;
  return `${hours} שעות ${minutes} ותדק`;
};

const DRAFT_TRIP_KEY = 'draftTripPlan';
const DRAFT_STEP_KEY = 'trip_current_step';

const planningSteps = [
  { key: "flights", title: "טיסות", icon: Plane, url: "FlightStep" },
  { key: "car", title: "רכב", icon: Car, url: "CarStep" },
  { key: "accommodation", title: "לינה", icon: Bed, url: "AccommodationStep" },
  { key: "insurance", title: "ביטוח", icon: Shield, url: "InsuranceStep" },
  { key: "equipment", title: "ציוד", icon: MountainSnow, url: "EquipmentStep" },
  { key: "lessons", title: "שיעורים", icon: GraduationCap, url: "LessonsStep" },
  { key: "ski_pass", title: "סקי-פס", icon: Ticket, url: "SkiPassNotice" }
];

const generateMonthOptions = (destinations) => {
  if (!destinations || destinations.length === 0) {
    const currentYear = new Date().getFullYear();
    const defaultMinDate = new Date(currentYear, 10, 1);
    const defaultMaxDate = new Date(currentYear + 1, 4, 31);
    let options = [];
    let currentDate = new Date(defaultMinDate.getFullYear(), defaultMinDate.getMonth(), 1);
    while (currentDate <= defaultMaxDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      options.push({
        value: `${year}-${monthStr}`,
        label: `${currentDate.toLocaleString('he-IL', { month: 'long' })} ${year}`
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return options;
  }

  let minDate = new Date(8640000000000000);
  let maxDate = new Date(-8640000000000000);
  let hasValidSeasonDates = false;

  destinations.forEach(dest => {
    if (dest.season_start_date) {
      const startDate = new Date(dest.season_start_date);
      if (startDate < minDate) minDate = startDate;
      hasValidSeasonDates = true;
    }
    if (dest.season_end_date) {
      const endDate = new Date(dest.season_end_date);
      if (endDate > maxDate) maxDate = endDate;
      hasValidSeasonDates = true;
    }
  });

  if (!hasValidSeasonDates) {
    const currentYear = new Date().getFullYear();
    minDate = new Date(currentYear, 10, 1);
    maxDate = new Date(currentYear + 1, 4, 31);
  } else if (minDate > maxDate) {
    const currentYear = new Date().getFullYear();
    minDate = new Date(Math.min(minDate.getTime(), new Date(currentYear, 10, 1).getTime()));
    maxDate = new Date(Math.max(maxDate.getTime(), new Date(currentYear + 1, 4, 31).getTime()));
  }

  const options = [];
  let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  currentDate = new Date(Math.max(currentDate.getTime(), threeMonthsAgo.getTime()));

  while (currentDate <= maxDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    options.push({
      value: `${year}-${monthStr}`,
      label: `${currentDate.toLocaleString('he-IL', { month: 'long' })} ${year}`
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return options;
};

export default function PlanTrip() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [allAirports, setAllAirports] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [tripData, setTripData] = useState({
    trip_name: "",
    departure_date: null,
    return_date: null,
    departure_month: "",
    return_month: "",
    departure_airport: "בן גוריון (TLV)",
    arrival_airport: "",
    participants: 2,
    budget_range: "רגיל",
    skiing_level: "אדום (מתקדם)",
    is_first_trip: false,
    flexible_dates: false,
    has_kosher_food: false
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showGuestWarningDialog, setShowGuestWarningDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [draftTrip, setDraftTrip] = useState(null);
  const [warnings, setWarnings] = useState([]);

  const returnDatePopoverTriggerRef = useRef(null);
  const [returnDatePopoverOpen, setReturnDatePopoverOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const tripNameRef = useRef(null);
  const datesContainerRef = useRef(null);
  const destinationContainerRef = useRef(null);
  const airportContainerRef = useRef(null);

  const monthOptions = useMemo(() => generateMonthOptions(destinations), [destinations]);

  const STEPS = planningSteps;
  const currentStep = 0;

  const checkEditMode = useCallback(async (allNormalizedDestinations) => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');

    if (tripId) {
      try {
        const existingTrips = await db.entities.TripPlan.filter({ id: tripId });

        if (existingTrips.length > 0) {
          const trip = existingTrips[0];
          // Find the destination from the already normalized list
          const destination = allNormalizedDestinations.find(d => d.id === trip.destination_id);
          
          if (destination) {
            setEditingTrip(trip);
            setSelectedDestination(destination); 

            setTripData({
              trip_name: trip.trip_name,
              departure_date: trip.departure_date ? new Date(trip.departure_date) : null,
              return_date: trip.return_date ? new Date(trip.return_date) : null,
              departure_month: trip.departure_month || "",
              return_month: trip.return_month || "",
              departure_airport: trip.departure_airport,
              arrival_airport: trip.arrival_airport,
              participants: trip.participants || 2,
              budget_range: trip.budget_range,
              skiing_level: trip.skiing_level,
              is_first_trip: trip.is_first_trip || false,
              flexible_dates: trip.flexible_dates || false,
              has_kosher_food: trip.has_kosher_food || false
            });
          }
        }
      } catch (error) {
        console.error("Error loading trip for editing:", error);
      }
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const [destData, airportData, userData] = await Promise.all([
        db.entities.SkiDestination.list(),
        db.entities.Airport.list(),
        db.auth.me().catch(() => null)
      ]);
      
      // נירמול יעד + מפות מרחק/זמן + רשימת IATA ליעד
      const normalizedDest = destData.map((d) => {
        const nearest = normalizeKey(d.nearest_airport).toUpperCase();
        return {
          ...d,
          nearest_airport: nearest,
          airport_distances: normalizeIATAMap(d.airport_distances),
          drive_times: normalizeIATAMap(d.drive_times),
          // נוודא שגם nearest_airports (אם קיים) הם קודים עליונים
          nearest_airports: Array.isArray(d.nearest_airports)
            ? d.nearest_airports.map((c) => normalizeKey(c).toUpperCase())
            : [],
        };
      });
      setDestinations(normalizedDest);

      // נורמליזציה בסיסית לרשימת שדות התעופה (קוד עליון)
      const normalizedAirports = (airportData || []).map(a => ({
        ...a,
        code: normalizeKey(a.code).toUpperCase(),
      }));
      setAllAirports(normalizedAirports);
      
      setUser(userData);
  
      const urlParams = new URLSearchParams(window.location.search);
      const isEditing = urlParams.get('tripId');
  
      if (!isEditing) {
        const savedDraft = localStorage.getItem(DRAFT_TRIP_KEY);
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            if (parsedDraft.trip_name || parsedDraft.destination_id) {
              setDraftTrip(parsedDraft);
              setShowRestoreDialog(true);
            } else {
               localStorage.removeItem(DRAFT_TRIP_KEY);
            }
          } catch (e) {
            console.error("Error parsing draft trip", e);
            localStorage.removeItem(DRAFT_TRIP_KEY);
          }
        } else {
          const destinationParam = urlParams.get('destination');
          if (destinationParam) {
            const destObject = normalizedDest.find(d => d.name === destinationParam); // Use normalizedDest
            if (destObject) {
              setSelectedDestination(destObject);
              setTripData(prev => ({ ...prev, trip_name: `טיול סקי ל${destinationParam}` }));
            }
          }
        }
      } else { // It's editing mode, call checkEditMode here
        checkEditMode(normalizedDest); // Pass normalizedDest
      }
    } catch (error) {
      console.error("Failed to load initial data", error);
    }
  }, [checkEditMode]);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEditing = urlParams.get('tripId');

    if (!isEditing && (tripData.trip_name || selectedDestination || tripData.departure_date || tripData.departure_month)) {
      const draftToSave = {
        ...tripData,
        destination_id: selectedDestination?.id,
        departure_date: tripData.departure_date ? tripData.departure_date.toISOString() : null,
        return_date: tripData.return_date ? tripData.return_date.toISOString() : null,
      };
      localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftToSave));
    }
  }, [tripData, selectedDestination]);

  useEffect(() => {
    const newWarnings = [];
    if (selectedDestination) {
      if (tripData.is_first_trip && !selectedDestination.is_beginner_friendly) {
        newWarnings.push("היעד שבחרת אינו מומלץ במיוחד לגולשים מתחילים.");
      }
      if (tripData.has_kosher_food && !selectedDestination.has_kosher_option) {
        newWarnings.push("היעד שבחרת אינו מספק אפשרויות כשרות מובנות.");
      }
    }
    setWarnings(newWarnings);
  }, [tripData.is_first_trip, tripData.has_kosher_food, selectedDestination]);

  const handleInputChange = (field, value) => {
    setTripData(prev => ({ ...prev, [field]: value }));
    
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    if (field === 'flexible_dates' && value === true) {
      handleInputChange('departure_date', null);
      handleInputChange('return_date', null);
    } else if (field === 'flexible_dates' && value === false) {
      handleInputChange('departure_month', "");
      handleInputChange('return_month', "");
    }
  };

  const handleClearDates = () => {
    setTripData(prev => ({
      ...prev,
      departure_date: null,
      return_date: null
    }));
  };

  const handleClearMonths = () => {
    setTripData(prev => ({
      ...prev,
      departure_month: "",
      return_month: ""
    }));
  };

  const handleDestinationChange = (destName) => {
    const destinationObject = destinations.find(d => d.name === destName);
    setSelectedDestination(destinationObject);
    setTripData(prev => ({ ...prev, arrival_airport: "" }));
  };

  const clearDestination = () => {
    setSelectedDestination(null);
    setTripData(prev => ({ ...prev, arrival_airport: "" }));
  }

  const validateFormAndHighlight = () => {
    const missingFields = [];
    
    if (!tripData.trip_name) {
      missingFields.push({ field: 'trip_name', element: tripNameRef.current, message: 'נא למלא שם הטיול' });
    }
    
    if (tripData.flexible_dates) {
      if (!tripData.departure_month) {
        missingFields.push({ field: 'departure_month', element: datesContainerRef.current, message: 'נא לבחור חודש יציאה' });
      }
    } else {
      if (!tripData.departure_date || !tripData.return_date) {
        missingFields.push({ field: 'dates', element: datesContainerRef.current, message: 'נא לבחור תאריכי יציאה וחזרה' });
      }
    }
    
    if (!selectedDestination) {
      missingFields.push({ field: 'destination', element: destinationContainerRef.current, message: 'נא לבחור יעד סקי' });
    }
    
    if (!tripData.arrival_airport) {
      missingFields.push({ field: 'arrival_airport', element: airportContainerRef.current, message: 'נא לבחור שדה תעופה יעד' });
    }
    
    if (missingFields.length > 0) {
      const firstMissing = missingFields[0];
      
      if (firstMissing.element) {
        firstMissing.element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      
      setFieldErrors({ [firstMissing.field]: firstMissing.message });
      
      setTimeout(() => {
        setFieldErrors({});
      }, 2500);
      
      return false;
    }
    
    return true;
  };

  const handleButtonClick = () => {
    const isValid = validateFormAndHighlight();
    if (!isValid) {
      return;
    }

    // אם זה מצב עריכה של טיול קיים - חייבים להיות מחוברים
    if (editingTrip && !user) {
      setShowLoginAlert(true);
      return;
    }

    // אם המשתמש מחובר - ליצור/לעדכן טיול רגיל
    if (user) {
      handleCreateOrUpdateTrip();
      return;
    }

    // משתמש לא מחובר ויוצר טיול חדש - להציג אזהרת אורח
    setShowGuestWarningDialog(true);
  };

  const handleArrivalAirportChange = (airportCode) => {
    setTripData(prev => ({ ...prev, arrival_airport: airportCode }));
  };

  const handleDepartureDateSelect = (date) => {
    handleInputChange('departure_date', date);
    if (tripData.return_date && date && date > tripData.return_date) {
      handleInputChange('return_date', null);
    }
    setTimeout(() => {
        returnDatePopoverTriggerRef.current?.click();
    }, 100);
  };

  const handleReturnDateSelect = (date) => {
    handleInputChange('return_date', date);
    setReturnDatePopoverOpen(false);
  }

  const handleMonthChange = (monthValue) => {
    handleInputChange('departure_month', monthValue);
    if (tripData.return_month && tripData.return_month < monthValue) {
      handleInputChange('return_month', "");
    }
  };

  const handleRestoreDraft = async () => {
    if (!draftTrip) return;
    const dest = destinations.find(d => d.id === draftTrip.destination_id);
    if (dest) {
      setSelectedDestination(dest);
    }
    setTripData({
      ...draftTrip,
      departure_date: draftTrip.departure_date ? new Date(draftTrip.departure_date) : null,
      return_date: draftTrip.return_date ? new Date(draftTrip.return_date) : null,
    });

    // אם המשתמש חזר אחרי התחברות ויש סימון ליצירת טיול
    if (draftTrip.pendingCreation && user && dest) {
      handleDiscardDraft();
      // יצירת הטיול אוטומטית
      setLoading(true);
      try {
        const tripPayload = {
          trip_name: draftTrip.trip_name,
          destination_id: dest.id,
          destination_name: dest.name,
          departure_date: draftTrip.flexible_dates ? null : (draftTrip.departure_date ? format(new Date(draftTrip.departure_date), 'yyyy-MM-dd') : null),
          return_date: draftTrip.flexible_dates ? null : (draftTrip.return_date ? format(new Date(draftTrip.return_date), 'yyyy-MM-dd') : null),
          departure_month: draftTrip.flexible_dates ? draftTrip.departure_month : null,
          return_month: draftTrip.flexible_dates ? draftTrip.return_month : null,
          departure_airport: draftTrip.departure_airport,
          arrival_airport: draftTrip.arrival_airport,
          participants: Number(draftTrip.participants) || 1,
          budget_range: draftTrip.budget_range,
          skiing_level: draftTrip.skiing_level,
          is_first_trip: draftTrip.is_first_trip,
          flexible_dates: draftTrip.flexible_dates,
          has_kosher_food: draftTrip.has_kosher_food,
          status: "planning",
          steps_completed: {
            flights: false,
            transport: false,
            accommodation: false,
            insurance: false,
            equipment: false,
            lessons: false,
            ski_pass: false
          },
          shared_with: [],
        };
        const newTrip = await db.entities.TripPlan.create(tripPayload);
        toast.success("הטיול נוצר בהצלחה! ממשיכים לשלב הטיסות.");
        navigate(createPageUrl(`FlightStep?tripId=${newTrip.id}`));
      } catch (error) {
        console.error("Error creating trip after login:", error);
        toast.error("שגיאה ביצירת הטיול: " + error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // בדיקה אם יש שלב שמור לניווט אליו
    const savedStep = localStorage.getItem(DRAFT_STEP_KEY);
    if (savedStep !== null) {
      const stepIndex = parseInt(savedStep, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < planningSteps.length) {
        handleDiscardDraft();
        toast.success("משחזר את ההתקדמות שלך...");
        navigate(createPageUrl(`${planningSteps[stepIndex].url}?guest=1`));
        return;
      }
    }

    handleDiscardDraft();
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_TRIP_KEY);
    localStorage.removeItem(DRAFT_STEP_KEY);
    setShowRestoreDialog(false);
    setDraftTrip(null);
  };

  const handleCreateOrUpdateTrip = async () => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }
    
    if (!tripData.trip_name || !selectedDestination) {
        toast.error("אנא ודא/י שמילאת את שם הטיול ובחרת יעד.");
        return;
    }

    if (tripData.flexible_dates) {
        if (!tripData.departure_month || !tripData.arrival_airport) {
            toast.error("אנא בחר/י חודש יציאה ושדה תעופה יעד.");
            return;
        }
    } else {
        if (!tripData.departure_date || !tripData.return_date || !tripData.arrival_airport) {
            toast.error("אנא בחר/י תאריכי יציאה וחזרה ושדה תעופה יעד.");
            return;
        }
    }

    setLoading(true);
    try {
      const tripPayload = {
        trip_name: tripData.trip_name,
        destination_id: selectedDestination.id,
        destination_name: selectedDestination.name,
        departure_date: tripData.flexible_dates ? null : (tripData.departure_date ? format(tripData.departure_date, 'yyyy-MM-dd') : null),
        return_date: tripData.flexible_dates ? null : (tripData.return_date ? format(tripData.return_date, 'yyyy-MM-dd') : null),
        departure_month: tripData.flexible_dates ? tripData.departure_month : null,
        return_month: tripData.flexible_dates ? tripData.return_month : null,
        departure_airport: tripData.departure_airport,
        arrival_airport: tripData.arrival_airport,
        participants: Number(tripData.participants) || 1,
        budget_range: tripData.budget_range,
        skiing_level: tripData.skiing_level,
        is_first_trip: tripData.is_first_trip,
        flexible_dates: tripData.flexible_dates,
        has_kosher_food: tripData.has_kosher_food,
        status: "planning",
        steps_completed: editingTrip ? editingTrip.steps_completed : {
          flights: false,
          transport: false,
          accommodation: false,
          insurance: false,
          equipment: false,
          lessons: false,
          ski_pass: false
        },
        affiliate_links: editingTrip ? editingTrip.affiliate_links : {},
        created_by_group: editingTrip ? editingTrip.created_by_group : [user.email],
        shared_with: editingTrip ? editingTrip.shared_with : [],
      };

      if (editingTrip) {
        await db.entities.TripPlan.update(editingTrip.id, tripPayload);
        toast.success("הטיול עודכן בהצלחה!");
        navigate(createPageUrl(`TripDetails?id=${editingTrip.id}`));
      } else {
        const newTrip = await db.entities.TripPlan.create(tripPayload);
        localStorage.removeItem(DRAFT_TRIP_KEY);
        toast.success("הטיול נוצר בהצלחה! כעת נעביר אותך לשלב תכנון הטיסות.");
        navigate(createPageUrl(`FlightStep?tripId=${newTrip.id}`));
      }
    } catch (error) {
      console.error("Error creating/updating trip:", error);
      toast.error("שגיאה בשמירת הטיול: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    db.auth.redirectToLogin(window.location.href);
  };

  const handleContinueAsGuest = () => {
    setShowGuestWarningDialog(false);
    
    // שמירת כל הנתונים בטיוטה המקומית
    const guestDraft = {
      ...tripData,
      destination_id: selectedDestination?.id,
      destination_name: selectedDestination?.name,
      departure_date: tripData.departure_date ? tripData.departure_date.toISOString() : null,
      return_date: tripData.return_date ? tripData.return_date.toISOString() : null,
    };
    localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(guestDraft));
    
    // מעבר לשלב הטיסות במצב אורח
    toast.success("ממשיך לתכנון במצב אורח. המידע נשמר בדפדפן שלך.");
    navigate(createPageUrl(`FlightStep?guest=1`));
  };

  const handleLoginAndSave = () => {
    setShowGuestWarningDialog(false);
    
    // שמירת הטיוטה לפני ההפניה להתחברות
    const draftToSave = {
      ...tripData,
      destination_id: selectedDestination?.id,
      destination_name: selectedDestination?.name,
      departure_date: tripData.departure_date ? tripData.departure_date.toISOString() : null,
      return_date: tripData.return_date ? tripData.return_date.toISOString() : null,
      pendingCreation: true // סימון שצריך ליצור טיול אחרי התחברות
    };
    localStorage.setItem(DRAFT_TRIP_KEY, JSON.stringify(draftToSave));
    
    // הפניה להתחברות
    db.auth.redirectToLogin(window.location.href);
  };

  const israeliAirports = [
    "בן גוריון (TLV)",
    "רמון (ETM)"
  ];

  const filteredDestinations = useMemo(() => {
    if (!destinations) return [];
    let currentFiltered = [...destinations];

    if (tripData.flexible_dates && tripData.departure_month) {
        const [year, month] = tripData.departure_month.split('-').map(Number);
        currentFiltered = currentFiltered.filter(dest => {
            if (!dest.season_start_date || !dest.season_end_date) return true;
            const seasonStart = new Date(dest.season_start_date);
            const seasonEnd = new Date(dest.season_end_date);
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0);
            return monthStart < seasonEnd && monthEnd > seasonStart;
        });
    } else if (!tripData.flexible_dates && tripData.departure_date) {
        currentFiltered = currentFiltered.filter(dest => {
            if (!dest.season_start_date || !dest.season_end_date) return true;
            const seasonStart = new Date(dest.season_start_date);
            const seasonEnd = new Date(dest.season_end_date);
            const tripStart = new Date(tripData.departure_date);
            const tripEnd = tripData.return_date ? new Date(tripData.return_date) : tripStart;
            return tripStart < seasonEnd && tripEnd > seasonStart;
        });
    }

    if (tripData.is_first_trip) {
        currentFiltered = currentFiltered.filter(dest => dest.is_beginner_friendly);
    }
    if (tripData.budget_range === 'בסיסי') {
        currentFiltered = currentFiltered.filter(dest => dest.budget_level === 'נמוך');
    }
    if (tripData.has_kosher_food) {
        currentFiltered = currentFiltered.filter(dest => dest.has_kosher_option);
    }

    return currentFiltered;
  }, [destinations, tripData]);

  const seasonWarning = useMemo(() => {
    if (!selectedDestination || (!tripData.departure_date && !tripData.departure_month)) {
        return null;
    }

    let checkDate;
    if (tripData.flexible_dates) {
        if (!tripData.departure_month) return null;
        const [year, month] = tripData.departure_month.split('-').map(Number);
        checkDate = new Date(year, month - 1, 15);
    } else {
        checkDate = tripData.departure_date;
    }

    if (!checkDate) return null;

    if (selectedDestination.season_start_date && new Date(checkDate) < new Date(selectedDestination.season_start_date)) {
        return `התאריך שבחרת הוא לפני פתיחת העונה הצפויה (${format(new Date(selectedDestination.season_start_date), 'dd/MM/yyyy')}).`;
    }
    if (tripData.return_date && selectedDestination.season_end_date && new Date(tripData.return_date) > new Date(selectedDestination.season_end_date)) {
        return `תאריך החזרה שבחרת הוא אחרי סגירת העונה הצפויה (${format(new Date(selectedDestination.season_end_date), 'dd/MM/yyyy')}).`;
    }
    return null;
  }, [selectedDestination, tripData.departure_date, tripData.return_date, tripData.departure_month, tripData.flexible_dates]);

  const availableAirports = useMemo(() => {
    if (!selectedDestination || !Array.isArray(selectedDestination.nearest_airports) || !allAirports) return [];
    const allow = new Set(selectedDestination.nearest_airports.map(c => normalizeKey(c).toUpperCase()));
    return allAirports.filter(ap => allow.has(normalizeKey(ap.code).toUpperCase()));
  }, [selectedDestination, allAirports]);
  
  const getDistanceInfo = () => {
  if (!selectedDestination || !tripData.arrival_airport) return null;
  const distance = selectedDestination.airport_distances?.[tripData.arrival_airport];
  const timeRaw = selectedDestination.drive_times?.[tripData.arrival_airport];

  // robust parser: supports "H:MM" / "HH:MM", "H.MM" (as separator), and decimal hours
  const parseTimeToHM = (t) => {
    if (t == null) return null;
    if (typeof t === 'number') {
      const h = Math.floor(t);
      const m = Math.round((t - h) * 60);
      return { h, m };
    }
    if (typeof t === 'string') {
      const s = t.trim();

      // a) H:MM (e.g., "3:30", "0:50")
      let m = s.match(/^(\d+)\s*:\s*(\d{1,2})$/);
      if (m) {
        let h = parseInt(m[1], 10);
        let mins = parseInt(m[2], 10);
        if (Number.isNaN(h) || Number.isNaN(mins)) return null;
        if (mins >= 60) { h += Math.floor(mins / 60); mins = mins % 60; }
        return { h, m: mins };
      }

      // b) H.MM used as minutes (e.g., "2.15" => 2h 15m)
      m = s.match(/^(\d+)\s*[.,·]\s*(\d{1,2})$/);
      if (m) {
        let h = parseInt(m[1], 10);
        let mins = parseInt(m[2], 10);
        if (Number.isNaN(h) || Number.isNaN(mins)) return null;
        if (mins >= 60) { h += Math.floor(mins / 60); mins = mins % 60; }
        return { h, m: mins };
      }

      // c) decimal hours (e.g., "3.5" => 3h 30m)
      const num = parseFloat(s.replace(/[^\d.\-]/g, ''));
      if (!Number.isNaN(num)) {
        const h = Math.floor(num);
        const mins = Math.round((num - h) * 60);
        return { h, m: mins };
      }
    }
    return null;
  };

  const formatHM = (hm) => {
    if (!hm) return '';
    const h = hm.h || 0;
    const m = hm.m || 0;
    if (h === 0 && m === 0) return 'פחות מדקה';
    if (h === 0) return m + 'דקות';
    let hoursText = '';                 // טיפול בשעות בעברית
    if (h === 1) hoursText = 'שעה';
    else if (h === 2) hoursText = 'שעתיים';
    else hoursText = h + ' שעות';
    if (m === 0) return hoursText;
    return hoursText + ' ו- ' + m + " דק'";
  };

  const hm = parseTimeToHM(timeRaw);

  if (distance || hm) {
    return (
      <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-around text-center">
        {distance && (
          <div className="flex flex-col items-center gap-1">
            <Route className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-lg text-slate-800">{distance}</span>
            <span className="text-xs text-slate-500">מרחק מהיעד</span>
          </div>
        )}
        {distance && hm && <div className="h-10 w-px bg-blue-200"></div>}
        {hm && (
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-lg text-slate-800">{formatHM(hm)}</span>
            <span className="text-xs text-slate-500">זמן נסיעה <span className="font-medium text-slate-550">משוער</span></span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

  const distanceInfo = getDistanceInfo();

  const participantsOptions = useMemo(() => [...Array(10).keys()].map(i => ({
    value: String(i + 1),
    label: String(i + 1)
  })), []);

  const skiingLevelOptions = useMemo(() => [
    { value: "כחול (מתחיל)", label: "כחול (מתחיל)" },
    { value: "אדום (מתקדם)", label: "אדום (מתקדם)" },
    { value: "שחור (מקצוען)", label: "שחור (מקצוען)" }
  ], []);

  const destinationOptions = useMemo(() => filteredDestinations.map(d => ({
    value: d.name,
    label: `${d.name} (${d.country})`
  })), [filteredDestinations]);

  const airportOptions = useMemo(() => availableAirports.map(a => ({
    value: a.code,
    label: `${a.name} (${a.code})`
  })), [availableAirports]);

  const israeliAirportOptions = useMemo(() => israeliAirports.map(airport => ({
    value: airport,
    label: airport
  })), [israeliAirports]);

  const renderDestinationSelector = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border">
        <div className="flex justify-between items-center mb-4">
            <Label htmlFor="destination-select" className="text-lg font-semibold text-slate-800 flex items-center gap-2"><MapPin className="ml-0"/>בחירת יעד סקי</Label>
            {selectedDestination && (
                <Button variant="ghost" size="sm" onClick={clearDestination} className="text-red-500 hover:text-red-600 transition-all">
                    <X className="w-4 h-4 mr-1"/> שנה יעד
                </Button>
            )}
        </div>

      {!selectedDestination ? (
        <>
            <RtlSelect
              id="destination-select"
              placeholder="בחר/י יעד מהרשימה..."
              value={selectedDestination?.name || ""}
              onValueChange={handleDestinationChange}
              options={destinationOptions}
              className="transition-all"
            />
            <p className="text-xs text-slate-500 mt-2">
                המערכת מציגה רק את היעדים הפתוחים בתאריכים ובפרמטרים שבחרת. לא בטוחים? <Link to={createPageUrl('Destinations')} className="text-blue-600 underline">עיינו בכל היעדים</Link>.
            </p>
        </>
      ) : (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h3 className="text-xl font-bold text-slate-800">{selectedDestination.name}</h3>
            <p className="text-slate-600">{selectedDestination.country}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 animate-page-header">
            תכנן את חופשת הסקי שלך
          </h1>
          <p className="text-lg text-slate-600 mb-3">
            {currentStep === 0 ? 'בואו נתחיל לתכנן את החופשה שלכם' : `שלב ${currentStep + 1} מתוך ${STEPS.length}`}
          </p>
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3 max-w-2xl mx-auto">
            <p className="text-sm text-slate-700 mb-2">רוצים שנעשה הכל בשבילכם?</p>
            <Link to={createPageUrl("VipForm")}>
              <Button variant="outline" size="sm" className="border-pink-500 text-pink-700 hover:bg-pink-50">
                הפוך את תכנון הטיול ל-VIP – ליווי אישי מלא
              </Button>
            </Link>
          </div>
        </div>

        {/* Trip Planning Process Overview */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">אז איך זה עובד?</h2>
              <p className="text-sm text-slate-600 max-w-3xl mx-auto">
                אתם נכנסים עכשיו לתהליך תכנון חופשת סקי ב-7 שלבים פשוטים. בכל שלב נתמקד בנושא אחר - מטיסות ועד סקי-פס - והמערכת תעזור לכם לעשות סדר, להשלים את המשימות ולחזור לכאן בכל רגע.
              </p>
            </div>
            <TripPlanningProgress mode="intro" />
          </CardContent>
        </Card>

        <div className="space-y-8">
            <div className="space-y-6">
                
                <div className="bg-white p-6 rounded-xl shadow-md border" ref={tripNameRef}>
                    <Label htmlFor="trip-name" className="text-lg font-semibold text-slate-800">שם הטיול</Label>
                    <p className="text-sm text-slate-500 mb-2">תנו לטיול שלכם שם שיעזור לכם לזכור אותו, למשל "טסים לסקי עם החבר'ה - איטליה".</p>
                    <Input 
                      id="trip-name" 
                      value={tripData.trip_name} 
                      onChange={(e) => handleInputChange('trip_name', e.target.value)} 
                      className={`h-12 text-base transition-all ${fieldErrors.trip_name ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.trip_name && <p className="text-red-500 text-sm mt-1">{fieldErrors.trip_name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border">
                        <Label htmlFor="participants-select" className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Users className="ml-0"/>מספר נוסעים</Label>
                        <div className="mt-2">
                          <RtlSelect
                            id="participants-select"
                            value={String(tripData.participants)}
                            onValueChange={val => handleInputChange('participants', Number(val))}
                            options={participantsOptions}
                          />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md border">
                        <Label htmlFor="skiing-level-select" className="text-lg font-semibold text-slate-800 flex items-center gap-2"><BarChart3 className="ml-0"/>רמת סקי</Label>
                        <div className="mt-2">
                          <RtlSelect
                            id="skiing-level-select"
                            value={tripData.skiing_level}
                            onValueChange={val => handleInputChange('skiing_level', val)}
                            options={skiingLevelOptions}
                          />
                        </div>
                    </div>
                </div>

                 <div className="bg-white p-6 rounded-xl shadow-md border space-y-4">
                    <Label className="text-lg font-semibold text-slate-800 flex items-center gap-2"><TrendingUp className="ml-0"/>העדפות נוספות</Label>
                     <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox id="is_first_trip" checked={tripData.is_first_trip} onCheckedChange={checked => handleInputChange('is_first_trip', checked)} />
                        <Label htmlFor="is_first_trip" className="cursor-pointer text-base">זו חופשת הסקי הראשונה שלי</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox id="has_kosher_food" checked={tripData.has_kosher_food} onCheckedChange={checked => handleInputChange('has_kosher_food', checked)} />
                        <Label htmlFor="has_kosher_food" className="cursor-pointer text-base">אני רוצה אתר שמתאים לשומרי כשרות</Label>
                    </div>
                     <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t mt-4">
                        <Checkbox id="flexible_dates" checked={tripData.flexible_dates} onCheckedChange={checked => handleInputChange('flexible_dates', checked)} />
                        <Label htmlFor="flexible_dates" className="cursor-pointer text-base font-medium">התאריכים שלי גמישים (חיפוש לפי חודשים)</Label>
                    </div>
                    {warnings.length > 0 && (
                        <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
                            <AlertCircle className="h-4 w-4 text-amber-600"/>
                            <AlertTitle className="text-amber-900">שימו לב!</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pr-4 space-y-1">
                                    {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                 </div>

                <div className="bg-white p-6 rounded-xl shadow-md border" ref={datesContainerRef}>
                    <div className="flex justify-between items-center mb-4">
                        <Label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <CalendarIcon className="ml-0"/>
                            תאריכי החופשה
                        </Label>
                        {!tripData.flexible_dates && (tripData.departure_date || tripData.return_date) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleClearDates}
                                className="text-red-500 hover:text-red-600"
                            >
                                <X className="w-4 h-4 ml-1" />
                                אפס תאריכים
                            </Button>
                        )}
                        {tripData.flexible_dates && (tripData.departure_month || tripData.return_month) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleClearMonths}
                                className="text-red-500 hover:text-red-600"
                            >
                                <X className="w-4 h-4 ml-1" />
                                אפס חודשים
                            </Button>
                        )}
                    </div>
                    {tripData.flexible_dates ? (
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label htmlFor="departure-month">חודש יציאה</Label>
                                <RtlSelect
                                  id="departure-month"
                                  value={tripData.departure_month}
                                  onValueChange={handleMonthChange}
                                  options={monthOptions}
                                  placeholder="בחירת חודש"
                                />
                            </div>
                            <div>
                                <Label htmlFor="return-month">חודש חזרה (אופציונלי)</Label>
                                <RtlSelect
                                  id="return-month"
                                  value={tripData.return_month || ""}
                                  onValueChange={val => handleInputChange('return_month', val === 'clear' ? '' : val)}
                                  options={[
                                    { value: "clear", label: "כמו חודש יציאה" },
                                    ...monthOptions.filter(opt => !tripData.departure_month || opt.value >= tripData.departure_month)
                                  ]}
                                  placeholder="כמו חודש יציאה"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-12 w-full justify-start text-right font-normal text-base transition-all">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {tripData.departure_date ? format(tripData.departure_date, 'd בMMMM, yyyy', { locale: he }) : <span>תאריך יציאה</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={tripData.departure_date}
                                      onSelect={handleDepartureDateSelect}
                                      initialFocus
                                      disabled={(date) => {
                                        const today = new Date();
                                        today.setHours(0,0,0,0);
                                        return date < today;
                                      }}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Popover open={returnDatePopoverOpen} onOpenChange={setReturnDatePopoverOpen}>
                                <PopoverTrigger asChild ref={returnDatePopoverTriggerRef}>
                                    <Button
                                      variant="outline"
                                      className="h-12 w-full justify-start text-right font-normal text-base transition-all"
                                      disabled={!tripData.departure_date}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {tripData.return_date ? format(tripData.return_date, 'd בMMMM, yyyy', { locale: he }) : <span>תאריך חזרה</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={tripData.return_date}
                                      onSelect={handleReturnDateSelect}
                                      initialFocus
                                      disabled={(date) => {
                                        const minDate = tripData.departure_date ? new Date(tripData.departure_date) : new Date();
                                        minDate.setHours(0,0,0,0);
                                        return date < minDate;
                                      }}
                                      defaultMonth={tripData.departure_date || new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                    {seasonWarning && <Alert variant="destructive" className="mt-4 transition-all"><AlertCircle className="h-4 w-4"/><AlertTitle>שימו לב!</AlertTitle><AlertDescription>{seasonWarning}</AlertDescription></Alert>}
                     {filteredDestinations.length === 0 && (tripData.departure_date || tripData.departure_month) && (
                        <Alert variant="destructive" className="mt-4 transition-all">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertTitle>אין יעדים זמינים</AlertTitle>
                            <AlertDescription>לא נמצאו במערכת יעדי סקי שפתוחים בתאריכים או בחודשים שבחרת. נסה/י לשנות את התאריכים או את העדפות.</AlertDescription>
                        </Alert>
                    )}
                    <p className="text-xs text-slate-500 mt-2 p-2 bg-blue-50/60 rounded-md border border-blue-100 transition-all">שימו לב לתאריכים לפני סוף נובמבר, גלישה אפשרית בעיקר בקרחונים ספציפיים כמו הינטרטוקס או צרמט. אחרי אפריל, רוב האתרים נסגרים. מומלץ לבדוק את תאריכי הסגירה של היעד.</p>
                    {(fieldErrors.dates || fieldErrors.departure_month) && (
                      <p className="text-red-500 text-sm mt-2">{fieldErrors.dates || fieldErrors.departure_month}</p>
                    )}
                </div>

                <div ref={destinationContainerRef}>
                  {renderDestinationSelector()}
                  {fieldErrors.destination && <p className="text-red-500 text-sm mt-2">{fieldErrors.destination}</p>}
                </div>

                {selectedDestination && (
                     <div className="bg-white p-6 rounded-xl shadow-md border grid md:grid-cols-2 gap-6" ref={airportContainerRef}>
                        <div>
                             <Label className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Plane className="rotate-180 ml-0"/>יציאה מישראל</Label>
                             <div className="mt-2">
                               <RtlSelect
                                 value={tripData.departure_airport}
                                 onValueChange={val => handleInputChange('departure_airport', val)}
                                 options={israeliAirportOptions}
                               />
                             </div>
                        </div>
                        <div>
                            <Label className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Plane className="ml-0"/>שדה תעופה יעד</Label>
                             <div className="mt-2">
                               <RtlSelect
                                 value={tripData.arrival_airport}
                                 onValueChange={handleArrivalAirportChange}
                                 options={airportOptions.length > 0 ? airportOptions : [{ value: "", label: "אין שדות תעופה זמינים" }]}
                                 placeholder="בחר שדה תעופה..."
                                 disabled={airportOptions.length === 0}
                                 className={fieldErrors.arrival_airport ? 'border-red-500' : ''}
                               />
                             </div>
                            {distanceInfo && <div className="mt-2 transition-all">{distanceInfo}</div>}
                            {fieldErrors.arrival_airport && <p className="text-red-500 text-sm mt-2">{fieldErrors.arrival_airport}</p>}
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-12 text-center">
                <Button 
                  size="default" 
                  onClick={handleButtonClick}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 text-base shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                    {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin transition-all" /> : <CheckCircle className="w-5 h-5 mr-2 transition-all" />}
                    {editingTrip ? 'שמור שינויים והמשך' : 'צור טיול ועבור לשלב הראשון'}
                </Button>
            </footer>

            <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>נמצא תכנון טיול קודם</AlertDialogTitle>
                  <AlertDialogDescription>
                    נראה שהתחלת לתכנן טיול ולא סיימת. האם תרצה/י לשחזר את ההתקדמות שלך?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleDiscardDraft}>להתחיל תכנון חדש</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestoreDraft}>כן, שחזר</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>נדרשת התחברות</AlertDialogTitle>
                        <AlertDialogDescription>
                            כדי לערוך טיול קיים, עליך להתחבר או להירשם.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowLoginAlert(false)}>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogin}>התחברות / הרשמה</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showGuestWarningDialog} onOpenChange={setShowGuestWarningDialog}>
                <AlertDialogContent dir="rtl" className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">רוצה לשמור את תכנון הטיול שלך?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-right">
                                <p>
                                    אפשר להמשיך לתכנן את חופשת הסקי גם בלי להירשם, אבל המידע יישמר רק <strong>באופן זמני בדפדפן שלך</strong>.
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                                    <p className="font-medium mb-1">⚠️ שים לב:</p>
                                    <ul className="list-disc pr-4 space-y-1">
                                        <li>אם תסגור את הדפדפן או תנקה היסטוריה - התכנון עלול להימחק</li>
                                        <li>לא תוכל לגשת לתכנון ממכשיר או דפדפן אחר</li>
                                        <li>גלישה במצב אינקוגניטו לא שומרת נתונים</li>
                                    </ul>
                                </div>
                                <p className="text-slate-600">
                                    אם תתחבר עכשיו, נשמור את הטיול שלך בחשבון אישי ותוכל לחזור אליו מכל מכשיר.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => setShowGuestWarningDialog(false)} className="sm:order-1">
                            ביטול
                        </AlertDialogCancel>
                        <Button 
                            variant="outline" 
                            onClick={handleContinueAsGuest}
                            className="sm:order-2"
                        >
                            להמשיך ללא התחברות
                        </Button>
                        <AlertDialogAction 
                            onClick={handleLoginAndSave}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 sm:order-3"
                        >
                            התחברות ושמירת הטיול
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}