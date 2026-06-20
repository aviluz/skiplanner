import React from "react";
import WeatherForecast from "@/components/WeatherForecast";
import { resortsData } from "@/components/weather/data";

export default function AutoWeatherForecast({ resortName }) {
  if (!resortName) return null;

  // מוצא יעד לפי שם – כולל altNames
  const resort = resortsData.find(r =>
    r.resort.toLowerCase() === resortName.toLowerCase() ||
    r.altNames?.some(a => a.toLowerCase() === resortName.toLowerCase())
  );

  if (!resort) {
    return (
      <div className="p-4 text-slate-500 text-center text-sm">
        תחזית מזג האוויר לא זמינה ליעד זה כרגע.
      </div>
    );
  }

  // הגובה הנמוך ביותר
  const lowestHeight = resort.heights?.[0];

  return (
    <WeatherForecast
      resorts={[resort]}
      defaultCountry={resort.country}
      defaultResort={resort.resort}
      defaultHeight={lowestHeight}
      days={7}
      hideLocationSelectors={true}
    />
  );
}