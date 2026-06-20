
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, Snowflake, Zap, CloudFog, Wind, Umbrella, CloudDrizzle } from 'lucide-react';

export const resortsData = [
  { "country":"איטליה", "resort":"Cervinia", "altNames": ["צ'רביניה", "Cervinia-Zermatt"], "lat":45.934, "lon":7.63, "heights":[1524, 2050, 3480] },
  { "country":"איטליה", "resort":"Sestriere", "altNames": ["ססטרייר", "Sestriere - Via Lattea"], "lat":44.957, "lon":6.879, "heights":[1840, 2035, 2700] },
  { "country":"איטליה", "resort":"Madonna di Campiglio", "altNames": ["מדונה די קמפיליו"], "lat":46.229, "lon":10.826, "heights":[1550, 2100, 2500] },
  { "country":"איטליה", "resort":"Livigno", "altNames": ["ליביניו"], "lat":46.538, "lon":10.137, "heights":[1816, 2200, 2796] },
  { "country":"איטליה", "resort":"Val Gardena", "altNames": ["ואל גארדנה", "val gardena"], "lat":46.556, "lon":11.753, "heights":[1236, 2000, 2518] },
  { "country":"איטליה", "resort":"Megeve (Evasion Mont Blanc)", "altNames": ["מז'ב", "Megeve"], "lat":45.85, "lon":6.617, "heights":[1113, 1800, 2350] },
  { "country":"איטליה", "resort":"Alto Sangro (Roccaraso)", "altNames": ["אברוצו", "Roccaraso"], "lat":41.847, "lon":14.074, "heights":[1300, 1600, 2140] },
  { "country":"איטליה", "resort":"La Thuile", "altNames": ["לה טוויל", "la thuile"], "lat":45.718, "lon":6.948, "heights":[1441, 2200, 2800] },
  { "country":"איטליה", "resort":"Courmayeur", "altNames": ["קורמיור"], "lat":45.791, "lon":6.967, "heights":[1224, 1700, 2755] },
  { "country":"איטליה", "resort":"Canazei (Dolomiti)", "altNames": ["קנזיי", "Canazei"], "lat":46.476, "lon":11.771, "heights":[1450, 2000, 2950] },
  { "country":"איטליה", "resort":"Pila", "altNames": ["pila", "פילה"], "lat":45.737, "lon":7.313, "heights":[1800, 2000, 2750] },

  { "country":"צרפת", "resort":"Orelle (Val Thorens access)", "altNames": ["orelle"], "lat":45.219, "lon":6.532, "heights":[900, 2300, 3230] },
  { "country":"צרפת", "resort":"Val Thoren", "altNames": ["ואל טורנס"], "lat":45.298, "lon":6.581, "heights":[2300, 2600, 3230] },
  { "country":"צרפת", "resort":"Valmeinier 1800", "altNames": ["Valmeinier", "Valmeinier 1800"], "lat":45.188, "lon":6.481, "heights":[1500, 1800, 2750] },
  { "country":"צרפת", "resort":"Serre Chevalier", "altNames": ["סר שבלייה"], "lat":44.934, "lon":6.586, "heights":[1200, 2000, 2800] },

  { "country":"אוסטריה", "resort":"Ischgl", "altNames": ["אישגל"], "lat":47.012, "lon":10.288, "heights":[1377, 2300, 2872] },
  { "country":"אוסטריה", "resort":"Schladming (Ski Amade)", "altNames": ["אמדה", "סקי אמדה"], "lat":47.393, "lon":13.689, "heights":[745, 1600, 2700] },

  { "country":"שוויץ", "resort":"Zermatt", "altNames": ["זרמט"], "lat":46.021, "lon":7.749, "heights":[1620, 2200, 3883] },
  { "country":"שוויץ", "resort":"Arosa", "altNames": ["ארוזה"], "lat":46.777, "lon":9.656, "heights":[1739, 2250, 2653] },

  { "country":"בולגריה", "resort":"Bansko", "altNames": ["בנסקו"], "lat":41.838, "lon":23.488, "heights":[990, 1600, 2560] },
  { "country":"בולגריה", "resort":"Borovets", "altNames": ["בורוביץ'"], "lat":42.272, "lon":23.605, "heights":[1300, 1600, 2560] },

  { "country":"גיאורגיה", "resort":"Gudauri", "altNames": ["גודאורי"], "lat":42.476, "lon":44.485, "heights":[1990, 2500, 3279] }
];

export const weatherCodeMap = {
  0: { text: "שמשי", icon: Sun },
  1: { text: "מעונן חלקית", icon: CloudSun },
  2: { text: "מעונן", icon: Cloud },
  3: { text: "מעונן", icon: Cloud },
  45: { text: "ערפל", icon: CloudFog },
  46: { text: "ערפל קופא", icon: CloudFog },
  51: { text: "טפטוף קל", icon: CloudDrizzle },
  53: { text: "טפטוף", icon: CloudDrizzle },
  55: { text: "טפטוף חזק", icon: CloudDrizzle },
  61: { text: "גשם קל", icon: CloudRain },
  63: { text: "גשם", icon: CloudRain },
  65: { text: "גשם חזק", icon: CloudRain },
  71: { text: "שלג קל", icon: CloudSnow },
  73: { text: "שלג", icon: CloudSnow },
  75: { text: "שלג כבד", icon: Snowflake },
  77: { text: "ברד", icon: CloudSnow },
  80: { text: "ממטרים קלים", icon: CloudRain },
  81: { text: "ממטרים", icon: CloudRain },
  82: { text: "ממטרים חזקים", icon: Umbrella },
  85: { text: "ממטרי שלג", icon: CloudSnow },
  86: { text: "ממטרי שלג כבדים", icon: Snowflake },
  95: { text: "סופת רעמים", icon: Zap },
  96: { text: "סופת רעמים וברד", icon: Zap },
  99: { text: "סופת רעמים וברד כבד", icon: Zap }
};

export const getDefaultWeather = () => ({ text: "לא זמין", icon: Wind });
