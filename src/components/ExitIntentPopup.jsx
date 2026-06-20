import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // בדיקה אם כבר הוצג בסשן הזה
    if (sessionStorage.getItem("exitIntentShown")) return;

    // זיהוי כשהעכבר עוזב את החלון למעלה (לכיוון הטאבים/X)
    function handleMouseLeave(e) {
      // רק אם העכבר יצא דרך החלק העליון של החלון
      if (e.clientY <= 0) {
        triggerExitPopup();
      }
    }

    // זיהוי מעבר לטאב אחר
    function handleVisibilityChange() {
      // כשהמשתמש עובר לטאב אחר
      if (document.hidden) {
        triggerExitPopup();
      }
    }

    function triggerExitPopup() {
      if (sessionStorage.getItem("exitIntentShown")) return;
      
      sessionStorage.setItem("exitIntentShown", "true");
      setShow(true);

      // ניקוי מאזינים
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }

    // הוספת מאזינים
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
        onClick={() => setShow(false)}
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setShow(false)}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              רגע לפני שאתה עוזב...
            </h2>
            <p className="text-slate-600 leading-relaxed">
              נשמח לשמוע למה אתה עוזב עכשיו את האתר.
              <br />
              המשוב שלך יעזור לנו לשפר את החוויה.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Link to={createPageUrl("Feedback")} className="block">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 ml-2" />
                מעבר לטופס המשוב
              </Button>
            </Link>
            
            <Button
              onClick={() => setShow(false)}
              variant="outline"
              size="lg"
              className="w-full"
            >
              סגור
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}