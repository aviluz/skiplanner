import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BookOpen,
  Newspaper,
  CheckCircle,
  Play,
  CloudSun,
  Star,
  Shield,
  ChevronDown,
  FileText,
} from "lucide-react";

const MAIN_LINKS = [
  { title: "המדריך לחופשת סקי", url: createPageUrl("Guides"), icon: BookOpen },
  { title: "מאמרים וסקירות", url: createPageUrl("Articles"), icon: Newspaper },
  { title: "צ'ק ליסט ציוד", url: createPageUrl("Guides?tab=checklist"), icon: CheckCircle },
  { title: "הכנה לחופשה", url: createPageUrl("Guides?tab=preparation"), icon: Play },
  { title: "מזג אוויר באתרי סקי", url: createPageUrl("Guides?tab=weather"), icon: CloudSun },
  { title: "טיפים", url: createPageUrl("Guides?tab=tips"), icon: Star },
  { title: "בטיחות", url: createPageUrl("Guides?tab=safety"), icon: Shield },
];

// זמן השהיה לסגירה — ארוך מספיק כדי לאפשר מעבר חלק בין הכפתור לפאנל מבלי להרוס את ה-DOM.
const CLOSE_DELAY = 350;

export default function GuidesContentDropdown({ menuArticles = [], isCurrentPage }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const contentId = "guides-content-dropdown";

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleOpen = () => {
    cancelClose();
    setOpen(true);
  };

  const scheduleClose = (delay = CLOSE_DELAY) => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), delay);
  };

  const handleClick = () => {
    cancelClose();
    setOpen((prev) => !prev);
  };

  // סגירה ב-Escape ובלחיצה מחוץ לקונטיינר — פעיל רק כשפתוח
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        cancelClose();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        cancelClose();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // ניקוי הטיימר בעת unmount
  useEffect(() => () => cancelClose(), []);

  // סגירה כשהפוקוס עוזב את הקונטיינר (ניווט מקלדת)
  const handleBlur = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      cancelClose();
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-shrink-0"
      onPointerEnter={handleOpen}
      onPointerLeave={() => scheduleClose()}
      onBlur={handleBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={contentId}
        className="relative px-1.5 lg:px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs lg:text-sm xl:text-sm leading-tight h-auto min-w-0 whitespace-nowrap font-medium text-slate-700 hover:text-blue-600 transition-all rounded-md inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        מדריכים ותוכן
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* הפאנל נשאר תמיד ב-DOM ונשלט בנראות בלבד — מונע הריסה/בנייה מחדש ואת ההבהוב בגבול הכפתור↔פאנל */}
      <div
        className={`absolute top-full right-0 z-[200] pt-1 transition-opacity duration-150 ${
          open ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"
        }`}
        onPointerEnter={handleOpen}
        onPointerLeave={() => scheduleClose()}
      >
        <div
          id={contentId}
          className="w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2 text-right"
        >
          <ul className="space-y-0.5">
            {MAIN_LINKS.map((link) => {
              const active = isCurrentPage?.(link.url);
              return (
                <li key={link.title}>
                  <Link
                    to={link.url}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 justify-end text-right w-full px-2 py-1.5 rounded-md hover:bg-blue-50 transition-colors text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className={active ? "text-blue-600 font-semibold" : ""}>{link.title}</span>
                    <link.icon className={`w-4 h-4 shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                  </Link>
                </li>
              );
            })}
          </ul>

          {menuArticles.length > 0 && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <p className="text-xs text-slate-400 px-2 py-1">מאמרים נבחרים</p>
              <ul className="space-y-0.5">
                {menuArticles.map((art) => (
                  <li key={art.id || art.url}>
                    <Link
                      to={art.url}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 justify-end text-right w-full px-2 py-1.5 rounded-md hover:bg-blue-50 transition-colors text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span className="truncate">{art.title}</span>
                      <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}