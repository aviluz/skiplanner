import discovercarsProvider from './discovercars';

/**
 * רשימת כל ספקי הרכב הזמינים
 * ניתן להוסיף ספקים נוספים כאן בעתיד
 */
const PROVIDERS = {
  discovercars: discovercarsProvider,
  // ניתן להוסיף כאן ספקים נוספים:
  // rentalcars: rentalcarsProvider,
  // expedia: expediaProvider,
};

/**
 * פונקציה ראשית: generateRentalUrl
 * שכבת ניתוב (Strategy Pattern) - מנתבת לספק הנכון
 * 
 * @param {string} supplierName - שם הספק (למשל 'discovercars')
 * @param {Object} travelData - נתוני הטיול
 * @returns {{url: string, needsManualAirport?: boolean}}
 */
export function generateRentalUrl(supplierName, travelData) {
  const provider = PROVIDERS[supplierName];
  
  if (!provider) {
    console.error(`Unknown car rental provider: ${supplierName}`);
    return {
      url: 'https://www.google.com/search?q=car+rental',
      error: 'Unknown provider'
    };
  }
  
  return provider.generateUrl(travelData);
}

/**
 * מחזיר הערות למשתמש לפני החיפוש
 * 
 * @param {string} supplierName - שם הספק
 * @param {Object} travelData - נתוני הטיול
 * @returns {string[]} - רשימת הערות
 */
export function getCarSearchNotes(supplierName, travelData) {
  const provider = PROVIDERS[supplierName];
  
  if (!provider || !provider.getPreflightNotes) {
    return [];
  }
  
  return provider.getPreflightNotes(travelData);
}

/**
 * מחזיר רשימת כל הספקים הזמינים
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDERS).map(key => ({
    id: key,
    name: PROVIDERS[key].name
  }));
}