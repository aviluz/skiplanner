const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mountain,
  Plane,
  Car,
  Shield,
  Bed,
  MountainSnow,
  GraduationCap,
  Star,
  CheckCircle,
  ArrowLeft,
  Users,
  Globe,
  Award,
  Mail,
  Gem,
  MapPin,
  Wallet,
  CalendarCheck,
  Compass,
  ShoppingBag,
  CheckSquare,
  ShieldCheck,
  BookOpen,
  MessageSquarePlus
} from "lucide-react";

import Snowfall from "@/components/Snowfall";
import FeaturedDestinationsSlider from "@/components/FeaturedDestinationsSlider";
import { motion } from "framer-motion";
import TestimonialForm from "@/components/testimonials/TestimonialForm";
import TestimonialCard from "@/components/testimonials/TestimonialCard";
import FaqSection from "@/components/FaqSection";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const stats = [
  { number: "20+", label: "יעדי סקי", icon: Mountain },
  { number: "500+", label: "טיולים שתוכננו", icon: Users },
  { number: "6", label: "מדינות", icon: Globe },
  { number: "4.9", label: "דירוג ממוצע", icon: Award }
];

export default function Home() {
  const [siteSettings, setSiteSettings] = useState({
    vipSectionBackground: ''
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const [isTestimonialFormOpen, setIsTestimonialFormOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsData, destinationsData, userData] = await Promise.all([
          db.entities.SiteSettings.list(),
          db.entities.SkiDestination.list(),
          db.auth.me().catch(() => null),
        ]);

        let testimonialsData = [];
        try {
          testimonialsData = await db.entities.Testimonial.filter({ status: 'approved' });
        } catch (e) {
          console.warn("Could not load testimonials:", e);
        }
        
        setUser(userData);
        
        const settingsMap = settingsData.reduce((acc, s) => ({ ...acc, [s.setting_name]: s.value }), {});
        
        const heroImage = settingsMap.home_background_image || "https://images.unsplash.com/photo-1551524164-6cf1ac14fb50?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
        
        // תמונת רקע ליעדים מומלצים - עם fallback
        const featuredBg = settingsMap.featured_destinations_background || 
                          settingsMap.destinations_header_background || 
                          "https://images.unsplash.com/photo-1551524164-6cf1ac14fb50?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
        
        setSiteSettings(prev => ({
          ...prev,
          heroBackground: heroImage,
          featuredDestinationsBackground: featuredBg,
          vipSectionBackground: settingsMap.vip_section_background || '',
          vipEmail: settingsMap.vip_email || "vip@skiplan.com",
          accessibilityButtonLink: settingsMap.accessibility_button_link || "",
          logoText: settingsMap.logo_text || "SkiPlanner"
        }));

        // Filter featured destinations
        const featured = destinationsData.filter(dest => dest.is_featured === true);
        setFeaturedDestinations(featured);
        
        // Sort testimonials by display_order, then by approved_at
        const sortedTestimonials = (testimonialsData || []).sort((a, b) => {
          if (a.display_order !== undefined && b.display_order !== undefined) {
            return a.display_order - b.display_order;
          }
          if (a.display_order !== undefined) return -1;
          if (b.display_order !== undefined) return 1;
          return new Date(b.approved_at || b.created_date) - new Date(a.approved_at || a.created_date);
        });
        
        setTestimonials(sortedTestimonials);

        const img = new Image();
        img.onload = () => setImageLoaded(true);
        img.onerror = () => setImageLoaded(true);
        img.src = heroImage;

      } catch (error) {
        console.error('Failed to load initial data:', error);
        setImageLoaded(true);
        setSiteSettings({
          heroBackground: "https://images.unsplash.com/photo-1551524164-6cf1ac14fb50?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          featuredDestinationsBackground: "https://images.unsplash.com/photo-1551524164-6cf1ac14fb50?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          vipEmail: "vip@skiplan.com",
          accessibilityButtonLink: "",
          logoText: "SkiPlanner"
        });
      }
    };
    fetchSettings();
  }, []);
  
  const handleOpenTestimonialForm = () => {
    if (user) {
      setIsTestimonialFormOpen(true);
    } else {
      setShowLoginAlert(true);
    }
  };
  
  const handleLoginClick = () => {
    db.auth.redirectToLogin(createPageUrl("Home") + "?openTestimonial=true");
  };
  
  // Check if user came back after login wanting to add testimonial
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openTestimonial') === 'true' && user) {
      setIsTestimonialFormOpen(true);
      // Clean URL
      window.history.replaceState({}, '', createPageUrl("Home"));
    }
  }, [user]);

  // פונקציה שמקבלת עדכון על מיקום הגלילה מהקרוסלה
  const handleScrollChange = (scrollData) => {
    // נזיז את הרקע בכיוון ההפוך, באיטיות (20% מהתזוזה)
    // scrollProgress הוא בין 0 ל-1
    const isMobile = window.innerWidth < 768;
    const maxParallaxShift = isMobile ? 30 : 100; // מקסימום 100 פיקסלים תזוזה,במובייל נזיז רק 30px
    const offset = scrollData.scrollProgress * maxParallaxShift;
    setParallaxOffset(offset);
  };

  return (
    <motion.div 
        className="relative"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
      <style>{`
        @keyframes kineticZoom {
          0% {
            transform: scale(1) translateX(0);
          }
          100% {
            transform: scale(1.1) translateX(-5%);
          }
        }
      `}</style>
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${siteSettings.heroBackground})`,
            animation: imageLoaded ? 'kineticZoom 8s ease-out forwards' : 'none'
          }} 
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
        <Snowfall />

        {imageLoaded && (
          <motion.div 
            className="relative z-20 text-center px-4 md:px-6 max-w-5xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <Mountain className="w-5 h-5 text-white" />
              <span className="text-white font-medium">לחסוך זמן, לחסוך כסף | {siteSettings.logoText || "SkiPlanner"} </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
             תכנן את חופשת הסקי שלך
              <span className="block text-blue-300">בפשטות ובקלות</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              תכנן את החופשה המושלמת שלך באופן עצמאי ב-7 שלבים פשוטים.
              <br />
             חסוך זמן, חסוך כסף - עם המערכת החכמה והחינמית שלנו!
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to={createPageUrl("PlanTrip")}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                  התחל לתכנן עכשיו
                  <ArrowLeft className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                </Button>
              </Link>

              <Link to={createPageUrl("VipForm")}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                  תנו לנו לתכנן בשבילכם
                  <Star className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                </Button>
              </Link>

              <Link to={createPageUrl("Destinations")}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg backdrop-blur-sm bg-white/10 transition-all duration-300 w-full sm:w-auto"
                >
                  גלה יעדי סקי
                  <Mountain className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className="text-center backdrop-blur-sm bg-white/10 rounded-xl p-3 md:p-4"
                >
                  <stat.icon className="w-5 md:w-6 h-5 md:h-6 text-blue-300 mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold text-white">{stat.number}</div>
                  <div className="text-xs md:text-sm text-blue-200">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* VIP Service Intro Section */}
      <motion.section 
        className="relative py-12 md:py-16 px-4 md:px-6 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {siteSettings.vipSectionBackground ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${siteSettings.vipSectionBackground})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-50" />
        )}
        
        <motion.div variants={itemVariants} className="max-w-4xl mx-auto relative z-10">
          <Card className={`border-0 shadow-2xl overflow-hidden ${siteSettings.vipSectionBackground ? 'bg-white/10 backdrop-blur-md' : 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm'}`}>
            <CardContent className="p-8 md:p-12 text-center">
              <div className="mb-6">
                <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${siteSettings.vipSectionBackground ? 'text-white drop-shadow-lg' : 'text-slate-800'}`}>
                  לא בא לכם להתעסק עם תכנון החופשה?
                </h2>
                <p className={`text-xl md:text-2xl font-medium mb-2 ${siteSettings.vipSectionBackground ? 'text-white/95 drop-shadow' : 'text-slate-700'}`}>
                  אפשר גם אחרת.
                </p>
                <p className={`text-lg ${siteSettings.vipSectionBackground ? 'text-white/90 drop-shadow' : 'text-slate-600'}`}>
                  תכנון אישי מלא על ידי מומחי סקי - חוסך זמן, טעויות וכאב ראש
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 text-right">
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${siteSettings.vipSectionBackground ? 'bg-white/20 backdrop-blur-sm border-white/30' : 'bg-white/60 backdrop-blur-sm border-blue-100'}`}>
                  <CheckCircle className={`w-6 h-6 shrink-0 mt-0.5 ${siteSettings.vipSectionBackground ? 'text-white' : 'text-blue-600'}`} />
                  <p className={`font-medium ${siteSettings.vipSectionBackground ? 'text-white/95' : 'text-slate-700'}`}>תכנון אישי מלא לפי הצרכים שלכם</p>
                </div>
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${siteSettings.vipSectionBackground ? 'bg-white/20 backdrop-blur-sm border-white/30' : 'bg-white/60 backdrop-blur-sm border-blue-100'}`}>
                  <CheckCircle className={`w-6 h-6 shrink-0 mt-0.5 ${siteSettings.vipSectionBackground ? 'text-white' : 'text-blue-600'}`} />
                  <p className={`font-medium ${siteSettings.vipSectionBackground ? 'text-white/95' : 'text-slate-700'}`}>חוסך טעויות, זמן וכאב ראש</p>
                </div>
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${siteSettings.vipSectionBackground ? 'bg-white/20 backdrop-blur-sm border-white/30' : 'bg-white/60 backdrop-blur-sm border-blue-100'}`}>
                  <CheckCircle className={`w-6 h-6 shrink-0 mt-0.5 ${siteSettings.vipSectionBackground ? 'text-white' : 'text-blue-600'}`} />
                  <p className={`font-medium ${siteSettings.vipSectionBackground ? 'text-white/95' : 'text-slate-700'}`}>ליווי של מומחי סקי מהשלב הראשון</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Link to={createPageUrl("VipForm")} className="w-full md:w-auto">
                  <Button 
                    size="lg" 
                    className={`w-full md:w-auto font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all ${
                      siteSettings.vipSectionBackground 
                        ? 'bg-white/95 hover:bg-white text-pink-600 hover:text-pink-700' 
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                    }`}
                  >
                    <Gem className="w-5 h-5 ml-2" />
                    לתכנון חופשה בשירות VIP
                  </Button>
                </Link>
                <p className={`text-xs ${siteSettings.vipSectionBackground ? 'text-white/80' : 'text-slate-500'}`}>
                  שירות בתשלום | פנייה ללא התחייבות
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Featured Destinations Section */}
        {featuredDestinations.length > 0 && (
        <motion.section
          className="relative py-16 md:py-20 px-4 md:px-6 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* ===== רקע פרלקס / טשטוש ===== */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0, position: "absolute" }}
          >
            {/* שכבת תמונה / פרלקס */}
            <div
              className="absolute top-0 left-1/2 h-full transition-transform duration-100 ease-out"
              style={{
                width: "140vw",
                backgroundImage: `url(${siteSettings.featuredDestinationsBackground})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                filter: "blur(1px)", // פחות כהה
                transform: "translateX(-50%) scale(1.1)",
                //transform:`translateX(calc(-50% - ${parallaxOffset}px)) scale(1.1)`, זה גורם לתמונה לזוז ברקע
              }}
            />

            {/* שכבת עדינות מעל התמונה - לא אטומה מדי */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.35) 100%)",
              }}
            />
          </div>

          {/* ===== התוכן (כותרת + קרוסלה) ===== */}
          <div
            className="relative max-w-7xl mx-auto"
            style={{ position: "relative", zIndex: 10 }} // הכי חשוב!
          >
            <motion.div
              variants={itemVariants}
                className="text-center mb-12 md:mb-16 flex flex-col items-center"
            >
              {/* הבדג' הצהוב  
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow" />
                <span className="text-white font-medium">יעדים מומלצים</span>
              </div>*/}
              {/* בלוק זכוכית עדין לכותרת + תיאור */}
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl px-4 py-4 md:px-6 md:py-5 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                  אתרי סקי מומלצים
                </h2>

                <p className="text-lg md:text-xl text-slate-800/90 leading-relaxed">
                  היעדים הטובים ביותר עבורכם - נבחרו בקפידה על ידי גולשי סקי מנוסים
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <FeaturedDestinationsSlider
                destinations={featuredDestinations}
                onScrollChange={handleScrollChange}
              />
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Mobile Navigation Grid - Only on Mobile */}
      <section className="md:hidden px-4 py-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("Destinations")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] "> 
              <MapPin className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">יעדי סקי</span>
            </div>
          </Link>

          <Link to={createPageUrl("ExpenseTracker")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] ">
              <Wallet className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">ניהול הוצאות</span>
            </div>
          </Link>

          <Link to={createPageUrl("MyTrips")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] ">
              <CalendarCheck className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">הטיולים שלי</span>
            </div>
          </Link>

          <Link to={createPageUrl("RecommendedDestinations")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] ">
              <Compass className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">יעדים מומלצים</span>
            </div>
          </Link>

          <Link to={createPageUrl("SkiDeals")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] ">
              <ShoppingBag className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">דילים לציוד</span>
            </div>
          </Link>

          <Link to={createPageUrl("Guides?tab=checklist")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] ">
              <CheckSquare className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">צ'ק ליסט</span>
            </div>
          </Link>

          <Link to={createPageUrl("Insurances")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] ">
              <ShieldCheck className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">ביטוחים</span>
            </div>
          </Link>

          <Link to={createPageUrl("Guides")}>
            <div className=" rounded-2xl  p-4  flex flex-col items-center justify-center text-center bg-slate-100/60  backdrop-blur-md  border border-sky-200 shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] ">
              <BookOpen className="w-6 h-6 mb-1 text-sky-700" />
              <span className="text-sm font-medium text-slate-800">מדריכים</span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="py-16 md:py-20 px-4 md:px-6 bg-gradient-to-r from-blue-600 to-indigo-700"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={itemVariants} className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            מוכנים לחופשת הסקי שלכם?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            הצטרפו לעשרות הישראלים שכבר תכננו חופשת סקי מושלמת איתנו
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("PlanTrip")}>
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
              >
                תתחיל לתכנן עכשיו - בחינם!
                <CheckCircle className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-blue-200 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />
              <span>ללא עלות נסתרת</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />
              <span>תכנון ב-5 דקות</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />
              <span>חסכון עד 40%</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* VIP Section */}
      <motion.section 
        className="py-16 md:py-20 px-4 md:px-6 bg-slate-800 text-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={itemVariants} className="max-w-4xl mx-auto text-center">
          <Gem className="w-10 md:w-12 h-10 md:h-12 text-pink-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">רוצים חופשה ברמה אחרת?</h2>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            שדרגו לשירות ה-VIP שלנו וקבלו תכנון אישי מא' ועד ת' על ידי מומחי הסקי שלנו.
            נדאג לכם לכל פרט, מהטיסות ועד האטרקציות הכי שוות.
          </p>
          <p className="text-xs text-slate-400 mt-[-10px] mb-4">
            *הצעת המחיר הינה חינמית לחלוטין
          </p>
          <Link to={createPageUrl("VipForm")}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              שדרגו לחבילת VIP
              <Gem className="w-4 md:w-5 h-4 md:h-5 mr-2" />
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-16 md:py-20 px-4 md:px-6 bg-gradient-to-br from-blue-50 to-indigo-100"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12 md:mb-16">
            <div className="text-center sm:text-right">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">מה אומרים עלינו</h2>
              <p className="text-lg md:text-xl text-slate-600">
                עשרות לקוחות מרוצים כבר תכננו איתנו
              </p>
            </div>
            <Button 
              onClick={handleOpenTestimonialForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-6 py-6 text-base whitespace-nowrap"
            >
              <MessageSquarePlus className="w-5 h-5" />
              <span className="hidden sm:inline">שתף את ההמלצה שלך</span>
              <span className="sm:hidden">הוסף המלצה</span>
            </Button>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">אין עדיין המלצות להצגה</p>
              <p className="text-sm mt-2">היו הראשונים לשתף את החוויה שלכם!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id || index}>
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      <FaqSection page="home" />

      {/* Feedback Section */}
      <motion.div 
        className="py-16 md:py-20 bg-slate-50"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={itemVariants} className="max-w-4xl mx-auto text-center px-4 md:px-6">
          <Mail className="w-10 md:w-12 h-10 md:h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-4">יש לכם רעיון או הצעה לשיפור?</h2>
          <p className="text-base md:text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            אנחנו תמיד שמחים לשמוע מהמשתמשים שלנו. אם יש לכם רעיון לפיצ'ר חדש, הצעה לשיפור, או שנתקלתם בבעיה - נשמח אם תשתפו אותנו.
          </p>
          <Link to={createPageUrl("Feedback")}>
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto">
              כתבו לנו משוב
            </Button>
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Testimonial Form Dialog */}
      <TestimonialForm 
        isOpen={isTestimonialFormOpen} 
        onClose={() => setIsTestimonialFormOpen(false)} 
      />
      
      {/* Login Required Alert */}
      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>נדרשת התחברות</AlertDialogTitle>
            <AlertDialogDescription>
              כדי לכתוב המלצה יש להתחבר לאתר. לאחר ההתחברות תוכל לשתף את ההמלצה שלך.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLoginAlert(false)}>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginClick}>התחבר</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}