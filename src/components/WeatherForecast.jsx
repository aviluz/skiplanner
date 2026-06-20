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
  const snowDays = daily.snowfall_sum.filter(s => s > 0.1).length;
  const rainDays = daily.precipitation_sum.filter(p => p > 0.1).length;
  const maxTemps = daily.temperature_2m_max;
  const minTemps = daily.temperature_2m_min;
  const avgMaxTemp = maxTemps.reduce((a, b) => a + b, 0) / daysCount;
  const avgMinTemp = minTemps.reduce((a, b) => a + b, 0) / daysCount;
  const maxWind = Math.max(...daily.windspeed_10m_max);

  if (snowDays >= daysCount / 2) {
    summary += "❄️ צפוי שבוע מושלג עם הצטברות משמעותית של שלג בימים רבים. ";
  } else if (snowDays > 0) {
    summary += `🌨️ שלג קל עד בינוני צפוי ב-${snowDays} ימים במהלך השבוע. `;
  } else {
    summary += "☀️ לא צפוי שלג משמעותי השבוע. ";
  }

  if (rainDays > 0 && snowDays === 0) {
    summary += `🌧️ גשם קל אפשרי ב-${rainDays} ימים. `;
  }

  summary += `🌡️ הטמפרטורות ינועו בין ${Math.round(Math.min(...minTemps))}°C ל-${Math.round(Math.max(...maxTemps))}°C. `;
  summary += `בממוצע, הטמפרטורה המקסימלית תהיה כ-${Math.round(avgMaxTemp)}°C והמינימלית כ-${Math.round(avgMinTemp)}°C. `;

  if (maxWind > 40) {
    summary += `💨 יתכנו רוחות חזקות, במיוחד בימים מסוימים (עד ${Math.round(maxWind)} קמ"ש). `;
  } else {
    summary += "🌬️ רוחות מתונות בדרך כלל. ";
  }

  // Daily breakdown for the first 3 days
  summary += "\n\n🗓️ פירוט לימים הקרובים:\n";
  for (let i = 0; i < Math.min(daysCount, 3); i++) {
    const day = daily.time[i];
    const dayDate = format(new Date(day), 'EEEE, dd/MM', { locale: he });
    const dayProcessed = processed[day];

    const nightWeatherText = weatherCodeMap[dayProcessed.night.code]?.text || 'לא ידוע';
    const amWeatherText = weatherCodeMap[dayProcessed.am.code]?.text || 'לא ידוע';
    const pmWeatherText = weatherCodeMap[dayProcessed.pm.code]?.text || 'לא ידוע';

    summary += `- ${dayDate}: בוקר: ${amWeatherText} (~${dayProcessed.am.avg_feels}°C מורגש). אחה"צ: ${pmWeatherText} (~${dayProcessed.pm.avg_feels}°C מורגש). לילה: ${nightWeatherText} (שלג: ${daily.snowfall_sum[i].toFixed(1)} ס"מ). טמפ' ינועו בין ${Math.round(daily.temperature_2m_min[i])}°C ל-${Math.round(daily.temperature_2m_max[i])}°C.\n`;
  }

  // Recommendation
  summary += "\n\n🎿 המלצת AI: ";
  if (snowDays >= daysCount / 2 && Math.min(...minTemps) <= 0) {
    summary += "תנאי סקי מצוינים צפויים עם שלג טרי. התכוננו לימים קרים ומהנים! ";
  } else if (Math.min(...minTemps) > 0 && snowDays === 0) {
    summary += "תנאי סקי פחות אופטימליים, עם טמפרטורות מעל האפס ושלג מועט. ייתכן שהמסלולים התחתונים יהיו פחות טובים. ";
  } else {
    summary += "תנאי סקי טובים ברוב הימים, אך כדאי לבדוק עדכונים יומיים לגבי מצב השלג. ";
  }

  if (maxWind > 40) {
    summary += "שימו לב לרוחות חזקות שעלולות להשפיע על פעילות ברכבלים ובשטח פתוח. מומלץ להתלבש בשכבות. ";
  }

  return summary;
};

export default function WeatherForecast({ resorts, defaultCountry, defaultResort, defaultResortName, defaultHeight, days = 7, hideLocationSelectors = false }) {
  // אם קיבלנו defaultResortName, מוצאים את היעד המתאים
  const resortFromName = defaultResortName ? resorts.find(r => 
    r.resort?.toLowerCase() === defaultResortName.toLowerCase() ||
    r.altNames?.some(a => a.toLowerCase() === defaultResortName.toLowerCase())
  ) : null;

  const [selectedCountry, setSelectedCountry] = useState(
    defaultCountry || resortFromName?.country || resorts?.[0]?.country
  );
  const [selectedResort, setSelectedResort] = useState(
    defaultResort || resortFromName?.resort || resorts?.[0]?.resort
  );
  const [selectedHeight, setSelectedHeight] = useState(
    defaultHeight || resortFromName?.heights?.[0] || resorts?.[0]?.heights?.[0]
  );
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForecast, setShowForecast] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiSummaryCard, setShowAiSummaryCard] = useState(false);

  const { toast } = useToast();

  const filteredResorts = useMemo(() => (resorts || []).filter(r => r.country === selectedCountry), [resorts, selectedCountry]);
  const resortDetails = useMemo(() => (resorts || []).find(r => r.resort === selectedResort), [resorts, selectedResort]);

  const processHourlyData = (hourly, daily) => {
    const processed = {};
    daily.time.forEach((day, dayIndex) => {
      processed[day] = {
        night: { code: 0, temp: [], feels: [], snow: 0, rain: 0 },
        am: { code: 0, temp: [], feels: [], snow: 0, rain: 0 },
        pm: { code: 0, temp: [], feels: [], snow: 0, rain: 0 },
      };

      for (let i = dayIndex * 24; i < (dayIndex + 1) * 24; i++) {
        if (!hourly.time[i]) continue;
        const hour = new Date(hourly.time[i]).getHours();
        const period = hour < 6 ? 'night' : hour < 12 ? 'am' : hour < 18 ? 'pm' : 'night';
        
        if (!processed[day][period]) {
          processed[day][period] = { code: 0, temp: [], feels: [], snow: 0, rain: 0 };
        }

        processed[day][period].temp.push(hourly.temperature_2m[i]);
        processed[day][period].feels.push(hourly.apparent_temperature[i]);
        processed[day][period].snow += hourly.snowfall[i];
        processed[day][period].rain += hourly.rain[i];
        
        if (hour === 3) {
             processed[day]['night'].code = hourly.weathercode[i];
        } else if (hour === 9) {
             processed[day]['am'].code = hourly.weathercode[i];
        } else if (hour === 15) {
             processed[day]['pm'].code = hourly.weathercode[i];
        }
      }
    });

    Object.keys(processed).forEach(day => {
      ['night', 'am', 'pm'].forEach(period => {
        const p = processed[day][period];
        const { icon: Icon, text } = weatherCodeMap[p.code] || getDefaultWeather();
        p.icon = <Icon className="w-3 h-3 sm:w-4 sm:h-4" />;
        p.text = text;
        p.avg_feels = p.feels.length ? (p.feels.reduce((a, b) => a + b, 0) / p.feels.length).toFixed(0) : '-';
      });
    });

    return processed;
  };
  
  const fetchWeather = useCallback(async () => {
    if (!resortDetails) return;
    setLoading(true);
    setError(null);
    setShowForecast(false);
    setShowAiSummaryCard(false);
    setAiSummary(null);

    const { lat, lon } = resortDetails;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&elevation=${selectedHeight}&timezone=auto&forecast_days=${days}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,weathercode,windspeed_10m_max,relative_humidity_2m_mean&hourly=temperature_2m,apparent_temperature,rain,snowfall,weathercode`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`שגיאה בטעינת מזג האוויר: ${response.statusText}`);
      const data = await response.json();
      data.processed = processHourlyData(data.hourly, data.daily);
      setForecast(data);
    } catch (e) {
      setError(e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [resortDetails, days, selectedHeight]);

  const handleShare = useCallback(() => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast({
        title: "הועתק!",
        description: "הקישור לתחזית הועתק ללוח הגזירים.",
        duration: 2000,
      });
    }).catch((err) => {
      console.error("Failed to copy URL: ", err);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת העתקת הקישור.",
        variant: "destructive",
        duration: 2000,
      });
    });
  }, [toast]);

  const handleAiInsight = useCallback(async () => {
    if (!forecast || !resortDetails) {
      toast({
        title: "שגיאה",
        description: "אין נתוני תחזית זמינים עבור ניתוח AI.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setLoadingAi(true);
    setShowAiSummaryCard(true);
    setAiSummary(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const summary = generateAiSummaryText(forecast, weatherCodeMap, resortDetails.resort);
      setAiSummary(summary);
    } catch (err) {
      console.error("Failed to generate AI summary:", err);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת תקציר ה-AI.",
        variant: "destructive",
        duration: 2000,
      });
      setAiSummary("אירעה שגיאה ביצירת תקציר ה-AI.");
    } finally {
      setLoadingAi(false);
    }
  }, [forecast, resortDetails, toast]);

  const handleCloseAiSummary = () => {
    setShowAiSummaryCard(false);
    setAiSummary(null);
  };

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    if (filteredResorts.length > 0) {
      if (!filteredResorts.some(r => r.resort === selectedResort)) {
        setSelectedResort(filteredResorts[0].resort);
        if (filteredResorts[0].heights) {
          setSelectedHeight(filteredResorts[0].heights[0]);
        }
      } else {
        const currentResort = filteredResorts.find(r => r.resort === selectedResort);
        if (currentResort && !currentResort.heights.includes(selectedHeight)) {
           setSelectedHeight(currentResort.heights[0]);
        }
      }
    }
  }, [selectedCountry, filteredResorts, selectedResort, selectedHeight]);
  
  useEffect(() => {
    if (forecast && !loading && !error) {
      setShowForecast(true);
    } else {
      setShowForecast(false);
      setShowAiSummaryCard(false);
      setAiSummary(null);
    }
  }, [forecast, loading, error]);

  if (!resorts || resorts.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>תחזית מזג אוויר</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">שגיאה: לא נטען מידע על אתרי סקי לתחזית.</p>
        </CardContent>
      </Card>
    );
  }

  const TempCell = ({ temp }) => {
    const tempNum = parseFloat(temp);
    let colorClass = 'text-slate-700';
    if (tempNum <= 0) colorClass = 'text-blue-600';
    else if (tempNum > 10) colorClass = 'text-orange-600';
    return <span className={`font-bold ${colorClass} text-xs sm:text-sm`}>{Math.round(tempNum)}°</span>
  };

  return (
    <Card className="w-full bg-white rounded-xl shadow-lg overflow-hidden relative" dir="rtl">
        <CardHeader className="p-2 sm:p-4 pb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CloudSun className="w-6 h-6 text-blue-500" />
                    תחזית מזג אוויר
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleAiInsight} className="flex items-center gap-1 min-w-[100px]">
                        {loadingAi ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Sparkle className="w-4 h-4" />
                        )}
                        <span>AI insights</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-1 min-w-[70px]">
                        <Share className="w-4 h-4" /><span>שתף</span>
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 pt-4">
              
              {!hideLocationSelectors && (
                <>
                  <div>
                      <Label className="text-sm font-medium text-slate-600 mb-1 block">מדינה</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="text-right flex-row-reverse">
                            <SelectValue placeholder="בחר מדינה..." />
                          </SelectTrigger>

                          <SelectContent dir="rtl" className="text-right">
                              {[...new Set(resorts.map(r => r.country))].map(c => (<SelectItem key={c} value={c} className="text-right">{c}</SelectItem>))}
                          </SelectContent>
                      </Select>
                  </div>
                  
                  <div>
                      <Label className="text-sm font-medium text-slate-600 mb-1 block">אתר</Label>
                      <Select value={selectedResort} onValueChange={setSelectedResort}>
                          <SelectTrigger className="text-right flex-row-reverse">
                            <SelectValue placeholder="בחר אתר סקי..." />
                          </SelectTrigger>
                          
                          <SelectContent className="rtl text-right">
                              {filteredResorts.map(r =>( <SelectItem key={r.resort} value={r.resort} className="text-right" >{r.resort}</SelectItem>))}
                          </SelectContent>
                      </Select>
                  </div>
                </>
              )}

                <div>
                    <Label className="text-sm font-medium text-slate-600 mb-1 block">גובה בהר (מ')</Label>
                    <Select value={selectedHeight?.toString()} onValueChange={v => setSelectedHeight(parseInt(v))}>
                        <SelectTrigger className="text-right flex-row-reverse">
                          <SelectValue placeholder="בחר גובה..." />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="text-right">
                            {resortDetails?.heights.map(h =>( <SelectItem key={h} value={h.toString()} className="text-right">
                            <div className="flex justify-end gap-1" dir="ltr">
                            <span>{h.toLocaleString()}</span>
                            </div>
                            </SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>

        <CardContent className="p-0">
            {loading && (
              <div className="flex justify-center items-center h-64 p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            {error && (
                <div className="text-center p-4 bg-red-50 text-red-700 mx-2 sm:mx-4 rounded-lg flex flex-col items-center justify-center gap-4 h-64">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6"/> 
                        <span className="text-base sm:text-lg">{error}</span>
                    </div>
                    <Button onClick={fetchWeather} className="mt-2">נסה שוב</Button>
                </div>
            )}

            {/* AI Summary Card */}
            {showAiSummaryCard && (forecast || loadingAi) && (
                <Card className="mx-2 sm:mx-4 mb-4 bg-blue-50 border-blue-200 shadow-sm relative">
                    <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-0">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-blue-800 flex items-center gap-2">
                            <Sparkle className="w-5 h-5 text-blue-600"/>
                            תובנות AI
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleCloseAiSummary} className="p-1 h-auto text-blue-600 hover:text-blue-800">
                            <X className="w-4 h-4"/>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-2 text-blue-900 text-sm sm:text-base">
                        {loadingAi ? (
                            <div className="flex justify-center items-center h-24">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            aiSummary ? <p className="whitespace-pre-wrap">{aiSummary}</p> : <p>לא ניתן היה ליצור תקציר AI. נסה שוב מאוחר יותר.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Forecast Display with Fade-in Animation */}
            {forecast && !loading && !error && (
                <div className={`transition-opacity duration-500 ease-out ${showForecast ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-full overflow-x-auto overflow-y-hidden">
                    <table className="min-w-max max-w-full border-collapse text-center whitespace-nowrap table-fixed">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="sticky right-0 bg-slate-50 z-20 p-2 text-xs sm:text-sm font-medium text-slate-600 w-20 sm:w-24 border-b"></th>
                                {forecast.daily.time.map((day) => (
                                    <th key={day} className="p-2 text-xs sm:text-sm font-medium text-slate-600 min-w-[70px] sm:min-w-[80px] border-b">
                                        <div>{format(new Date(day), 'EEEE', { locale: he })}</div>
                                        <div className="font-normal text-slate-500">{format(new Date(day), 'dd/MM')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t">
                                <td className="sticky right-0 bg-white z-10 p-2 font-medium text-xs sm:text-sm text-slate-700 w-20 sm:w-24">לילה</td>
                                {forecast.daily.time.map(day => (
                                    <td key={`${day}-night`} className="p-2 border-l last:border-r">
                                        <div className="flex flex-col items-center gap-1">
                                            {forecast.processed[day].night.icon}
                                            <span className="text-xs text-slate-500">{forecast.processed[day].night.text}</span>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-t bg-slate-50/50">
                                <td className="sticky right-0 bg-slate-50/50 z-10 p-2 font-medium text-xs sm:text-sm text-slate-700 w-20 sm:w-24">בוקר</td>
                                {forecast.daily.time.map(day => (
                                    <td key={`${day}-am`} className="p-2 border-l last:border-r">
                                        <div className="flex flex-col items-center gap-1">
                                            {forecast.processed[day].am.icon}
                                            <span className="text-xs text-slate-500">{forecast.processed[day].am.text}</span>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-t">
                                <td className="sticky right-0 bg-white z-10 p-2 font-medium text-xs sm:text-sm text-slate-700 w-20 sm:w-24">אחה"צ</td>
                                {forecast.daily.time.map(day => (
                                    <td key={`${day}-pm`} className="p-2 border-l last:border-r">
                                        <div className="flex flex-col items-center gap-1">
                                            {forecast.processed[day].pm.icon}
                                            <span className="text-xs text-slate-500">{forecast.processed[day].pm.text}</span>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-t bg-slate-50/50">
                                <td className="sticky right-0 bg-slate-50/50 z-10 p-2 font-medium text-xs sm:text-sm text-slate-700 w-20 sm:w-24">טמפ' מורגשת</td>
                                {forecast.daily.time.map(day => (
                                    <td key={`${day}-feels`} className="p-2 border-l last:border-r">
                                        <div className="flex justify-center items-center gap-1">
                                          <Thermometer className="w-3 h-3 text-red-500"/>
                                          <TempCell temp={forecast.processed[day].pm.avg_feels} />
                                        </div>
                                    </td>
                                ))}
                            </tr>
                             <tr className="border-t">
                                <td className="sticky right-0 bg-white z-10 p-2 font-medium text-xs sm:text-sm text-slate-700 w-20 sm:w-24">טמפ' (גבוה/נמוך)</td>
                                {forecast.daily.time.map((day, i) => (
                                    <td key={`${day}-temp`} className="p-2 space-x-1 space-x-reverse border-l last:border-r">
                                        <TempCell temp={forecast.daily.temperature_2m_max[i]} />
                                        <span className="text-slate-400">/</span>
                                        <TempCell temp={forecast.daily.temperature_2m_min[i]} />
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-t bg-slate-50/50">
                                <td className="sticky right-0 bg-slate-50/50 z-10 p-2 font-medium text-xs sm:text-sm text-slate-700 w-20 sm:w-24">שלג מצטבר</td>
                                 {forecast.daily.time.map((day, i) => (
                                    <td key={`${day}-snow`} className="p-2 border-l last:border-r">
                                       <div className="flex justify-center items-center gap-1">
                                          <Snowflake className="w-3 h-3 text-blue-400"/>
                                          <span className="text-xs sm:text-sm">{forecast.daily.snowfall_sum[i].toFixed(1)} cm</span>
                                       </div>
                                    </td>
                                ))}
                            </tr>
                             <tr className="border-t">
                                <td className="sticky right-0 bg-white z-10 p-2 font-medium text-xs sm:text-sm text-slate-700 w-20 sm:w-24">רוח</td>
                                 {forecast.daily.time.map((day, i) => (
                                    <td key={`${day}-wind`} className="p-2 border-l last:border-r">
                                       <div className="flex justify-center items-center gap-1">
                                          <Wind className="w-3 h-3 text-gray-500"/>
                                          <span className="text-xs sm:text-sm">{forecast.daily.windspeed_10m_max[i].toFixed(0)} קמ"ש</span>
                                       </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}