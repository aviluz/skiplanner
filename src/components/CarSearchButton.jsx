import React from 'react';
import { generateRentalUrl, getCarSearchNotes } from './car-rental/buildUrl';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * קומפוננטת כפתור חיפוש רכב
 * @param {Object} props
 * @param {string} [props.provider='discovercars'] - ספק הרכב
 * @param {Object} props.params - פרמטרי החיפוש
 * @param {string} [props.className] - מחלקות CSS נוספות
 * @param {string} [props.buttonText] - טקסט הכפתור
 */
export default function CarSearchButton({ 
  provider = 'discovercars', 
  params = {}, 
  className = '',
  buttonText = 'חיפוש רכב'
}) {
  const result = generateRentalUrl(provider, params);
  const href = result.url || result;
  const notes = getCarSearchNotes(provider, params);

  return (
    <div className="space-y-3 text-right">
      {/* הודעות חשובות למשתמש */}
      {notes.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            <ul className="list-none pr-0 space-y-1">
              {notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* כפתור הקישור */}
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        <Button className={`w-full ${className}`} size="lg">
          {buttonText}
          <ExternalLink className="w-5 h-5 mr-2" />
        </Button>
      </a>
    </div>
  );
}