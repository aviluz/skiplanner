import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { weatherCodeMap, getDefaultWeather } from "@/components/weather/data";
import { Thermometer, Wind, Snowflake, AlertTriangle, Share, Sparkle, X, CloudSun } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Label } from "@/components/ui/label";

// Helper function to generate a mock AI summary
const generateAiSummaryText = (forecast, weatherCodeMap, resortName) => {
  if (!forecast || !forecast.daily || !forecast.processed) return "לא ניתן ליצור סיכום AI ללא נתוני תחזית.";

  const daily = forecast.daily;
  const processed = forecast.processed;
  const daysCount = daily.time.length;

  let summary = `✨ תקציר AI עבור אתר ${resortName} לשבוע הקרוב:\n\n`;

  // Overall conditions