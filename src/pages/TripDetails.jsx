const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TripPlan, SkiDestination } from '@/entities/all';

import {
  Loader2, Calendar, Users, Mountain, Edit, Trash2, ArrowLeft, Share2, Mail,
  Calendar as CalendarIcon, X, Check, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Toaster, toast } from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
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

const StepCard = ({ title, status, link }) => (
  <Link to={link}>
    <Card className={`hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
      status === 'completed'
        ? 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white'
        : 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white'
    }`}>
      <CardContent className="p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {status === 'completed' ? (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-semibold text-lg">{title}</span>
        </div>
        <Badge
          variant={status === 'completed' ? 'default' : 'outline'}
          className={status === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'border-blue-500 text-blue-600'}
        >
          {status === 'completed' ? 'הושלם ✓' : 'לתכנון'}
        </Badge>
      </CardContent>
    </Card>
  </Link>
);

export default function TripDetails() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editedDeparture, setEditedDeparture] = useState(null);
  const [editedReturn, setEditedReturn] = useState(null);
  const [isEditingParticipants, setIsEditingParticipants] = useState(false);
  const [editedParticipants, setEditedParticipants] = useState(2);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const returnDatePopoverTriggerRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('id');

  const fetchTripDetails = async () => {
    if (!tripId) {
      setError("לא סופק מזהה טיול.");
      setLoading(false);
      return;
    }
    try {
      // Fetch current user
      const userData = await db.auth.me().catch(() => null);
      setCurrentUser(userData);

      const tripData = await TripPlan.get(tripId);
      setTrip(tripData);
      setEditedDeparture(tripData.departure_date ? new Date(tripData.departure_date) : null);
      setEditedReturn(tripData.return_date ? new Date(tripData.return_date) : null);
      setEditedParticipants(tripData.participants || 1);

      if (tripData?.destination_id) {
        const destData = await SkiDestination.get(tripData.destination_id);
        setDestination(destData);
      }
    } catch (e) {
      console.error(e);
      setError("לא ניתן היה למצוא את הטיול. ייתכן שאין לך הרשאת גישה.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const handleShareTrip = async () => {
    if (!shareEmail || !trip) {
      toast.error("אנא הכנס כתובת מייל תקינה.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast.error("כתובת המייל שהוכנסה אינה תקינה.");
      return;
    }
    const currentGroup = trip.created_by_group || [];
    const currentShared = trip.shared_with || [];
    if (currentGroup.includes(shareEmail)) {
      toast.error("הטיול כבר משותף עם כתובת מייל זו.");
      return;
    }
    try {
      const updatedTrip = await TripPlan.update(trip.id, {
        created_by_group: [...currentGroup, shareEmail],
        shared_with: [...currentShared, shareEmail]
      });
      setTrip(updatedTrip);
      setShareEmail("");
      toast.success(`הטיול שותף בהצלחה עם ${shareEmail}`);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בשיתוף הטיול.");
    }
  };

  const handleRemoveShare = async (emailToRemove) => {
    if (!trip) return;
    try {
      const updatedGroup = (trip.created_by_group || []).filter(email => email !== emailToRemove);
      const updatedSharedList = (trip.shared_with || []).filter(email => email !== emailToRemove);
      const updatedTrip = await TripPlan.update(trip.id, { 
        created_by_group: updatedGroup,
        shared_with: updatedSharedList 
      });
      setTrip(updatedTrip);
      toast.success(`השיתוף עם ${emailToRemove} הוסר.`);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בהסרת השיתוף.");
    }
  };

  const handleDepartureDateSelect = (date) => {
    setEditedDeparture(date);
    if (editedReturn && date && date > editedReturn) setEditedReturn(null);
    setTimeout(() => {
      returnDatePopoverTriggerRef.current?.click();
    }, 100);
  };

  const handleSaveDates = async () => {
    if (editedDeparture === null && editedReturn === null) {
      try {
        const updatedTrip = await TripPlan.update(trip.id, {
          departure_date: null,
          return_date: null,
          flexible_dates: true
        });
        setTrip(updatedTrip);
        setIsEditingDates(false);
        toast.success("התאריכים אופסו בהצלחה!");
      } catch (e) {
        console.error(e);
        toast.error("שגיאה באיפוס התאריכים.");
      }
      return;
    }
    if (!editedDeparture || !editedReturn || !trip) {
      toast.error("אנא בחר גם תאריך יציאה וגם תאריך חזרה, או אפס את שניהם.");
      return;
    }
    if (editedReturn < editedDeparture) {
      toast.error("תאריך החזרה אינו יכול להיות לפני תאריך היציאה.");
      return;
    }
    // בדיקת תקינות תאריכים מול עונת הסקי של היעד
    if (destination) {
      if (destination.season_start_date && editedDeparture < new Date(destination.season_start_date)) {
        toast.error(`תאריך היציאה שבחרת הוא לפני פתיחת עונת הסקי הצפויה ב${destination.name} (${format(new Date(destination.season_start_date), 'dd/MM/yyyy')}). האם ברצונך לשנות את התאריכים?`);
        return;
      }
      if (destination.season_end_date && editedReturn > new Date(destination.season_end_date)) {
        toast.error(`תאריך החזרה שבחרת הוא לאחר סגירת עונת הסקי הצפויה ב${destination.name} (${format(new Date(destination.season_end_date), 'dd/MM/yyyy')}). האם ברצונך לשנות את התאריכים?`);
        return;
      }
    }
    try {
      const updatedTrip = await TripPlan.update(trip.id, {
        departure_date: format(editedDeparture, 'yyyy-MM-dd'),
        return_date: format(editedReturn, 'yyyy-MM-dd'),
        flexible_dates: false
      });
      setTrip(updatedTrip);
      setIsEditingDates(false);
      toast.success("התאריכים עודכנו בהצלחה!");
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בעדכון התאריכים.");
    }
  };

  const handleSaveParticipants = async () => {
    if (!trip || editedParticipants < 1) {
      toast.error("מספר משתתפים חייב להיות לפחות 1.");
      return;
    }
    if (editedParticipants > 20) {
      toast.error("מספר המשתתפים לא יכול לעלות על 20.");
      return;
    }
    try {
      const updatedTrip = await TripPlan.update(trip.id, {
        participants: editedParticipants
      });
      setTrip(updatedTrip);
      setIsEditingParticipants(false);
      toast.success("מספר המשתתפים עודכן בהצלחה!");
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בעדכון מספר המשתתפים.");
    }
  };

  const handleDeleteTrip = async () => {
    if (!trip) return;
    
    setIsDeleting(true);
    try {
      await TripPlan.delete(trip.id);
      toast.success("הטיול נמחק בהצלחה");
      navigate(createPageUrl('MyTrips'));
    } catch (e) {
      console.error(e);
      toast.error("שגיאה במחיקת הטיול");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Check if current user is the trip owner
  const isOwner = currentUser && trip && (
    trip.created_by === currentUser.email ||
    (Array.isArray(trip.created_by_group) && trip.created_by_group[0] === currentUser.email)
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-10" dir="rtl">
        <h2 className="text-2xl font-semibold text-red-600">שגיאה</h2>
        <p className="text-slate-600 mt-2">{error}</p>
        <Link to={createPageUrl('MyTrips')}>
          <Button className="mt-4">חזור לטיולים שלי</Button>
        </Link>
      </div>
    );
  }

  const stepStatus = (stepKey, detailsKey) => {
    if (!trip) return 'pending';
    
    // Check if step is marked as completed
    if (trip.steps_completed && trip.steps_completed[stepKey]) {
      return 'completed';
    }
    
    // Alternative: check if details exist and are not empty
    if (detailsKey && trip[detailsKey] && Object.keys(trip[detailsKey]).length > 0) {
      return 'completed';
    }
    
    return 'pending';
  };

  const planningSteps = [
    { name: "טיסות",   link: createPageUrl(`FlightStep?tripId=${tripId}`),        status: stepStatus('flights', 'flight_details') },
    { name: "תחבורה",  link: createPageUrl(`TransportChoice?tripId=${tripId}`), status: stepStatus('transport', trip?.transport_type === 'car' ? 'car_rental_details' : 'transfer_details') },
    { name: "לינה",     link: createPageUrl(`AccommodationStep?tripId=${tripId}`), status: stepStatus('accommodation', 'accommodation_details') },
    { name: "ביטוח",    link: createPageUrl(`InsuranceStep?tripId=${tripId}`),    status: stepStatus('insurance', 'insurance_details') },
    { name: "ציוד",     link: createPageUrl(`EquipmentStep?tripId=${tripId}`),    status: stepStatus('equipment', 'equipment_details') },
    { name: "שיעורים",  link: createPageUrl(`LessonsStep?tripId=${tripId}`),      status: stepStatus('lessons', 'lessons_details') },
    { name: "סקי-פס",   link: createPageUrl(`SkiPassNotice?tripId=${tripId}`),    status: stepStatus('ski_pass', 'ski_pass_details') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8" dir="rtl">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            הטיול שלי
          </h1>
          <p className="text-slate-600">כל הפרטים והשלבים במקום אחד</p>
        </div>

        <Link to={createPageUrl('MyTrips')} className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 ml-1" />
          חזור לכל הטיולים
        </Link>

        {/* Main Trip Card - Hero Style */}
        <Card className="shadow-2xl border-t-4 border-blue-500 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <CardTitle className="text-4xl font-extrabold mb-2">{trip.trip_name}</CardTitle>
            {destination && (
              <div className="flex items-center gap-2 text-blue-100">
                <Mountain className="w-6 h-6" />
                <span className="text-xl">{destination.name}, {destination.country}</span>
              </div>
            )}
          </div>

          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dates Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm border border-blue-100">
                <Label className="text-sm font-semibold text-blue-900 mb-3 block flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  תאריכי טיול
                </Label>
                {isEditingDates ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-right font-normal bg-white">
                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                            {editedDeparture ? format(editedDeparture, 'd בMMMM, yyyy', { locale: he }) : 'תאריך יציאה'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <UICalendar
                            mode="single"
                            selected={editedDeparture}
                            onSelect={handleDepartureDateSelect}
                            initialFocus
                            locale={he}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild ref={returnDatePopoverTriggerRef}>
                          <Button variant="outline" className="w-full justify-start text-right font-normal bg-white" disabled={!editedDeparture}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                            {editedReturn ? format(editedReturn, 'd בMMMM, yyyy', { locale: he }) : 'תאריך חזרה'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <UICalendar
                            mode="single"
                            selected={editedReturn}
                            onSelect={setEditedReturn}
                            initialFocus
                            locale={he}
                            disabled={(date) => {
                              const minDate = editedDeparture ? new Date(editedDeparture) : new Date();
                              minDate.setHours(0, 0, 0, 0);
                              return date < minDate;
                            }}
                            defaultMonth={editedDeparture || new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={handleSaveDates} className="bg-blue-600 hover:bg-blue-700">
                        <Check className="w-4 h-4 ml-1" /> שמור
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingDates(false);
                          setEditedDeparture(trip.departure_date ? new Date(trip.departure_date) : null);
                          setEditedReturn(trip.return_date ? new Date(trip.return_date) : null);
                        }}
                      >
                        <X className="w-4 h-4 ml-1" /> ביטול
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setEditedDeparture(null);
                          setEditedReturn(null);
                          handleSaveDates();
                        }}
                      >
                        אפס תאריכים
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <span className="font-semibold text-lg text-slate-800">
                      {trip.departure_date ? format(new Date(trip.departure_date), 'dd/MM/yyyy') : 'לא נקבע'}
                      {" → "}
                      {trip.return_date ? format(new Date(trip.return_date), 'dd/MM/yyyy') : 'לא נקבע'}
                    </span>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-blue-100" onClick={() => setIsEditingDates(true)}>
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Participants Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl shadow-sm border border-purple-100">
                <Label className="text-sm font-semibold text-purple-900 mb-3 block flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  מספר משתתפים
                </Label>
                {isEditingParticipants ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={editedParticipants}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEditedParticipants(1);
                        } else {
                          const num = parseInt(val);
                          if (!isNaN(num) && num >= 1 && num <= 20) {
                            setEditedParticipants(num);
                          }
                        }
                      }}
                      className="flex-1 text-center text-lg font-bold bg-white h-10"
                      inputMode="numeric"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveParticipants} className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingParticipants(false);
                          setEditedParticipants(trip.participants);
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <span className="font-semibold text-lg text-slate-800">{trip.participants} משתתפים</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 hover:bg-purple-100"
                      onClick={() => {
                        setIsEditingParticipants(true);
                        setEditedParticipants(trip.participants);
                      }}
                    >
                      <Edit className="w-4 h-4 text-purple-600" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Planning Steps - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 flex-grow bg-gradient-to-r from-blue-500 to-transparent rounded"></div>
              <h2 className="text-3xl font-bold text-slate-800">שלבי תכנון</h2>
              <div className="h-1 flex-grow bg-gradient-to-l from-blue-500 to-transparent rounded"></div>
            </div>

            {planningSteps.map(step => (
              <StepCard key={step.name} title={step.name} status={step.status} link={step.link} />
            ))}

            <Link to={createPageUrl(`FinalChecklist?tripId=${tripId}`)}>
              <Button className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6 shadow-lg">
                <CheckCircle className="w-5 h-5 ml-2" />
                צ'קליסט סופי לפני הטיול
              </Button>
            </Link>
          </div>

          {/* Sharing Section - Takes 1 column */}
          <div className="space-y-4">
            <Card className="shadow-xl border-t-4 border-indigo-500">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Share2 className="w-6 h-6 text-indigo-600" />
                  שתף את הטיול
                </CardTitle>
                <CardDescription className="text-base">הוסף חברים לתכנון המשותף</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Input
                    type="email"
                    placeholder="הכנס כתובת מייל"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="text-base"
                  />
                  <Button onClick={handleShareTrip} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Share2 className="w-4 h-4 ml-2" />
                    שתף עכשיו
                  </Button>
                </div>
              </CardContent>

              {trip.shared_with && trip.shared_with.length > 0 && (
                <CardFooter className="flex-col items-start gap-3 pt-6 border-t-2 border-indigo-100 bg-gradient-to-b from-white to-indigo-50">
                  <Label className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    משותף עם ({trip.shared_with.length}):
                  </Label>
                  <div className="space-y-2 w-full">
                    {trip.shared_with.map(email => (
                      <div key={email} className="flex justify-between items-center p-3 bg-white border border-indigo-200 rounded-lg hover:shadow-md transition-shadow">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <Mail className="w-4 h-4 text-indigo-500" />
                          {email}
                        </span>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50"
                            onClick={() => handleRemoveShare(email)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardFooter>
              )}
            </Card>

            {/* Delete Trip - Only for owner */}
            {isOwner && (
              <Card className="shadow-xl border-t-4 border-red-500 mt-4">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl text-red-700">
                    <Trash2 className="w-5 h-5" />
                    מחיקת טיול
                  </CardTitle>
                  <CardDescription className="text-sm text-red-600">
                    פעולה זו תמחק את הטיול לצמיתות
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחק טיול
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הטיול "{trip?.trip_name}" לצמיתות. 
              כל הנתונים, השלבים והשיתופים יימחקו ולא ניתן יהיה לשחזר אותם.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrip}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מוחק...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  כן, מחק את הטיול
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}