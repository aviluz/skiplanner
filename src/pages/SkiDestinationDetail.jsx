const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SkiDestination, Review, SkiSchool, KosherPlace } from "@/entities/all";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MapPin,
  Plane,
  TrendingUp,
  Calendar,
  ArrowLeft,
  DollarSign,
  Mountain,
  Route,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Loader2,
  GraduationCap,
  Globe,
  ExternalLink,
  User as UserIcon,
  Play,
  MountainSnow,
  Utensils,
  Phone,
  Navigation,
  Bed
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;

  // If it's just an ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Regular YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*?v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

// Format distance function
function formatDistance(value) {
  if (value === undefined || value === null) return "";

  let str = String(value).trim();

  // already contains ק"מ or קמ
  if (/ק\"?מ$/.test(str)) {
    return str;
  }

  // contains km or KM
  if (/km$/i.test(str)) {
    return str.replace(/km$/i, 'ק"מ');
  }

  // numeric only
  if (!isNaN(str)) {
    return `${str} ק"מ`;
  }

  return str;
}

// Format Drive Time function
function formatDriveTime(value) {
  if (value === undefined || value === null) return "";

  let str = String(value).trim();

  // אם כבר כולל "שעה" / "שעות" → להשאיר כמו שהוא
  if (str.includes("שעה")) return str;

  // אם זה מספר בלבד → להוסיף "שעות"
  if (!isNaN(str)) {
    return `${str} שעות`;
  }

  // אחרת להשאיר
  return str;
}

const StarRating = ({ rating, onChange, readonly = false }) => {
  return (
    <div className="flex gap-1 shrink-0" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          className={`${
            readonly ? "cursor-default" : "cursor-pointer"
          } transition-colors`}
        >
          <Star
            className={`w-6 h-6 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewItem = ({ review }) => {
  const displayName =
    review.user_nickname || review.user_full_name || "משתמש אנונימי";
  const avatarInitial = displayName.charAt(0);

  return (
    <div className="p-6 mb-4 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-start md:items-center gap-4 mb-4 flex-wrap md:flex-nowrap">
        <Avatar className="w-12 h-12 shrink-0">
          <AvatarImage
            src={review?.user_profile_image_url}
            alt={displayName}
          />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
            {avatarInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-grow">
          <p className="font-bold text-slate-800 text-lg">{displayName}</p>
          {review?.user_ski_level && (
            <Badge
              variant="outline"
              className="text-xs w-fit mt-1 bg-blue-50 text-blue-700 border-blue-200"
            >
              {review.user_ski_level}
            </Badge>
          )}
        </div>
        <div className="text-left shrink-0">
          <p className="text-xs text-gray-400 mb-1">דירוג כללי</p>
          <StarRating rating={review.general_rating} readonly />
        </div>
      </div>

      {review.comment && (
        <p className="text-slate-600 mb-4 leading-relaxed bg-slate-50 p-4 rounded-lg italic border-r-4 border-blue-500">
          "{review.comment}"
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {review.pros && review.pros.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-slate-800">אהב/ה</h4>
            </div>
            <ul className="space-y-2">
              {review.pros.map((pro, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="text-green-600 font-bold">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}

        {review.cons && review.cons.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-slate-800">פחות אהב/ה</h4>
            </div>
            <ul className="space-y-2">
              {review.cons.map((con, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="text-red-600 font-bold">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
        {review.beginner_rating && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-green-700 font-semibold mb-1">
              דירוג למתחילים
            </p>
            <StarRating rating={review.beginner_rating} readonly />
          </div>
        )}
        {review.advanced_rating && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700 font-semibold mb-1">
              דירוג למתקדמים
            </p>
            <StarRating rating={review.advanced_rating} readonly />
          </div>
        )}
      </div>
    </div>
  );
};

const PisteVisualization = ({ blueKm, redKm, blackKm, totalKm }) => {
  if (!totalKm || totalKm === 0) return null;

  const bluePercent = (blueKm / totalKm) * 100;
  const redPercent = (redKm / totalKm) * 100;
  const blackPercent = (blackKm / totalKm) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">התפלגות מסלולים</span>
        <span className="text-slate-500">{totalKm} ק"מ סה"כ</span>
      </div>

      <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-500 to-blue-400 transition-all duration-500"
          style={{ width: `${bluePercent}%` }}
        />
        <div
          className="absolute top-0 h-full bg-gradient-to-l from-red-500 to-red-400 transition-all duration-500"
          style={{ right: `${bluePercent}%`, width: `${redPercent}%` }}
        />
        <div
          className="absolute top-0 h-full bg-gradient-to-l from-gray-800 to-gray-700 transition-all duration-500"
          style={{ right: `${bluePercent + redPercent}%`, width: `${blackPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <div>
            <div className="font-semibold text-slate-700">כחול</div>
            <div className="text-slate-500">
              {blueKm} ק"מ ({Math.round(bluePercent)}%)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div>
            <div className="font-semibold text-slate-700">אדום</div>
            <div className="text-slate-500">
              {redKm} ק"מ ({Math.round(redPercent)}%)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-800" />
          <div>
            <div className="font-semibold text-slate-700">שחור</div>
            <div className="text-slate-500">
              {blackKm} ק"מ ({Math.round(blackPercent)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SkiDestinationDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const destinationId = urlParams.get("id");

  const [destination, setDestination] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [skiSchools, setSkiSchools] = useState([]);
  const [kosherPlaces, setKosherPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    general_rating: 0,
    beginner_rating: 0,
    advanced_rating: 0,
    pros: ["", "", ""],
    cons: ["", "", ""],
    comment: "",
    user_nickname: "",
    user_ski_level: "",
    user_profile_image_url: ""
  });

  useEffect(() => {
    loadDestinationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationId]);

  const loadDestinationData = async () => {
    setLoading(true);
    try {
      const [destData, reviewsData, currentUser, schoolsData, kosherPlacesData] =
        await Promise.all([
          SkiDestination.filter({ id: destinationId }),
          Review.filter({ destination_id: destinationId, status: "approved" }),
          db.auth.me().catch(() => null),
          SkiSchool.list(),
          KosherPlace.filter({ destination_id: destinationId, is_visible: true })
        ]);

      if (destData.length > 0) {
        setDestination(destData[0]);
        setReviews(reviewsData);
        setUser(currentUser);

        const relatedSchools = schoolsData.filter(
          (school) => school.destination_name === destData[0].name
        );
        setSkiSchools(relatedSchools);
        setKosherPlaces(kosherPlacesData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

        if (currentUser && !reviewForm.user_nickname) {
          setReviewForm((prev) => ({
            ...prev,
            user_nickname: currentUser.nickname || "",
            user_ski_level: currentUser.skiing_level || "",
            user_profile_image_url: currentUser.profile_image_url || ""
          }));
        }
      }
    } catch (error) {
      console.error("Error loading destination:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      await db.auth.redirectToLogin();
      return;
    }

    if (reviewForm.general_rating === 0) {
      toast.error("אנא בחר דירוג כללי");
      return;
    }

    setSubmittingReview(true);

    try {
      const prosFiltered = reviewForm.pros.filter((p) => p.trim() !== "");
      const consFiltered = reviewForm.cons.filter((c) => c.trim() !== "");

      const currentUserNickname =
        reviewForm.user_nickname || user.nickname || user.full_name;
      const currentUserSkiLevel =
        reviewForm.user_ski_level || user.skiing_level || "";
      const currentUserProfileImage =
        reviewForm.user_profile_image_url || user.profile_image_url || "";

      if (reviewForm.user_nickname && reviewForm.user_nickname !== user.nickname) {
        await db.auth.updateMe({ nickname: reviewForm.user_nickname });
      }
      if (
        reviewForm.user_ski_level &&
        reviewForm.user_ski_level !== user.skiing_level
      ) {
        await db.auth.updateMe({ skiing_level: reviewForm.user_ski_level });
      }

      await Review.create({
        destination_id: destinationId,
        general_rating: reviewForm.general_rating,
        beginner_rating: reviewForm.beginner_rating || 0,
        advanced_rating: reviewForm.advanced_rating || 0,
        pros: prosFiltered,
        cons: consFiltered,
        comment: reviewForm.comment.trim(),
        status: "pending",
        user_nickname: currentUserNickname,
        user_ski_level: currentUserSkiLevel,
        user_profile_image_url: currentUserProfileImage,
        user_full_name: user.full_name
      });

      toast.success("הביקורת נשלחה לאישור!");
      setShowReviewForm(false);
      setReviewForm({
        general_rating: 0,
        beginner_rating: 0,
        advanced_rating: 0,
        pros: ["", "", ""],
        cons: ["", "", ""],
        comment: "",
        user_nickname: currentUserNickname,
        user_ski_level: currentUserSkiLevel,
        user_profile_image_url: currentUserProfileImage
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("שגיאה בשליחת הביקורת");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">יעד לא נמצא</h2>
        <Link to={createPageUrl("Destinations")}>
          <Button className="mt-4">חזור ליעדים</Button>
        </Link>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.general_rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  const youtubeVideoId = getYouTubeVideoId(destination.youtube_url);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <Link to={createPageUrl("Destinations")}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזרה ליעדים
          </Button>
        </Link>

        <div className="relative h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl">
          {destination.video_url ? (
            <video
              src={destination.video_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={destination.image_url}
              alt={destination.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-right">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              {destination.name}
            </h1>
            <div className="flex items-center gap-2 md:gap-3 text-white/90 text-sm md:text-lg justify-end">
              <span>{destination.country}</span>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 md:gap-4 mt-3 md:mt-4 justify-end flex-wrap">
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-white/30 text-xs md:text-sm px-2 md:px-3 py-1 cursor-default hover:bg-white/20">
                {destination.difficulty_level}
              </Badge>
              {destination.has_kosher_option && (
                <Badge className="bg-green-500/80 text-white backdrop-blur-sm border-green-400/50 text-xs md:text-sm px-2 md:px-3 py-1 cursor-default hover:bg-green-500/80">
                  אופציה לאוכל כשר
                </Badge>
              )}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 bg-yellow-500/80 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-400/50 cursor-default">
                  <Star className="w-4 h-4 text-white fill-white" />
                  <span className="text-white font-semibold">
                    {averageRating}
                  </span>
                  <span className="text-white/80 text-sm">
                    ({reviews.length} ביקורות)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8">
          <div className="space-y-6 md:space-y-8">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="w-6 h-6 text-blue-600" />
                  תיאור
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  {destination.description}
                </p>
                {destination.highlights && destination.highlights.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      נקודות מרכזיות:
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {destination.highlights.map((highlight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                          <span className="text-slate-600">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* מידע מהיר */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>מידע מהיר</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {destination.season_start_date && destination.season_end_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">עונה</p>
                      <p className="font-semibold text-slate-800">
                        {new Date(
                          destination.season_start_date
                        ).toLocaleDateString("he-IL", {
                          month: "short",
                          day: "numeric"
                        })}{" "}
                        -{" "}
                        {new Date(
                          destination.season_end_date
                        ).toLocaleDateString("he-IL", {
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {destination.nearest_airport && (
                  <div className="flex items-start gap-3">
                    <Plane className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">שדה תעופה ראשי</p>
                      <p className="font-semibold text-slate-800 flex gap-2">
                        {destination.nearest_airport}
                        {destination.airport_distances?.[
                          destination.nearest_airport
                        ] && (
                          <>
                            <span>-</span>
                            <span className="text-slate-700">
                              {formatDistance(
                                destination.airport_distances[
                                  destination.nearest_airport
                                ]
                              )}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {destination.drive_times?.[destination.nearest_airport] && (
                  <div className="flex items-start gap-3">
                    <Route className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">
                        זמן נסיעה משוער
                      </p>
                      <p className="font-semibold text-slate-800">
                        {formatDriveTime(
                          destination.drive_times[destination.nearest_airport]
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {destination.lower_elevation > 0 &&
                  destination.upper_elevation && (
                    <div className="flex items-start gap-3">
                      <Mountain className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">גובה</p>
                        <p className="font-semibold text-slate-800">
                          {destination.lower_elevation} -{" "}
                          {destination.upper_elevation} מ'
                        </p>
                      </div>
                    </div>
                  )}

                {destination.total_piste_km && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="w-full">
                      <PisteVisualization
                        blueKm={destination.blue_piste_km || 0}
                        redKm={destination.red_piste_km || 0}
                        blackKm={destination.black_piste_km || 0}
                        totalKm={destination.total_piste_km}
                      />
                    </div>
                  </div>
                )}

                {destination.average_cost_per_night && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">
                        עלות ממוצעת ללילה
                      </p>
                      <p className="font-semibold text-slate-800">
                        €{destination.average_cost_per_night}
                      </p>
                    </div>
                  </div>
                )}

                {destination.ski_pass_price && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">
                        מחיר סקי-פס יומי
                      </p>
                      <p className="font-semibold text-slate-800">
                        €{destination.ski_pass_price}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-2 border-t">
                  {(() => {
                    const searchName = destination.name_en || destination.name;
                    const airbnbUrl = `https://www.airbnb.com/s/${encodeURIComponent(searchName)}/homes`;
                    return (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={airbnbUrl} target="_blank" rel="noopener noreferrer">
                          <Bed className="w-4 h-4 ml-2" />
                          חפש לינה ב-Airbnb
                        </a>
                      </Button>
                    );
                  })()}
                  <Link
                    to={createPageUrl(
                      `PlanTrip?destination=${encodeURIComponent(
                        destination.name
                      )}`
                    )}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                      תכנן טיול לכאן
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("VipForm")}>
                    <Button variant="outline" className="w-full border-pink-500 text-pink-700 hover:bg-pink-50">
                      קבל ליווי אישי ליעד הזה – VIP
                    </Button>
                  </Link>
                  {destination.website_url && (
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={destination.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="w-4 h-4 ml-2" />
                        אתר רשמי
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* YouTube Video Card */}
            {youtubeVideoId && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-6 h-6 text-red-600" />
                    סרטון על היעד
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      title={`סרטון על ${destination.name}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* תחזית מזג אויר */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MountainSnow className="w-6 h-6 text-blue-600" />
                  תחזית מזג אויר
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={createPageUrl(
                    `Guides?tab=weather&resort=${encodeURIComponent(
                      destination.name
                    )}`
                  )}
                >
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-5 text-lg">
                    <MountainSnow className="w-5 h-5 ml-2" />
                    צפה בתחזית המלאה
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* מצלמת לייב */}
            {destination.live_cam_embed_url && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-6 h-6 text-purple-600" />
                    מצלמת לייב מהאתר
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-slate-100">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={destination.live_cam_embed_url}
                      title={`מצלמת לייב - ${destination.name}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}
              
            {/* בתי ספר לסקי */}
            {skiSchools.length > 0 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                    בתי ספר לסקי ומדריכים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skiSchools.map((school) => (
                    <div
                      key={school.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <h4 className="font-bold text-slate-800 mb-2">
                        {school.school_name}
                      </h4>
                      {school.instructor_name && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <UserIcon className="w-4 h-4" />
                          <span>מדריך: {school.instructor_name}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {school.booking_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={school.booking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 ml-2" />
                              הזמנה
                            </a>
                          </Button>
                        )}
                        {school.whatsapp_contact && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 hover:bg-green-100"
                            asChild
                          >
                            <a
                              href={school.whatsapp_contact}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-4 h-4 ml-2" />
                              וואטסאפ
                            </a>
                          </Button>
                        )}
                      </div>
                      {school.notes && (
                        <p className="text-sm text-slate-500 mt-2 italic">
                          {school.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* כשרות ואוכל */}
            {destination.has_kosher_option && kosherPlaces.length > 0 && (
              <Card className="border-0 shadow-xl bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Utensils className="w-6 h-6" />
                    כשרות ואוכל
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kosherPlaces.map((place) => {
                    const whatsappMessage = destination.kosher_whatsapp_message || "היי, הגעתי אליכם דרך אתר SkiPlanner.co.il";
                    const whatsappLink = place.whatsapp_number 
                      ? `https://wa.me/${place.whatsapp_number}?text=${encodeURIComponent(whatsappMessage)}`
                      : null;

                    return (
                      <div key={place.id} className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                        <div className="mb-3">
                          <h4 className="font-bold text-slate-800 text-lg">{place.name}</h4>
                          {place.type && place.type.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {place.type.map((t, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-800 border-green-300">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {place.address && (
                          <p className="text-sm text-slate-600 mb-2">{place.address}</p>
                        )}

                        {place.kashrut_supervision && (
                          <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded inline-block mb-2">
                            כשרות: {place.kashrut_supervision}
                          </p>
                        )}

                        {place.open_on_shabbat && place.open_on_shabbat !== 'לא ידוע' && (
                          <div className="text-sm text-slate-700 mb-2">
                            <span className="font-medium">שבת:</span> {place.open_on_shabbat === 'כן' ? '✓ פתוח/פעיל' : '✗ סגור'}
                            {place.shabbat_options && place.shabbat_options.length > 0 && (
                              <span className="text-slate-600"> • {place.shabbat_options.join(', ')}</span>
                            )}
                          </div>
                        )}

                        {place.shabbat_notes && (
                          <p className="text-xs text-slate-500 italic mb-2">{place.shabbat_notes}</p>
                        )}

                        {place.notes && (
                          <p className="text-sm text-slate-600 mb-3">{place.notes}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          {place.google_maps_link && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={place.google_maps_link} target="_blank" rel="noopener noreferrer">
                                <Navigation className="w-4 h-4 ml-1" />
                                ניווט
                              </a>
                            </Button>
                          )}
                          {place.phone && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`tel:${place.phone}`}>
                                <Phone className="w-4 h-4 ml-1" />
                                התקשר
                              </a>
                            </Button>
                          )}
                          {whatsappLink && (
                            <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100" asChild>
                              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="w-4 h-4 ml-1" />
                                וואטסאפ
                              </a>
                            </Button>
                          )}
                          {place.website_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={place.website_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 ml-1" />
                                אתר
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-slate-500 text-center mt-4 pt-4 border-t">
                    יש לוודא הכשר וזמינות מול המקום לפני ההגעה
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ביקורות */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    ביקורות ({reviews.length})
                  </CardTitle>
                  {user && (
                    <Button
                      onClick={() => setShowReviewForm((prev) => !prev)}
                    >
                      {showReviewForm ? "ביטול" : "כתוב ביקורת"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showReviewForm && (
                  <form
                    onSubmit={handleSubmitReview}
                    className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg"
                  >
                    <h3 className="text-xl font-bold text-slate-800 mb-6">
                      שתף את החוויה שלך
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor="user_nickname">
                          כינוי להצגה (אופציונלי)
                        </Label>
                        <Input
                          id="user_nickname"
                          value={reviewForm.user_nickname}
                          onChange={(e) =>
                            setReviewForm({
                              ...reviewForm,
                              user_nickname: e.target.value
                            })
                          }
                          placeholder={
                            user.nickname ||
                            user.full_name ||
                            "השם שיוצג"
                          }
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          אם לא תמלא, יוצג השם המלא שלך
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="user_ski_level">
                          רמת הגלישה שלך
                        </Label>
                        <Select
                          value={reviewForm.user_ski_level}
                          onValueChange={(val) =>
                            setReviewForm({
                              ...reviewForm,
                              user_ski_level: val
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר רמה" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="מתחיל">מתחיל</SelectItem>
                            <SelectItem value="בינוני">בינוני</SelectItem>
                            <SelectItem value="מתקדם">מתקדם</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label>דירוג כללי *</Label>
                        <StarRating
                          rating={reviewForm.general_rating}
                          onChange={(rating) =>
                            setReviewForm({
                              ...reviewForm,
                              general_rating: rating
                            })
                          }
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>דירוג למתחילים (אופציונלי)</Label>
                          <StarRating
                            rating={reviewForm.beginner_rating}
                            onChange={(rating) =>
                              setReviewForm({
                                ...reviewForm,
                                beginner_rating: rating
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>דירוג למתקדמים (אופציונלי)</Label>
                          <StarRating
                            rating={reviewForm.advanced_rating}
                            onChange={(rating) =>
                              setReviewForm({
                                ...reviewForm,
                                advanced_rating: rating
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 text-green-700">
                          <ThumbsUp className="w-4 h-4" />
                          3 דברים שאהבת (אופציונלי)
                        </Label>
                        {reviewForm.pros.map((pro, idx) => (
                          <Input
                            key={idx}
                            value={pro}
                            onChange={(e) => {
                              const newPros = [...reviewForm.pros];
                              newPros[idx] = e.target.value;
                              setReviewForm({
                                ...reviewForm,
                                pros: newPros
                              });
                            }}
                            placeholder={`דבר ${idx + 1}...`}
                            className="mt-2"
                          />
                        ))}
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 text-red-700">
                          <ThumbsDown className="w-4 h-4" />
                          3 דברים שפחות אהבת (אופציונלי)
                        </Label>
                        {reviewForm.cons.map((con, idx) => (
                          <Input
                            key={idx}
                            value={con}
                            onChange={(e) => {
                              const newCons = [...reviewForm.cons];
                              newCons[idx] = e.target.value;
                              setReviewForm({
                                ...reviewForm,
                                cons: newCons
                              });
                            }}
                            placeholder={`דבר ${idx + 1}...`}
                            className="mt-2"
                          />
                        ))}
                      </div>

                      <div>
                        <Label htmlFor="comment">
                          תגובה חופשית (אופציונלי)
                        </Label>
                        <Textarea
                          id="comment"
                          value={reviewForm.comment}
                          onChange={(e) =>
                            setReviewForm({
                              ...reviewForm,
                              comment: e.target.value
                            })
                          }
                          placeholder="שתף את החוויה המלאה שלך..."
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full mt-6"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          שולח...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 ml-2" />
                          שלח ביקורת
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {!user && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-slate-700">
                      רוצה לשתף את החוויה שלך?{" "}
                      <button
                        onClick={() => db.auth.redirectToLogin()}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        התחבר כדי לכתוב ביקורת
                      </button>
                    </p>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewItem key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>עדיין אין ביקורות ליעד זה</p>
                    <p className="text-sm mt-1">היה הראשון לשתף את החוויה שלך!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}