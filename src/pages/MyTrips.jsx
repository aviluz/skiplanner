const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Users, Calendar, Mountain, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TripCard = ({ trip, destination }) => {
  // Safety checks
  if (!trip || !trip.id || !trip.trip_name) {
    return null;
  }

  const safeDestination = destination && typeof destination === 'object' ? destination : null;
  const hasValidDestination = safeDestination && safeDestination.name && safeDestination.country;

  return (
    <Link to={createPageUrl(`TripDetails?id=${trip.id}`)}>
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col overflow-hidden relative group">
        {safeDestination?.image_url && (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ 
                backgroundImage: `url(${safeDestination.image_url})`,
                filter: 'brightness(0.7)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        )}
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-white drop-shadow-lg">{trip.trip_name}</CardTitle>
          {hasValidDestination && (
            <CardDescription className="flex items-center gap-2 pt-2 text-white/90 drop-shadow">
              <Mountain className="w-4 h-4" /> {safeDestination.name}, {safeDestination.country}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between relative z-10">
          <div>
            {trip.departure_date && trip.return_date && (
              <div className="flex items-center text-sm text-white/90 mb-2 drop-shadow">
                <Calendar className="w-4 h-4 ml-2" />
                {format(new Date(trip.departure_date), 'dd MMMM yyyy', { locale: he })} - {format(new Date(trip.return_date), 'dd MMMM yyyy', { locale: he })}
              </div>
            )}
            {trip.participants && (
              <div className="flex items-center text-sm text-white/90 drop-shadow">
                <Users className="w-4 h-4 ml-2" />
                {trip.participants} משתתפים
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white text-slate-800 border-0">
                  לפרטי הטיול <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function MyTrips() {
  const [user, setUser] = useState(null);
  const [myTrips, setMyTrips] = useState([]);
  const [sharedTrips, setSharedTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = await db.auth.me().catch(() => null);
      setUser(currentUser);
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const [allTrips, destinationsData] = await Promise.all([
        db.entities.TripPlan.list(),
        db.entities.SkiDestination.list()
      ]);
      
      // Comprehensive filtering - remove any null, undefined, or invalid trips
      // RLS already filters to show only trips user has access to (created_by OR shared_with)
      const validTrips = (allTrips || []).filter(trip => 
        trip && 
        typeof trip === 'object' && 
        trip.id && 
        trip.trip_name
      );
      
      // Separate into trips I own (first in created_by_group) vs trips shared with me
      // RLS already handles the access control, we just categorize here
      const userTrips = validTrips.filter(trip => 
        trip.created_by === currentUser.email ||
        (Array.isArray(trip.created_by_group) && trip.created_by_group[0] === currentUser.email)
      );
      const tripsSharedWithUser = validTrips.filter(trip => 
        trip.created_by !== currentUser.email &&
        !(Array.isArray(trip.created_by_group) && trip.created_by_group[0] === currentUser.email)
      );

      // Comprehensive filtering for destinations
      const validDestinations = (destinationsData || []).filter(d => 
        d && 
        typeof d === 'object' && 
        d.id && 
        typeof d.name === 'string' && 
        d.name.length > 0
      );

      setMyTrips(userTrips);
      setSharedTrips(tripsSharedWithUser);
      setDestinations(validDestinations);
    } catch (error) {
      console.error("Error fetching trips:", error);
      setError(error);
      setUser(null);
      setMyTrips([]);
      setSharedTrips([]);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create destinationMap only from valid, filtered destinations
  const destinationMap = destinations
    .filter(dest => dest && dest.id && dest.name) // Extra safety check
    .reduce((acc, dest) => {
      acc[dest.id] = dest;
      return acc;
    }, {});

  const handleLoginClick = () => {
    db.auth.redirectToLogin();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">טוען את הטיולים שלך...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
        <div className="max-w-3xl mx-auto mt-12">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">שגיאה בטעינת הנתונים</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">אירעה שגיאה בעת טעינת הטיולים שלך.</p>
              <p className="text-sm text-slate-600 mb-3">
                {error.message || 'שגיאת רשת - אנא בדוק את החיבור לאינטרנט או נסה שוב מאוחר יותר.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={fetchData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  נסה שוב
                </Button>
                <Link to={createPageUrl('Home')}>
                  <Button variant="outline" size="sm">
                    חזור לדף הבית
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center" dir="rtl">
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <Mountain className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
              הטיולים שלי
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              כדי שתוכל/י לתכנן חופשת סקי, לשמור ולצפות בטיולים שיצרת, עליך להתחבר או להירשם לאתר
            </p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <Button 
              onClick={handleLoginClick} 
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-6"
            >
              התחבר / הירשם
            </Button>
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-3 text-center">למה כדאי להירשם?</p>

                <ul className="space-y-2 text-sm text-slate-600 text-right" dir="rtl">
                  <li className="text-right">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 align-middle"></span>
                    <span> שמירת כל הטיולים שלך במקום אחד</span>
                  </li>
                  <li className="text-right">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 align-middle"></span>
                    <span>  מעקב אחר התקדמות התכנון</span>
                  </li>
                  <li className="text-right">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 align-middle"></span>
                    <span> סנכרון בין מכשירים</span>
                  </li>
                  <li className="text-right">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 align-middle"></span>
                    <span> שמירה ומעקב אחר הצ'ק ליסט האישי שלכם</span>
                  </li>
                </ul>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-slate-50 p-4 md:p-8" 
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 animate-page-header">הטיולים שלי</h1>
          <Link to={createPageUrl('PlanTrip')}>
            <Button>
              <Plus className="w-5 h-5 ml-2" />
              תכנן טיול חדש
            </Button>
          </Link>
        </motion.div>

        {myTrips.length === 0 && sharedTrips.length === 0 ? (
          <motion.div 
            className="text-center py-20 bg-white rounded-lg shadow"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold text-slate-700">עדיין לא תכננת טיולים</h2>
            <p className="text-slate-500 mt-2">לחץ על "תכנן טיול חדש" כדי להתחיל.</p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {myTrips.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">טיולים שיצרתי</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myTrips.map(trip => (
                            <TripCard 
                              key={trip.id} 
                              trip={trip} 
                              destination={trip.destination_id && destinationMap[trip.destination_id] ? destinationMap[trip.destination_id] : null} 
                            />
                        ))}
                    </div>
                </motion.div>
            )}
            
            {sharedTrips.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">טיולים ששותפו איתי</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sharedTrips.map(trip => (
                            <TripCard 
                              key={trip.id} 
                              trip={trip} 
                              destination={trip.destination_id && destinationMap[trip.destination_id] ? destinationMap[trip.destination_id] : null} 
                            />
                        ))}
                    </div>
                </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}