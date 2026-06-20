const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

import {
  Mountain,
  Home,
  ChevronLeft,
  ChevronRight,
  Plane,
  Car,
  Shield,
  Bed,
  MountainSnow,
  GraduationCap,
  BookOpen,
  User as UserIcon,
  Menu,
  X,
  Settings,
  Bot,
  CheckCircle,
  LogOut,
  UserCog,
  Star,
  Link as LinkIcon,
  Tag,
  ShieldCheck,
  Calculator,
  Sparkles,
  MessageCircle
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "sonner";
import HelpAgentPanel from "@/components/HelpAgentPanel";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import ScrollToTop from "@/components/ScrollToTop";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import VipNotificationBell from "@/components/VipNotificationBell";
import SeoHead from "@/components/SeoHead";

const navigationItems = [
  {
    title: "בית",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "ניהול הוצאות",
    url: createPageUrl("ExpenseTracker"),
    icon: Calculator,
  },
  {
    title: "יעדי סקי",
    url: createPageUrl("Destinations"),
    icon: Mountain,
  },
  {
    title: "תכנון טיול",
    url: createPageUrl("PlanTrip"),
    icon: Plane,
  },
  {
    title: "היעדים המומלצים",
    url: createPageUrl("RecommendedDestinations"),
    icon: Star
  },
  {
    title: "הטיולים שלי",
    url: createPageUrl("MyTrips"),
    icon: UserIcon,
  },
  {
    title: "דילים לציוד",
    url: createPageUrl("SkiDeals"),
    icon: Tag,
  },
  {
    title: "צ'ק ליסט ציוד",
    url: createPageUrl("Guides?tab=checklist"),
    icon: CheckCircle,
  },
  {
    title: "ביטוחים",
    url: createPageUrl("Insurances"),
    icon: Shield,
  },
  {
    title: "מדריכים",
    url: createPageUrl("Guides"),
    icon: BookOpen,
  },
  {
    title: "קישורים מומלצים",
    url: createPageUrl("RecommendedLinks"),
    icon: LinkIcon,
  },
  {
    title: "שיחה עם סוכן",
    url: createPageUrl("AgentChat"),
    icon: Bot,
  },
];

const adminNavigationItems = [
  {
    title: "פאנל ניהול",
    url: createPageUrl("AdminPanel"),
    icon: Settings,
  },
  {
    title: "בקשות VIP",
    url: createPageUrl("AdminPanel"),
    icon: Sparkles,
  },
  {
    title: "משובים",
    url: createPageUrl("AdminPanel"),
    icon: MessageCircle,
  },
];

const headerNavigationItems = [
  { title: "בית", url: createPageUrl("Home") },
  { title: "יעדי סקי", url: createPageUrl("Destinations") },
  { title: "תכנון טיול", url: createPageUrl("PlanTrip") },
  { title: "ניהול הוצאות", url: createPageUrl("ExpenseTracker"), },
  { title: "יעדים מומלצים", url: createPageUrl("RecommendedDestinations") },
  { title: "הטיולים שלי", url: createPageUrl("MyTrips") },
  { title: "דילים לציוד", url: createPageUrl("SkiDeals") },
  { title: "צ'ק ליסט", url: createPageUrl("Guides?tab=checklist") },
  { title: "ביטוחים", url: createPageUrl("Insurances") },
  { title: "קישורים מומלצים", url: createPageUrl("RecommendedLinks") },
  { title: "מדריכים", url: createPageUrl("Guides") },
  { title: "VIP", url: createPageUrl("VipForm"), isVip: true },
];

const DesktopNavLinkButton = ({ item, isCurrentPage }) => (
  <Link to={item.url}>
    <Button
      variant="ghost"
      className={`relative px-1.5 lg:px-2 xl:px-2.5 2xl:px-3.5 py-1.5 text-xs lg:text-sm xl:text-sm leading-tight h-auto min-w-0 whitespace-nowrap ${
        item.isVip 
          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 rounded-full px-3'
          : isCurrentPage(item.url)
          ? 'text-blue-600 font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-blue-600 after:rounded-full'
          : 'hover:text-blue-600'
      } transition-all`}
    >
      {item.title}
    </Button>
  </Link>
);

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [alertPurpose, setAlertPurpose] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    logoText: "SkiPlanner",
    logoImageUrl: "",
    vipEmail: "skiplanner4u@gmail.com",
    footerLegalDocs: [],
    seoTitles: {},
    seoDescriptions: {},
    googleVerification: ""
  });
  const [loading, setLoading] = useState(true);
  const navRef = React.useRef(null);
  const [hasScrollHintPlayed, setHasScrollHintPlayed] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState({ left: false, right: false });

  useEffect(() => {
    // Scroll hint animation - plays once on mount
    if (navRef.current && !hasScrollHintPlayed) {
      setTimeout(() => {
        if (navRef.current) {
          const { scrollWidth, clientWidth } = navRef.current;
          // Only animate if there's content to scroll
          if (scrollWidth > clientWidth) {
            navRef.current.scrollBy({ left: -80, behavior: 'smooth' });
            setTimeout(() => {
              navRef.current?.scrollBy({ left: 80, behavior: 'smooth' });
              setHasScrollHintPlayed(true);
            }, 800);
          }
        }
      }, 1500);
    }
  }, [hasScrollHintPlayed]);

  useEffect(() => {
    const checkScroll = () => {
      if (navRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
        const isOverflowing = scrollWidth > clientWidth;
        
        if (!isOverflowing) {
          setShowScrollHint({ right: false, left: false });
          return;
        }
        
        // For RTL: check if at start (right side) or scrolled (left side visible)
        const atStart = scrollLeft >= 0 || scrollLeft > -10;
        const atEnd = Math.abs(scrollLeft) >= (scrollWidth - clientWidth - 10);
        
        setShowScrollHint({
          right: !atEnd, // יש תוכן מוסתר מימין (בהתחלה)
          left: !atStart // יש תוכן מוסתר משמאל (גללנו)
        });
      }
    };

    const nav = navRef.current;
    if (nav) {
      checkScroll();
      nav.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        nav.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [userData, settingsData, legalDocs] = await Promise.all([
          db.auth.me().catch(() => null),
          db.entities.SiteSettings.list(),
          db.entities.LegalDocument.filter({ is_active: true, show_in_footer: true }).catch(() => [])
        ]);
        
        setUser(userData);
        
        const settingsMap = settingsData.reduce((acc, s) => ({ ...acc, [s.setting_name]: s.value }), {});
        const sortedDocs = (legalDocs || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        setSiteSettings(prev => ({
          ...prev,
          logoText: settingsMap.logo_text || "SkiPlanner",
          logoImageUrl: settingsMap.logo_image_url || "",
          whatsappSupport: settingsMap.whatsapp_support || "",
          vipEmail: settingsMap.vip_email || "SkiPlanner4u@gmail.com",
          accessibilityButtonLink: settingsMap.accessibility_button_link || "",
          footerLegalDocs: sortedDocs,
          seoTitles: {
            Home: settingsMap.seo_home_title || "",
            Destinations: settingsMap.seo_destinations_title || "",
            PlanTrip: settingsMap.seo_plantrip_title || "",
            Guides: settingsMap.seo_guides_title || "",
            Insurances: settingsMap.seo_insurances_title || "",
          },
          seoDescriptions: {
            Home: settingsMap.seo_home_description || "",
            Destinations: settingsMap.seo_destinations_description || "",
            PlanTrip: settingsMap.seo_plantrip_description || "",
            Guides: settingsMap.seo_guides_description || "",
            Insurances: settingsMap.seo_insurances_description || "",
          },
          googleVerification: settingsMap.google_site_verification || "",
        }));
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleLogout = async () => {
    try {
      await db.auth.logout();
      setUser(null);
      window.location.href = createPageUrl("Home");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const showPlanningAlert = (purpose) => {
    if (!user) {
      setAlertPurpose(purpose);
      setShowAlert(true);
      return false;
    }
    return true;
  };

  const handleOpenHelpPanel = () => {
    if (user) {
      setIsHelpPanelOpen(true);
    } else {
      setAlertPurpose('helpAgent');
      setShowAlert(true);
    }
  };

  const openVipEmail = () => {
    const email = siteSettings.vipEmail || "vip@skiplan.com";
    const subject = encodeURIComponent("בקשה לשדרוג לחבילת VIP");
    const body = encodeURIComponent(
      "שלום,\n\nאני מעוניין/ת לקבל פרטים על שירות ה-VIP לתכנון חופשת סקי.\n\nתודה!"
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isMobile) {
      const w = window.open(gmailUrl, "_blank");
      if (!w || w.closed || typeof w.closed == 'undefined') { // Check if window was blocked
        window.location.href = mailtoUrl;
      }
    } else {
      window.location.href = mailtoUrl;
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(prev => {
      const newState = !prev;
      console.log("Menu toggle - new state:", newState);
      return newState;
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const whatsappNumberOrLink = siteSettings.whatsappSupport;
  const finalWhatsappHref = whatsappNumberOrLink
    ? (whatsappNumberOrLink.startsWith('http') ? whatsappNumberOrLink : `https://wa.me/${whatsappNumberOrLink}`)
    : '#';
    
  const vipMailto = `mailto:${siteSettings.vipEmail}?subject=בקשה לשדרוג לחבילת VIP&body=שלום,%0D%0A%0D%0Aאני מעוניין/ת לקבל פרטים על שירות ה-VIP לתכנון חופשת סקי.%0D%0A%0D%0Aתודה!`;

  const isCurrentPage = (url) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const urlParts = url.split('?');
    const urlPath = urlParts[0];
    const urlQuery = urlParts[1] || '';
    
    if (urlQuery) {
      return (currentPath + currentSearch) === url;
    }
    return currentPath === urlPath && !currentSearch;
  };

  const handleLoginClick = () => {
    db.auth.redirectToLogin();
  };

  const currentYear = new Date().getFullYear();

  const currentSeoTitle = siteSettings.seoTitles?.[currentPageName] || "";
  const currentSeoDescription = siteSettings.seoDescriptions?.[currentPageName] || "";

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <SeoHead
        title={currentSeoTitle || undefined}
        description={currentSeoDescription || undefined}
        googleVerification={siteSettings.googleVerification || undefined}
      />
      <style>{`
        @keyframes scrollHint {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes slideInFromRight {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-10%);
          }
        }
        
        .animate-slide-in-right {
          animation: slideInFromRight 0.3s ease-out forwards;
        }
        
        @keyframes panRightToLeft {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 0%;
          }
        }
        
        .animate-pan-slow {
          animation: panRightToLeft 60s ease-in-out infinite alternate;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes pageHeaderEntry {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-page-header {
          animation: pageHeaderEntry 0.6s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes kineticZoom {
          0% {
            transform: scale(1) translateX(0);
          }
          100% {
            transform: scale(1.1) translateX(-5%);
          }
        }
      `}</style>
      
      <ScrollToTop />
      <ExitIntentPopup />
      <Toaster position="top-center" richColors duration={4000} />
      
      <header className="bg-white/95 backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 z-[100]">
        <div className="w-full px-2 sm:px-4 py-3 flex flex-nowrap justify-between items-center gap-x-1 xl:gap-x-1.5">
          <Link to={createPageUrl("Home")} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {siteSettings.logoImageUrl ? (
              <img 
                src={siteSettings.logoImageUrl} 
                alt={siteSettings.logoText}
                className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide the broken image
                  e.target.nextElementSibling?.classList?.remove('hidden'); // Show the Mountain icon
                }}
              />
            ) : null}
            <Mountain className={`h-6 w-6 sm:h-8 sm:w-8 text-blue-500 ${siteSettings.logoImageUrl ? 'hidden' : ''}`} />
            <span className="text-lg sm:text-2xl font-bold text-slate-800 whitespace-nowrap">{siteSettings.logoText}</span>
          </Link>

          <div className="hidden lg:block relative flex-1 min-w-0">
            <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/95 to-transparent pointer-events-none z-10 transition-opacity ${showScrollHint.right ? 'opacity-100' : 'opacity-60'}`} />
            <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/95 to-transparent pointer-events-none z-10 transition-opacity ${showScrollHint.left ? 'opacity-100' : 'opacity-60'}`} />
            {showScrollHint.right && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-pulse pointer-events-none z-20">
                <ChevronRight className="w-5 h-5 drop-shadow-lg" />
              </div>
            )}
            {showScrollHint.left && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 animate-pulse pointer-events-none z-20">
                <ChevronLeft className="w-5 h-5 drop-shadow-lg" />
              </div>
            )}
            <nav ref={navRef} className="flex items-center gap-0.5 xl:gap-1 2xl:gap-2 overflow-x-auto scrollbar-hide px-10">
              {headerNavigationItems.map((item) => (
                <DesktopNavLinkButton key={item.title} item={item} isCurrentPage={isCurrentPage} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user?.role === 'admin' && <VipNotificationBell user={user} />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 max-w-[120px] sm:max-w-none">
                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate hidden sm:inline">{user.full_name || user.email}</span>
                    <span className="truncate sm:hidden">{(user.full_name || user.email).split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Profile")} className="cursor-pointer">
                      <UserCog className="w-4 h-4 ml-2" />
                      פרופיל
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("MyTrips")} className="cursor-pointer">
                      <Plane className="w-4 h-4 ml-2" />
                      הטיולים שלי
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AdminPanel")} className="cursor-pointer">
                          <Settings className="w-4 h-4 ml-2" />
                          פאנל ניהול
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AdminPanel")} className="cursor-pointer">
                          <Sparkles className="w-4 h-4 ml-2" />
                          בקשות VIP
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AdminPanel")} className="cursor-pointer">
                          <MessageCircle className="w-4 h-4 ml-2" />
                          משובים
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4 ml-2" />
                    התנתק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleLoginClick} className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
                <span className="hidden sm:inline">התחבר / הירשם</span>
                <span className="sm:hidden">התחבר</span>
              </Button>
            )}

            <button
              className="lg:hidden block p-2 hover:bg-slate-100 rounded-lg transition-colors z-[9999] relative flex-shrink-0"
              onClick={handleMobileMenuToggle}
              aria-label="פתח תפריט"
              type="button"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-[9998]" 
            style={{ top: '64px' }}
            onClick={closeMobileMenu}
          />
          
          {/* Sidebar */}
          <div 
            className="lg:hidden fixed top-[64px] right-0 bottom-0 w-80 bg-white shadow-2xl z-[9999] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <ScrollArea className="flex-1 h-full">
              <nav className="p-4 text-right pb-20">
                <ul className="space-y-2">
                  {!user && (
                    <li className="mb-4">
                      <Button onClick={handleLoginClick} className="w-full">
                        התחבר / הירשם
                      </Button>
                    </li>
                  )}
                  
                  {user && (
                    <li className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-slate-800">{user.full_name || user.email}</span>
                      </div>
                      <Link to={createPageUrl("Profile")} onClick={closeMobileMenu}>
                        <Button variant="outline" size="sm" className="w-full">
                          <UserCog className="w-4 h-4 ml-2" />
                          הפרופיל שלי
                        </Button>
                      </Link>
                    </li>
                  )}
                  
                  {navigationItems.map((item) => {
                    const currentPath = location.pathname;
                    const currentSearch = location.search;
                    const currentFullPath = currentPath + currentSearch;
                    
                    const itemUrlParts = item.url.split('?');
                    const itemPath = itemUrlParts[0];
                    const itemQuery = itemUrlParts[1] || '';
                    
                    let isCurrentPage = false;
                    
                    if (itemQuery) {
                      isCurrentPage = currentFullPath === item.url;
                    } else {
                      isCurrentPage = currentPath === itemPath && !currentSearch;
                    }
                    
                    return (
                      <li key={item.title}>
                        <Link
                          to={item.url}
                          onClick={(e) => {
                            let shouldPrevent = false;
                            if (item.title === "שיחה עם סוכן") {
                              if (!showPlanningAlert('agentChat')) shouldPrevent = true;
                            }
                            
                            if (shouldPrevent) {
                              e.preventDefault();
                            } else {
                              closeMobileMenu();
                            }
                          }}
                          className={`flex flex-row-reverse items-center justify-between gap-3 p-3 rounded-lg transition-colors text-right ${
                            isCurrentPage
                              ? "bg-blue-500 text-white"
                              : "text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span className="flex-grow">{item.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {user && user.role === 'admin' && (
                    <>
                      <li className="pt-4 mt-4 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 mb-2 pr-3">ניהול</p>
                      </li>
                      {adminNavigationItems.map((item) => {
                        const currentPath = location.pathname;
                        const currentSearch = location.search;
                        const currentFullPath = currentPath + currentSearch;
                        
                        const itemUrlParts = item.url.split('?');
                        const itemPath = itemUrlParts[0];
                        const itemQuery = itemUrlParts[1] || '';
                        
                        let isCurrentPage = false;
                        
                        if (itemQuery) {
                          isCurrentPage = currentFullPath === item.url;
                        } else {
                          isCurrentPage = currentPath === itemPath && !currentSearch;
                        }
                        
                        return (
                          <li key={item.title}>
                            <Link
                              to={item.url}
                              onClick={closeMobileMenu}
                              className={`flex flex-row-reverse items-center justify-between gap-3 p-3 rounded-lg transition-colors text-right ${
                                isCurrentPage
                                  ? "bg-blue-500 text-white"
                                  : "text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              <item.icon className="w-5 h-5 shrink-0" />
                              <span className="flex-grow">{item.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </>
                  )}
                  {user && (
                    <li className="pt-4 mt-4 border-t border-slate-200">
                      <Button onClick={handleLogout} variant="outline" className="w-full text-red-600">
                        התנתק
                      </Button>
                    </li>
                  )}
                </ul>
              </nav>
            </ScrollArea>
          </div>
        </>
      )}

      <main className="pt-16">
        {children}
      </main>
      <ExitIntentPopup />

      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3">
           <a
            href={finalWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
            aria-label="צור קשר בוואטסאפ"
          >
            <WhatsAppIcon className="w-6 h-6" />
          </a>
          <button
            onClick={handleOpenHelpPanel}
            className="bg-cyan-500 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105"
            aria-label="פתח סוכן AI לעזרה"
          >
             <Bot className="w-6 h-6" />
          </button>
      </div>

      <HelpAgentPanel isOpen={isHelpPanelOpen} onClose={() => setIsHelpPanelOpen(false)} user={user}/>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>נדרשת התחברות</AlertDialogTitle>
            <AlertDialogDescription>
              {alertPurpose === 'helpAgent' 
                ? "כדי להשתמש בסוכן העזרה החכם, עליך להתחבר או להירשם." 
                : alertPurpose === 'agentChat'
                ? "שיחה ישירה עם סוכן בינה מלאכותית זמינה רק למשתמשים מחוברים. אנא התחבר/י לחשבון כדי לפתוח צ'אט עם הסוכן."
                : "כדי להתחיל לתכנן את חופשת הסקי שלך, עליך להתחבר או להירשם."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAlert(false)}>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginClick}>התחבר / הירשם</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="bg-slate-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-right">
            <div>
              <h3 className="font-bold text-lg mb-4">{siteSettings.logoText || "SkiPlanner"}</h3>
              <p className="text-slate-300 text-sm">
                המדריך המושלם שלך לתכנון חופשת סקי בלתי נשכחת
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">קישורים מהירים</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to={createPageUrl("Destinations")} className="text-slate-300 hover:text-white transition-colors">
                    יעדי סקי
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Guides")} className="text-slate-300 hover:text-white transition-colors">
                    מדריכים
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("RecommendedLinks")} className="text-slate-300 hover:text-white transition-colors">
                    קישורים מומלצים
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">יצירת קשר</h4>
              <ul className="space-y-2 text-sm">
                {whatsappNumberOrLink && (
                  <li>
                    <a href={finalWhatsappHref} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
                      תמיכה בוואטסאפ
                    </a>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={openVipEmail}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    שירות VIP
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm text-slate-400">
            <div className="flex justify-center gap-4 mb-4 flex-wrap">
              <Link to={createPageUrl("About")} className="hover:text-white transition-colors">
                אודות
              </Link>
              <Link to={createPageUrl("TermsOfUse")} className="hover:text-white transition-colors">
                תנאי שימוש
              </Link>
              <Link to={createPageUrl("AccessibilityStatement")} className="hover:text-white transition-colors">
                הצהרת נגישות
              </Link>
              {siteSettings.footerLegalDocs?.map(doc => (
                <Link 
                  key={doc.id} 
                  to={createPageUrl(`LegalDocument?id=${doc.id}`)} 
                  className="hover:text-white transition-colors"
                >
                  {doc.document_name}
                </Link>
              ))}
              {siteSettings.accessibilityButtonLink && (
                <a href={siteSettings.accessibilityButtonLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  נגישות
                </a>
              )}
            </div>
            <p>© {currentYear} {siteSettings.logoText || "SkiPlanner"} — כל הזכויות שמורות | Ma-Aluz בניית אתרים</p>
          </div>
        </div>
        <meta name="google-site-verification" content="9Ft7-CKhme3wzO4oB060rOsrxsFEx2h6ctc0aLiXWxA" />
      </footer>
    </div>
  );
}