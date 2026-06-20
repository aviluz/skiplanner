import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

// אפקט עומק – כמו בקוד שלך
const MAX_EFFECT_DISTANCE_PX = 400;
const MAX_SCALE = 1.05;
const MIN_SCALE = 0.92;
const MIN_OPACITY = 0.75;

export default function FeaturedDestinationsSlider({
  destinations = [],
  onScrollChange,
}) {
  const scrollRef = useRef(null);
  const tickingRef = useRef(false);

  const validDestinations = (destinations || []).filter(
    (d) => d && d.id && typeof d.name === "string"
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [cardStyles, setCardStyles] = useState({});

  // גלילה עם חיצים
  const scrollByCard = (dir = 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    el.scrollBy({
      left: dir * (cardWidth + 24),
      behavior: "smooth",
    });
  };

  // אפקט עומק
  const updateDynamicStyles = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;

    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) {
        tickingRef.current = false;
        return;
      }

      const cards = Array.from(el.querySelectorAll("[data-card]"));
      if (!cards.length) {
        tickingRef.current = false;
        return;
      }

      const containerRect = el.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      const newStyles = {};
      let bestDist = Infinity;
      let bestIndex = 0;

      cards.forEach((cardEl, idx) => {
        const dest = validDestinations[idx];
        if (!dest) return;

        const rect = cardEl.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(containerCenter - cardCenter);

        if (distance < bestDist) {
          bestDist = distance;
          bestIndex = idx;
        }

        const normalized = Math.min(1, distance / MAX_EFFECT_DISTANCE_PX);
        const scale = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * normalized;
        const opacity = 1 - (1 - MIN_OPACITY) * normalized;

        newStyles[dest.id] = { scale, opacity };
      });

      setActiveIndex(bestIndex);
      setCardStyles(newStyles);

      tickingRef.current = false;
    });
  }, [validDestinations]);

  // רישום מאזינים ל-scroll + effect
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateDynamicStyles();

    const scrollHandler = () => updateDynamicStyles();

    el.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      el.removeEventListener("scroll", scrollHandler);
    };
  }, [updateDynamicStyles]);

  if (!validDestinations.length) return null;

  return (
    <div className="relative" dir="rtl">
      {/* חץ שמאלה */}
      <button
        onClick={() => scrollByCard(-1)}
        className="hidden md:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-white/70 shadow-xl hover:bg-white transition-all"
      >
        <ArrowRight className="w-5 h-5 text-slate-800" />
      </button>

      {/* חץ ימינה */}
      <button
        onClick={() => scrollByCard(1)}
        className="hidden md:flex  items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-white/70 shadow-xl hover:bg-white transition-all p-0 leading-none"
      >
        <ArrowLeft className="w-5 h-5 text-slate-800" />
      </button>

      {/* מסילת קלפים */}
      <div
        ref={scrollRef}
        className="
          flex gap-6 px-4 py-4
          overflow-x-auto overflow-y-auto
          snap-x snap-mandatory
          scroll-smooth
          scrollbar-none
          touch-pan-x touch-pan-y
        "
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>

        {validDestinations.map((destination) => {
          const styleForCard =
            cardStyles[destination.id] || {
              scale: MIN_SCALE,
              opacity: 1,
            };

          return (
            <motion.div
              key={destination.id}
              data-card
              className="
                relative snap-center shrink-0
                w-[80%] sm:w-[60%] md:w-[340px] lg:w-[380px]
                rounded-3xl overflow-hidden
                bg-slate-900/80 text-white
                border border-white/10
              "
              animate={{
                scale: styleForCard.scale,
                opacity: styleForCard.opacity,
              }}
              transition={{ duration: 0.35 }}
            >
              <img
                src={
                  destination.image_url ||
                  'https://images.unsplash.com/photo-1551524164-6cf1ac14fb50?auto=format&fit=crop&w=1200&q=80'
                }
                alt={destination.name}
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <div className="relative z-10 flex flex-col justify-end h-[260px] p-5 pt-14 text-right">
                <h3 className="text-2xl font-extrabold mb-2">
                  {destination.name}
                </h3>

                <p className="text-white/80 text-sm line-clamp-2 mb-3 min-h-[40px]">
                  {destination.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to={createPageUrl(`SkiDestinationDetail?id=${destination.id}`)}
                    className="flex-1"
                  >
                    <button className="w-full rounded-xl bg-white/90 text-slate-900 font-semibold text-sm py-2.5">
                      פרטים על היעד
                    </button>
                  </Link>

                  <Link
                    to={createPageUrl(`PlanTrip?destination=${destination.name}`)}
                    className="flex-1"
                  >
                    <button className="w-full rounded-xl bg-blue-600 text-white font-semibold text-sm py-2.5">
                      תכנן חופשה כאן
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* נקודות – לפי הכרטיסים האמיתיים בלבד */}
      <div className="flex md:hidden justify-center gap-2 mt-4">
        {validDestinations.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === activeIndex ? "bg-slate-800" : "bg-slate-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
