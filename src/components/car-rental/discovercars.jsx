import DISCOVERCARS_LOCATIONS from './airports_discovercars_mapping';

/**
 * קידוד Base64 + URL encode
 * שלב 1: JSON → Base64
 * שלב 2: Base64 → URL encoded (= הופך ל-%3D%3D)
 */
function encodeToBase64Url(obj) {
  const jsonString = JSON.stringify(obj);
  const base64 = window.btoa(unescape(encodeURIComponent(jsonString)));
  return encodeURIComponent(base64);
}

/**
 * מחזיר Location ID של DiscoverCars לפי קוד IATA
 */
function getLocationId(iata) {
  if (!iata) return null;
  const normalized = String(iata).toUpperCase().trim();
  const location = DISCOVERCARS_LOCATIONS[normalized];
  return location?.discovercars_location_id || null;
}

/**
 * פונקציה ראשית: generateDiscoverCarsUrl
 * @param {Object} travelData - נתוני הטיול
 * @param {string} travelData.iata - קוד IATA של שדה התעופה
 * @param {string} travelData.pickupDate - תאריך איסוף (YYYY-MM-DD)
 * @param {string} travelData.dropoffDate - תאריך החזרה (YYYY-MM-DD)
 * @param {string} [travelData.pickupTime='10:00'] - שעת איסוף
 * @param {string} [travelData.dropoffTime='10:00'] - שעת החזרה
 * @param {string} [travelData.countryCode='IL'] - קוד מדינה
 * @returns {{url: string, needsManualAirport?: boolean}}
 */
function generateDiscoverCarsUrl(travelData) {
  // ברירות מחדל
  const pickupTime = travelData.pickupTime || '10:00';
  const dropoffTime = travelData.dropoffTime || '10:00';
  const countryCode = travelData.countryCode || 'IL';
  
  // שלב 1: משיכת Location ID
  const locationId = getLocationId(travelData.iata);
  
  // אם אין Location ID - נחזיר דף כללי
  if (!locationId) {
    return {
      url: 'https://www.discovercars.com/',
      needsManualAirport: true
    };
  }
  
  // שלב 2: הרכבת אובייקט JSON
  const searchPayload = {
    PickupLocationId: locationId,
    DropOffLocationId: locationId,
    PickupDateTime: `${travelData.pickupDate}T${pickupTime}:00`,
    DropOffDateTime: `${travelData.dropoffDate}T${dropoffTime}:00`,
    ResidenceCountry: countryCode,
    DriverAge: 35,
    Hash: ""
  };
  
  // שלב 3: קידוד נתונים
  const encodedSearch = encodeToBase64Url(searchPayload);
  
  // שלב 4: הרכבת URL סופי ללא UUID
  // מבנה פשוט: /search?sq=...
  const finalUrl = `https://www.discovercars.com/search?sq=${encodedSearch}&searchVersion=2`;
  
  return {
    url: finalUrl,
    needsManualAirport: false
  };
}

/**
 * מחזיר הערות למשתמש
 */
function getPreflightNotes(travelData) {
  const notes = [];
  const locationId = getLocationId(travelData.iata);
  
  if (!locationId) {
    notes.push('⚠️ לא נמצא קוד מיקום לשדה התעופה. בדף שייפתח, בחרו ידנית את שדה התעופה הרצוי.');
  }
  
  notes.push('💡 שעות האיסוף וההחזרה הוגדרו כברירת מחדל ל-10:00.');
  notes.push('⏰ מומלץ לקבוע שעת איסוף לפחות שעה אחרי זמן הנחיתה.');
  
  return notes;
}

// ייצוא Provider Object
const discovercarsProvider = {
  id: 'discovercars',
  name: 'DiscoverCars',
  generateUrl: generateDiscoverCarsUrl,
  getPreflightNotes: getPreflightNotes
};

export default discovercarsProvider;