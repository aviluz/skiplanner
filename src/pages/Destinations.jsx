import React, { useState, useEffect, useCallback } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Mountain,
  MapPin,
  Plane,
  Search,
  ArrowLeft,
  Snowflake,
  Route,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

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
    out[kNorm.toUpperCase()] = obj[k];
    out[kNorm.toLowerCase()] = obj[k];
  });
  return out;
};

const formatHours = (h) => {
  if (h === null || isNaN(h)) return '';
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);

  const hoursTag = `<abbr title="שעות">ש׳</abbr>`;
  const minutesTag = `<abbr title="דקות">דק׳</abbr>`;

  if (hours === 0 && minutes === 0) return 'פחות מדקה';
  if (minutes === 0) return `${hours}${hoursTag}`;
  if (hours === 0) return `${minutes}${minutesTag}`;
  return `${hours}${hoursTag} ${minutes}${minutesTag}`;
};

const parseDriveTimeToHours = (v) => {
  if (v == null) return null;
  if (typeof v === "number") return v;

  if (typeof v === "string") {
    const s = v.trim();

    // פורמט HH:MM (למשל "3:30", "0:50", "02:05")
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      const h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      if (Number.isFinite(h) && Number.isFinite(min)) {
        return h + min / 60;
      }
      return null;
    }

    // נפילה חכמה למספרים חופשיים (”2.5“, ”150 דקות“ וכו’)
    const num = s.replace(/[^\d.,-]/g, "").replace(",", ".");
    const f = parseFloat(num);
    return Number.isFinite(f) ? f : null;
  }

  return null;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showKosher, setShowKosher] = useState(false);
  const [sortBy, setSortBy] = useState("popularity");
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [siteSettings, setSiteSettings] = useState({});
  const [user, setUser] = useState(null);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  const filterDestinations = useCallback(() => {
    let filtered = [...destinations];

    if (searchTerm) {
      filtered = filtered.filter(dest =>
        dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCountry !== "all") {
      filtered = filtered.filter(dest => dest.country === selectedCountry);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(dest => dest.difficulty_level === selectedDifficulty);
    }

    if (showKosher) {
      filtered = filtered.filter(dest => dest.has_kosher_option);
    }

    // Date range filter
    if (vacationStart && vacationEnd) {
      const startDate = new Date(vacationStart);
      const endDate = new Date(vacationEnd);
      filtered = filtered.filter(dest => {
        if (!dest.season_start_date || !dest.season_end_date) return false;
        const seasonStart = new Date(dest.season_start_date);
        const seasonEnd = new Date(dest.season_end_date);
        return seasonStart <= startDate && seasonEnd >= endDate;
      });
    }

    switch (sortBy) {
      case "recommended":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "size":
        filtered.sort((a, b) => (b.total_piste_km || 0) - (a.total_piste_km || 0));
        break;
      case "elevation-high":
        filtered.sort((a, b) => (b.upper_elevation || 0) - (a.upper_elevation || 0));
        break;
      case "distance":
        filtered.sort((a, b) => {
          const ia = normalizeKey(a.nearest_airport).toUpperCase();
          const ib = normalizeKey(b.nearest_airport).toUpperCase();
          const da = toNumber(a.airport_distances?.[ia]);
          const db = toNumber(b.airport_distances?.[ib]);
          return (da ?? Number.POSITIVE_INFINITY) - (db ?? Number.POSITIVE_INFINITY);
        });
        break;
      case "price-low":
        filtered.sort((a, b) => (a.average_cost_per_night || 0) - (b.average_cost_per_night || 0));
        break;
      case "vertical-drop":
        filtered.sort((a, b) => {
          const dropA = (a.upper_elevation || 0) - (a.lower_elevation || 0);
          const dropB = (b.upper_elevation || 0) - (b.lower_elevation || 0);
          return dropB - dropA;
        });
        break;
      case "base-elevation":
        filtered.sort((a, b) => (b.lower_elevation || 0) - (a.lower_elevation || 0));
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredDestinations(filtered);
  }, [destinations, searchTerm, selectedCountry, selectedDifficulty, showKosher, sortBy, vacationStart, vacationEnd]);

  useEffect(() => {
    loadDestinations();
    loadUser();
  }, []);

  useEffect(() => {
    filterDestinations();
  }, [destinations, searchTerm, selectedCountry, selectedDifficulty, showKosher, sortBy, vacationStart, vacationEnd, filterDestinations]);

  const loadUser = async () => {
    try {
      const userData = await db.auth.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const loadDestinations = async () => {
    setLoading(true);
    try {
      const [destinationsData, settingsData] = await Promise.all([
        db.entities.SkiDestination.filter({ is_published: true }),
        db.entities.SiteSettings.list()
      ]);
      
      // נירמול אובייקטים לפני שמירתם ל-state
      const normalized = destinationsData.map((d) => {
        const nearest = normalizeKey(d.nearest_airport).toUpperCase();
        return {
          ...d,
          nearest_airport: nearest,
          airport_distances: normalizeIATAMap(d.airport_distances),
          drive_times: normalizeIATAMap(d.drive_times),
        };
      });
      setDestinations(normalized);
      
      // Debug logging
      normalized.forEach(dest => {
        const airport = dest.nearest_airport;
        const normalizedAirport = normalizeKey(airport);
        const hasDistance = dest.airport_distances && dest.airport_distances[normalizedAirport];
        const hasTime = dest.drive_times && dest.drive_times[normalizedAirport];

        if (!hasDistance || !hasTime) {
          console.warn(`⚠️ חסר מידע ביעד: ${dest.name}`, {
            nearest_airport: airport,
            normalized_airport: normalizedAirport,
            airport_distances: dest.airport_distances,
            drive_times: dest.drive_times
          });
        }
      });
      
      const settingsMap = settingsData.reduce((acc, s) => ({ ...acc, [s.setting_name]: s.value }), {});
      setSiteSettings(settingsMap);
    } catch (error) {
      console.error("Error loading destinations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCountries = () => {
    const countries = [...new Set(destinations.map(dest => dest.country))];
    return countries.sort();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "מתחילים": return "bg-green-100 text-green-800 border-green-200";
      case "בינוניים": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "מתקדמים": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const headerBackgroundUrl = siteSettings.destinations_header_background || "https://images.unsplash.com/photo-1551524164-687a55dd1126?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  return (
    <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" 
        dir="rtl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
      <style>{`
        @keyframes slowPanPanorama {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pageHeaderFadeIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-page-header {
          animation: pageHeaderFadeIn 1s ease-out forwards;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div 
          className="relative rounded-2xl overflow-hidden mb-8 p-8 md:p-12"
          style={{
            backgroundImage: `url(${headerBackgroundUrl})`,
            backgroundSize: '200% 100%',
            backgroundPosition: 'center',
            animation: 'slowPanPanorama 60s ease-in-out infinite'
          }}
        >
          <div className="absolute inset-0 bg-black/65" />
          
          <motion.div variants={itemVariants} className="text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-white/20">
              <Mountain className="w-5 h-5 text-white" />
              <span className="text-white font-medium">יעדי סקי מובחרים</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg animate-page-header">
              גלו את יעד הסקי הבא שלכם
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow">
              20+ יעדי סקי באירופה עם כל המידע שאתם צריכים לתכנון מושלם
            </p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 md:mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <div className="relative lg:col-span-2">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="חפש יעד או מדינה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-9"
                  />
                </div>

                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                    <SelectValue placeholder="בחר מדינה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-right">כל המדינות</SelectItem>
                    {getCountries().map(country => (
                      <SelectItem key={country} value={country} className="text-right">{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                    <SelectValue placeholder="רמת קושי" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-right">הכל</SelectItem>
                    <SelectItem value="מתחילים" className="text-right">מתחילים</SelectItem>
                    <SelectItem value="בינוניים" className="text-right">בינוניים</SelectItem>
                    <SelectItem value="מתקדמים" className="text-right">מתקדמים</SelectItem>
                    <SelectItem value="כל הרמות" className="text-right">כל הרמות</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date range + sort row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-end">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    תאריך תחילת חופשה
                  </Label>
                  <Input
                   type="date"
                   value={vacationStart}
                   min={new Date().toISOString().split("T")[0]}
                   onChange={(e) => setVacationStart(e.target.value)}
                   className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    תאריך סיום חופשה
                  </Label>
                  <Input
                    type="date"
                    value={vacationEnd}
                    min={vacationStart}
                    onChange={(e) => setVacationEnd(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" />
                    מיין לפי
                  </Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger dir="rtl" className="text-right [&>span]:flex-1 [&>span]:text-right [&>svg]:order-first">
                      <SelectValue placeholder="מיין לפי" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended" className="text-right">מומלץ (ברירת מחדל)</SelectItem>
                      <SelectItem value="size" className="text-right">גודל אתר (מהגדול לקטן)</SelectItem>
                      <SelectItem value="elevation-high" className="text-right">גובה אתר (מהגבוה לנמוך)</SelectItem>
                      <SelectItem value="distance" className="text-right">מרחק משדה תעופה (מהקרוב לרחוק)</SelectItem>
                      <SelectItem value="price-low" className="text-right">הזולים ביותר (מהזול ליקר)</SelectItem>
                      <SelectItem value="vertical-drop" className="text-right">הפרש גבהים (מהגבוה לנמוך)</SelectItem>
                      <SelectItem value="base-elevation" className="text-right">תחנת בסיס גבוהה (מהגבוה לנמוך)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2 space-x-reverse pl-1">
                  <Checkbox id="kosher_filter" checked={showKosher} onCheckedChange={setShowKosher} />
                  <Label
                    htmlFor="kosher_filter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    הצג רק אתרים עם אופציה לאוכל כשר
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  {vacationStart && vacationEnd && (
                    <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                      מציג יעדים פתוחים בין {new Date(vacationStart).toLocaleDateString('he-IL', {day:'2-digit',month:'2-digit'})} ל-{new Date(vacationEnd).toLocaleDateString('he-IL', {day:'2-digit',month:'2-digit'})}
                    </span>
                  )}
                  <Badge variant="outline" className="text-slate-600">
                    {filteredDestinations.length} יעדים נמצאו
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
        >
          {filteredDestinations.map((destination) => {
            // START: normalized drive data
            const primaryAirport = destination.nearest_airport;
            const rawDistance = destination.airport_distances?.[primaryAirport];
            const rawTime     = destination.drive_times?.[primaryAirport];

            const driveDistance = toNumber(rawDistance);
            const driveTimeHrs  = parseDriveTimeToHours(rawTime);

            const hasDistance = driveDistance !== null;
            const hasTime     = driveTimeHrs  !== null;
            // END: normalized drive data

            return (
            <motion.div key={destination.id} variants={itemVariants}>
              <Card
                className="group flex flex-col overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm h-full"
                onMouseEnter={() => destination.video_url && setHoveredVideo(destination.id)}
                onMouseLeave={() => setHoveredVideo(null)}
              >
                <Link to={createPageUrl(`SkiDestinationDetail?id=${destination.id}`)}>
                  <div className="relative h-48 overflow-hidden">
                    {hoveredVideo === destination.id && destination.video_url ? (
                      <video
                        src={destination.video_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                    ) : (
                      <img
                        src={destination.image_url || `https://images.unsplash.com/photo-1551524164-6cf1ac14fb50?ixlib=rb-4.0.3&w=800&h=600&fit=crop`}
                        alt={destination.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 right-4 text-right">
                      <h3 className="text-xl font-bold text-white mb-1">{destination.name}</h3>
                      <div className="flex items-center gap-2 text-white/90 justify-end">
                        <span className="text-sm">{destination.country}</span>
                         <MapPin className="w-4 h-4" />
                      </div>
                    </div>
                    <Badge
                      className={`absolute top-4 left-4 ${getDifficultyColor(destination.difficulty_level)} border pointer-events-none`}
                    >
                      {destination.difficulty_level}
                    </Badge>
                  </div>
                </Link>

                <CardContent className="p-4 md:p-6 flex flex-col flex-grow">
                  <div className="space-y-3 flex-grow">
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 min-h-[40px]">
                      {destination.description}
                    </p>

                    <div className="grid grid-cols-1 gap-3 text-sm pt-2 border-t">
                      <div className="flex items-start gap-2">
                        <div className="flex gap-3 w-full">
                          <div className="flex items-start gap-2 flex-1">
                            <Plane className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-800">שדה תעופה ראשי</div>
                              <div className="text-slate-500">{destination.nearest_airport || 'לא ידוע'}</div>
                            </div>
                          </div>
                          {destination.season_start_date && destination.season_end_date && (
                            <div className="flex items-start gap-2 flex-1">
                              <Snowflake className="w-4 h-4 text-cyan-500 mt-1 shrink-0" />
                              <div>
                                <div className="font-semibold text-slate-800">עונה</div>
                                <div className="text-slate-500">
                                  {new Date(destination.season_start_date).toLocaleDateString('he-IL', {day:'2-digit', month:'2-digit'})}
                                  {' – '}
                                  {new Date(destination.season_end_date).toLocaleDateString('he-IL', {day:'2-digit', month:'2-digit'})}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {(hasDistance || hasTime) && (
                        <div className="flex items-start gap-2 mt-1">
                          <Route className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                          <div className="flex-grow">
                            <div className="font-semibold text-slate-800">נסיעה משוערת</div>
                            <div className="text-slate-500 flex flex-wrap gap-2 items-center">
                              {hasDistance && <span>{Math.round(driveDistance)} ק״מ</span>}
                              {hasDistance && hasTime && <span>•</span>}
                              {hasTime && <span dangerouslySetInnerHTML={{ __html: formatHours(driveTimeHrs) }} />}

                            </div>
                          </div>
                        </div>
                      )}
                      {!hasDistance && !hasTime && user?.role === 'admin' && (
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-fit">
                          נתוני נסיעה חסרים (עדכון נדרש בקובץ/DB)
                        </div>
                      )}
                    </div>
                    
                    <div className="min-h-[30px]">
                      {destination.highlights && destination.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {destination.highlights.slice(0, 3).map((highlight, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                    <div className="flex gap-2 pt-4 mt-auto border-t">
                      <Link to={createPageUrl(`PlanTrip?destination=${encodeURIComponent(destination.name)}`)} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                          תכנן טיול לכאן
                          <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                      </Link>
                      {destination.website_url && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={destination.website_url} target="_blank" rel="noopener noreferrer">
                            <Mountain className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                </CardContent>
              </Card>
            </motion.div>
            );
          })}
        </motion.div>

        {filteredDestinations.length === 0 && !loading && (
          <div className="text-center py-16">
            <Snowflake className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">לא נמצאו יעדים</h3>
            <p className="text-slate-500">נסה לשנות את הפילטרים או החיפוש</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}